import asyncio
import json
import math
import traceback
import uuid
import dirtyjson
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from models.presentation_outline_model import PresentationOutlineModel
from models.sql.presentation import PresentationModel
from models.sql.outline_job import OutlineJobModel, OutlineJobStatus
from models.sse_response import (
    SSECompleteResponse,
    SSEErrorResponse,
    SSEResponse,
    SSEStatusResponse,
)
from services.temp_file_service import TEMP_FILE_SERVICE
from services.database import get_async_session, async_session_maker
from services.documents_loader import DocumentsLoader
from utils.llm_calls.generate_presentation_outlines import generate_ppt_outline
from utils.ppt_utils import get_presentation_title_from_outlines
from utils.logger import logger

OUTLINES_ROUTER = APIRouter(prefix="/outlines", tags=["Outlines"])


@OUTLINES_ROUTER.get("/stream/health")
async def check_outline_stream_health():
    """
    Health check endpoint for outline streaming service.
    Returns service status and configuration.
    """
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "service": "outline_streaming",
        "capabilities": {
            "max_concurrent_streams": 50,
            "supports_reconnection": True,
            "keepalive_interval_seconds": 5,
            "max_retry_attempts": 3,
            "supports_document_loading": True
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@OUTLINES_ROUTER.get("/status/{id}")
async def get_outline_status(
    id: uuid.UUID, sql_session: AsyncSession = Depends(get_async_session)
):
    """
    Get the status of outline generation for polling-based approach.
    Returns the current outlines if available.
    """
    presentation = await sql_session.get(PresentationModel, id)

    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    # Check if outlines exist
    if presentation.outlines and presentation.outlines.get("slides"):
        return {
            "status": "complete",
            "presentation": presentation.model_dump(mode="json"),
            "outlines": presentation.outlines,
            "progress": {
                "current": len(presentation.outlines.get("slides", [])),
                "total": presentation.n_slides,
                "percentage": 100
            }
        }
    else:
        return {
            "status": "pending",
            "presentation_id": str(id),
            "progress": {
                "current": 0,
                "total": presentation.n_slides,
                "percentage": 0
            }
        }


@OUTLINES_ROUTER.post("/generate/{id}")
async def generate_outlines(
    id: uuid.UUID, sql_session: AsyncSession = Depends(get_async_session)
):
    """
    Generate outlines synchronously (non-streaming).
    This endpoint is used for polling-based approach.
    """
    presentation = await sql_session.get(PresentationModel, id)

    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    # If outlines already exist, return them
    if presentation.outlines and presentation.outlines.get("slides"):
        return {
            "status": "complete",
            "presentation": presentation.model_dump(mode="json"),
            "outlines": presentation.outlines
        }

    logger.info(
        f"Starting outline generation (polling) for presentation ID: {id}",
        extra={"extra_fields": {
            "event_type": "outline_generate_start",
            "presentation_id": str(id),
            "n_slides": presentation.n_slides
        }}
    )

    temp_dir = TEMP_FILE_SERVICE.create_temp_dir()

    try:
        # Load documents if file paths exist
        document_content = ""
        if presentation.file_paths:
            logger.debug(f"[OutlineGenerate {id}] Loading {len(presentation.file_paths)} documents")
            documents_loader = DocumentsLoader(temp_dir)
            documents = await documents_loader.aload_from_paths(presentation.file_paths)
            document_content = "\n\n".join([doc.page_content for doc in documents])
            logger.debug(f"[OutlineGenerate {id}] Documents loaded, content length: {len(document_content)}")

        # Generate outlines
        n_slides_to_generate = presentation.n_slides
        if presentation.include_table_of_contents:
            n_slides_to_generate = math.ceil(n_slides_to_generate * 1.3)

        logger.debug(f"[OutlineGenerate {id}] Generating outlines for {n_slides_to_generate} slides")

        # Collect all chunks
        presentation_outlines_text = ""
        async for chunk in generate_ppt_outline(
            n_slides_to_generate,
            presentation.content,
            presentation.language,
            document_content,
            presentation.instructions,
            presentation.tone,
            presentation.verbosity,
        ):
            presentation_outlines_text += chunk

        logger.debug(f"[OutlineGenerate {id}] LLM generation completed, text length: {len(presentation_outlines_text)}")

        # Parse outlines
        try:
            presentation_outlines_json = dict(dirtyjson.loads(presentation_outlines_text))
        except Exception as e:
            logger.error(f"[OutlineGenerate {id}] JSON parsing failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse AI response. Please try again."
            )

        if "slides" not in presentation_outlines_json:
            logger.error(f"[OutlineGenerate {id}] Missing 'slides' field in response")
            raise HTTPException(
                status_code=500,
                detail="AI returned invalid outline structure. Please try again."
            )

        # Create model and trim to requested slides
        presentation_outlines = PresentationOutlineModel(**presentation_outlines_json)
        presentation_outlines.slides = presentation_outlines.slides[:n_slides_to_generate]

        # Save to database
        presentation.outlines = presentation_outlines.model_dump()
        presentation.title = get_presentation_title_from_outlines(presentation_outlines)

        sql_session.add(presentation)
        await sql_session.commit()

        logger.info(f"[OutlineGenerate {id}] Outlines saved successfully")

        return {
            "status": "complete",
            "presentation": presentation.model_dump(mode="json"),
            "outlines": presentation.outlines
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OutlineGenerate {id}] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during outline generation: {str(e)}"
        )
    finally:
        TEMP_FILE_SERVICE.cleanup_temp_dir(temp_dir)


async def process_outline_job(job_id: uuid.UUID, presentation_id: uuid.UUID):
    """
    Background task to generate outlines.
    Uses its own database session since it runs in a background task.
    """
    async with async_session_maker() as sql_session:
        try:
            # Get job and presentation
            job = await sql_session.get(OutlineJobModel, job_id)
            presentation = await sql_session.get(PresentationModel, presentation_id)

            if not job or not presentation:
                logger.error(f"[OutlineJob {job_id}] Job or presentation not found")
                return

            # Mark as processing
            job.mark_processing("🚀 מתחילים לעבוד...")
            sql_session.add(job)
            await sql_session.commit()

            logger.info(
                f"[OutlineJob {job_id}] Starting outline generation for presentation: {presentation_id}",
                extra={"extra_fields": {
                    "event_type": "outline_job_start",
                    "job_id": str(job_id),
                    "presentation_id": str(presentation_id),
                    "n_slides": presentation.n_slides
                }}
            )

            temp_dir = TEMP_FILE_SERVICE.create_temp_dir()

            try:
                # Load documents if file paths exist
                document_content = ""
                if presentation.file_paths:
                    job.update_progress(0, 100, "📄 קורא את המסמכים שלך...")
                    sql_session.add(job)
                    await sql_session.commit()

                    logger.debug(f"[OutlineJob {job_id}] Loading {len(presentation.file_paths)} documents")
                    documents_loader = DocumentsLoader(temp_dir)
                    documents = await documents_loader.aload_from_paths(presentation.file_paths)
                    document_content = "\n\n".join([doc.page_content for doc in documents])
                    logger.debug(f"[OutlineJob {job_id}] Documents loaded, content length: {len(document_content)}")

                # Calculate slides to generate
                n_slides_to_generate = presentation.n_slides
                if presentation.include_table_of_contents:
                    n_slides_to_generate = math.ceil(n_slides_to_generate * 1.3)

                # Update progress - starting generation
                job.update_progress(10, 100, "🧠 חושב על מבנה המצגת...")
                sql_session.add(job)
                await sql_session.commit()

                logger.debug(f"[OutlineJob {job_id}] Generating outlines for {n_slides_to_generate} slides")

                # Collect all chunks
                presentation_outlines_text = ""
                chunk_count = 0
                async for chunk in generate_ppt_outline(
                    presentation.content,
                    n_slides_to_generate,
                    presentation.language,
                    document_content,
                    presentation.tone,
                    presentation.verbosity,
                    presentation.instructions,
                    presentation.include_title_slide,
                    presentation.web_search,
                ):
                    if isinstance(chunk, HTTPException):
                        raise chunk

                    presentation_outlines_text += chunk
                    chunk_count += 1

                    # Update progress periodically
                    if chunk_count % 10 == 0:
                        progress = min(10 + int((chunk_count / 100) * 70), 80)
                        job.update_progress(progress, 100, f"✨ יוצר תוכן מדהים...")
                        sql_session.add(job)
                        await sql_session.commit()

                logger.debug(f"[OutlineJob {job_id}] LLM generation completed, text length: {len(presentation_outlines_text)}")

                # Log the raw response for debugging truncation issues
                logger.debug(f"[OutlineJob {job_id}] Raw LLM response (first 500 chars): {presentation_outlines_text[:500]}")
                logger.debug(f"[OutlineJob {job_id}] Raw LLM response (last 500 chars): {presentation_outlines_text[-500:] if len(presentation_outlines_text) > 500 else presentation_outlines_text}")

                # Check if response looks complete (should end with closing brace)
                stripped_text = presentation_outlines_text.strip()
                if not stripped_text.endswith('}'):
                    logger.warning(f"[OutlineJob {job_id}] LLM response may be truncated - does not end with '}}'. Last 100 chars: {stripped_text[-100:]}")

                # Update progress - parsing
                job.update_progress(85, 100, "🔧 מסדר את הפרטים...")
                sql_session.add(job)
                await sql_session.commit()

                # Parse outlines
                try:
                    presentation_outlines_json = dict(dirtyjson.loads(presentation_outlines_text))
                    logger.debug(f"[OutlineJob {job_id}] Parsed JSON keys: {list(presentation_outlines_json.keys())}")
                    if "slides" in presentation_outlines_json:
                        logger.debug(f"[OutlineJob {job_id}] Number of slides parsed: {len(presentation_outlines_json['slides'])}")
                        # Log last slide to check for truncation
                        if presentation_outlines_json['slides']:
                            last_slide = presentation_outlines_json['slides'][-1]
                            logger.debug(f"[OutlineJob {job_id}] Last slide title: {last_slide.get('title', 'N/A')}")
                            logger.debug(f"[OutlineJob {job_id}] Last slide content (last 200 chars): {str(last_slide.get('content', ''))[-200:]}")
                except Exception as e:
                    logger.error(f"[OutlineJob {job_id}] JSON parsing failed: {str(e)}")
                    logger.error(f"[OutlineJob {job_id}] Failed text preview: {presentation_outlines_text[:1000]}...")
                    job.mark_failed("שגיאה בעיבוד תשובת ה-AI. נסה שוב.")
                    sql_session.add(job)
                    await sql_session.commit()
                    return

                if "slides" not in presentation_outlines_json:
                    logger.error(f"[OutlineJob {job_id}] Missing 'slides' field in response")
                    job.mark_failed("מבנה תשובה לא תקין מה-AI. נסה שוב.")
                    sql_session.add(job)
                    await sql_session.commit()
                    return

                # Create model and trim to requested slides
                presentation_outlines = PresentationOutlineModel(**presentation_outlines_json)
                presentation_outlines.slides = presentation_outlines.slides[:n_slides_to_generate]

                # Update progress - saving
                job.update_progress(95, 100, "💾 שומר את היצירה...")
                sql_session.add(job)
                await sql_session.commit()

                # Save to presentation
                presentation.outlines = presentation_outlines.model_dump()
                presentation.title = get_presentation_title_from_outlines(presentation_outlines)
                sql_session.add(presentation)
                await sql_session.commit()

                # Mark job as completed
                job.mark_completed(
                    result={
                        "presentation": presentation.model_dump(mode="json"),
                        "outlines": presentation.outlines
                    },
                    message="🎉 המתווה מוכן!"
                )
                job.progress_current = len(presentation_outlines.slides)
                job.progress_total = len(presentation_outlines.slides)
                sql_session.add(job)
                await sql_session.commit()

                logger.info(
                    f"[OutlineJob {job_id}] Completed successfully",
                    extra={"extra_fields": {
                        "event_type": "outline_job_complete",
                        "job_id": str(job_id),
                        "presentation_id": str(presentation_id),
                        "slides_count": len(presentation_outlines.slides)
                    }}
                )

            finally:
                TEMP_FILE_SERVICE.cleanup_temp_dir(temp_dir)

        except HTTPException as e:
            logger.error(f"[OutlineJob {job_id}] HTTP error: {e.detail}")
            job = await sql_session.get(OutlineJobModel, job_id)
            if job:
                job.mark_failed(e.detail)
                sql_session.add(job)
                await sql_session.commit()

        except Exception as e:
            logger.error(f"[OutlineJob {job_id}] Unexpected error: {str(e)}", exc_info=True)
            job = await sql_session.get(OutlineJobModel, job_id)
            if job:
                job.mark_failed(f"שגיאה בלתי צפויה: {str(e)}")
                sql_session.add(job)
                await sql_session.commit()


@OUTLINES_ROUTER.post("/job/{id}", response_model=OutlineJobModel)
async def start_outline_job(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    sql_session: AsyncSession = Depends(get_async_session)
):
    """
    Start a background job to generate outlines.
    Returns immediately with a job ID that can be polled for status.
    """
    presentation = await sql_session.get(PresentationModel, id)

    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    # Check if outlines already exist
    if presentation.outlines and presentation.outlines.get("slides"):
        # Return a completed job with existing outlines
        job = OutlineJobModel(
            presentation_id=id,
            status=OutlineJobStatus.COMPLETED.value,
            message="✅ המתווה כבר מוכן!",
            progress_current=len(presentation.outlines.get("slides", [])),
            progress_total=len(presentation.outlines.get("slides", [])),
            progress_percentage=100,
            result={
                "presentation": presentation.model_dump(mode="json"),
                "outlines": presentation.outlines
            }
        )
        sql_session.add(job)
        await sql_session.commit()
        return job

    # Check if there's already a pending/processing job for this presentation
    existing_job = await sql_session.execute(
        select(OutlineJobModel).where(
            OutlineJobModel.presentation_id == id,
            OutlineJobModel.status.in_([OutlineJobStatus.PENDING.value, OutlineJobStatus.PROCESSING.value])
        )
    )
    existing_job = existing_job.scalars().first()

    if existing_job:
        logger.info(f"Returning existing job {existing_job.id} for presentation {id}")
        return existing_job

    # Create new job
    job = OutlineJobModel(
        presentation_id=id,
        status=OutlineJobStatus.PENDING.value,
        message="⏳ רגע, מכין הכל...",
        progress_total=presentation.n_slides
    )
    sql_session.add(job)
    await sql_session.commit()

    logger.info(
        f"Created outline job {job.id} for presentation {id}",
        extra={"extra_fields": {
            "event_type": "outline_job_created",
            "job_id": str(job.id),
            "presentation_id": str(id)
        }}
    )

    # Start background task
    background_tasks.add_task(process_outline_job, job.id, id)

    return job


@OUTLINES_ROUTER.get("/job/{job_id}/status", response_model=OutlineJobModel)
async def get_outline_job_status(
    job_id: uuid.UUID,
    sql_session: AsyncSession = Depends(get_async_session)
):
    """
    Get the status of an outline generation job.
    """
    job = await sql_session.get(OutlineJobModel, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job


@OUTLINES_ROUTER.get("/stream/{id}")
async def stream_outlines(
    id: uuid.UUID, sql_session: AsyncSession = Depends(get_async_session)
):
    presentation = await sql_session.get(PresentationModel, id)

    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    logger.info(
        f"Starting outline streaming for presentation ID: {id}",
        extra={"extra_fields": {
            "event_type": "outline_stream_start",
            "presentation_id": str(id),
            "n_slides": presentation.n_slides
        }}
    )

    temp_dir = TEMP_FILE_SERVICE.create_temp_dir()

    async def inner():
        try:
            logger.debug(f"[OutlineStream {id}] Entering inner() function")

            additional_context = ""
            if presentation.file_paths:
                logger.debug(f"[OutlineStream {id}] Loading {len(presentation.file_paths)} document files")
                yield SSEStatusResponse(
                    status=f"Loading and processing {len(presentation.file_paths)} document(s)..."
                ).to_string()

                # Load documents with keepalive
                documents_loader = DocumentsLoader(file_paths=presentation.file_paths)
                load_task = asyncio.create_task(documents_loader.load_documents(temp_dir))

                # Send keepalive messages while loading documents
                keepalive_count = 0
                while not load_task.done():
                    await asyncio.sleep(2)  # Keepalive every 2 seconds
                    if not load_task.done():
                        keepalive_count += 1
                        yield SSEStatusResponse(
                            status=f"Processing documents... ({keepalive_count * 2}s)"
                        ).to_string()

                # Get the result
                await load_task

                documents = documents_loader.documents
                if documents:
                    additional_context = "\n\n".join(documents)
                    logger.debug(f"[OutlineStream {id}] Loaded {len(documents)} documents, total context length: {len(additional_context)} chars")
                    yield SSEStatusResponse(
                        status=f"Documents loaded successfully. Analyzing content..."
                    ).to_string()
            else:
                yield SSEStatusResponse(
                    status="Analyzing content and creating outline structure..."
                ).to_string()

            presentation_outlines_text = ""

            n_slides_to_generate = presentation.n_slides
            if presentation.include_table_of_contents:
                needed_toc_count = math.ceil((presentation.n_slides - 1) / 10)
                n_slides_to_generate -= math.ceil(
                    (presentation.n_slides - needed_toc_count) / 10
                )
                logger.debug(f"[OutlineStream {id}] Generating {n_slides_to_generate} slides (excluding {presentation.n_slides - n_slides_to_generate} TOC slides)")

            logger.debug(f"[OutlineStream {id}] Starting LLM streaming for outline generation")
            yield SSEStatusResponse(
                status=f"Generating outlines for {n_slides_to_generate} slides..."
            ).to_string()

            chunk_count = 0
            last_status_time = asyncio.get_event_loop().time()
            async for chunk in generate_ppt_outline(
                presentation.content,
                n_slides_to_generate,
                presentation.language,
                additional_context,
                presentation.tone,
                presentation.verbosity,
                presentation.instructions,
                presentation.include_title_slide,
                presentation.web_search,
            ):
                # Give control to the event loop
                await asyncio.sleep(0)

                if isinstance(chunk, HTTPException):
                    logger.error(f"[OutlineStream {id}] HTTPException during streaming: {chunk.detail}")
                    yield SSEErrorResponse(detail=chunk.detail).to_string()
                    await asyncio.sleep(0.1)
                    yield SSEResponse(
                        event="response",
                        data=json.dumps({"type": "closing"}),
                    ).to_string()
                    await asyncio.sleep(0.1)
                    logger.debug(f"[OutlineStream {id}] Sent error and closing events, exiting")
                    return

                chunk_count += 1
                yield SSEResponse(
                    event="response",
                    data=json.dumps({"type": "chunk", "chunk": chunk}),
                ).to_string()

                presentation_outlines_text += chunk

                # Send periodic keepalive status during long LLM generation
                current_time = asyncio.get_event_loop().time()
                if current_time - last_status_time > 5:  # Every 5 seconds
                    yield SSEStatusResponse(
                        status=f"Creating outline structure... ({chunk_count} chunks processed)"
                    ).to_string()
                    last_status_time = current_time

            logger.debug(f"[OutlineStream {id}] LLM streaming completed with {chunk_count} chunks")

            logger.debug(f"[OutlineStream {id}] LLM streaming completed, total text length: {len(presentation_outlines_text)} chars")

            yield SSEStatusResponse(
                status="Finalizing and validating outline structure..."
            ).to_string()

            logger.debug(f"[OutlineStream {id}] Parsing JSON response")
            try:
                presentation_outlines_json = dict(
                    dirtyjson.loads(presentation_outlines_text)
                )
                logger.debug(f"[OutlineStream {id}] JSON parsing successful, keys: {list(presentation_outlines_json.keys())}")
            except Exception as e:
                logger.error(f"[OutlineStream {id}] JSON parsing failed: {str(e)}", exc_info=True)
                traceback.print_exc()
                yield SSEErrorResponse(
                    detail="The AI response was incomplete or malformed. This can happen with complex prompts or very long presentations.",
                    error_code="JSON_PARSE_ERROR",
                    suggested_action="Try reducing the number of slides, simplifying your prompt, or using a different AI model."
                ).to_string()
                yield SSEResponse(
                    event="response",
                    data=json.dumps({"type": "closing"}),
                ).to_string()
                return

            # Validate the structure before creating Pydantic model
            if "slides" not in presentation_outlines_json:
                logger.error(f"LLM returned malformed outline structure. Missing 'slides' field. Got: {presentation_outlines_json}", extra={"extra_fields": {
                    "event_type": "outline_validation_error",
                    "error": "missing_slides_field",
                    "response_keys": list(presentation_outlines_json.keys()),
                    "response_preview": str(presentation_outlines_json)[:500]
                }})
                yield SSEErrorResponse(
                    detail="The AI returned an invalid outline structure (missing slides data). This is usually a temporary issue.",
                    error_code="INVALID_OUTLINE_STRUCTURE",
                    suggested_action="Please try again. If the problem persists, try using a different AI model or simplifying your prompt."
                ).to_string()
                yield SSEResponse(
                    event="response",
                    data=json.dumps({"type": "closing"}),
                ).to_string()
                return

            try:
                presentation_outlines = PresentationOutlineModel(**presentation_outlines_json)
            except Exception as e:
                logger.error(f"Failed to validate presentation outlines: {str(e)}", exc_info=True, extra={"extra_fields": {
                    "event_type": "outline_pydantic_validation_error",
                    "error": str(e),
                    "response_keys": list(presentation_outlines_json.keys())
                }})
                yield SSEErrorResponse(
                    detail="The AI response format couldn't be validated. This can happen with very complex or unusual prompts.",
                    error_code="VALIDATION_ERROR",
                    suggested_action="Try using simpler language in your prompt, reducing the number of slides, or trying a different AI model."
                ).to_string()
                yield SSEResponse(
                    event="response",
                    data=json.dumps({"type": "closing"}),
                ).to_string()
                return

            logger.debug(f"[OutlineStream {id}] Trimming outlines to {n_slides_to_generate} slides")
            presentation_outlines.slides = presentation_outlines.slides[
                :n_slides_to_generate
            ]

            presentation.outlines = presentation_outlines.model_dump()
            presentation.title = get_presentation_title_from_outlines(presentation_outlines)
            logger.debug(f"[OutlineStream {id}] Presentation title: {presentation.title}")

            logger.debug(f"[OutlineStream {id}] Saving to database")
            sql_session.add(presentation)
            await sql_session.commit()
            logger.debug(f"[OutlineStream {id}] Database commit successful")

            logger.debug(f"[OutlineStream {id}] Sending SSECompleteResponse")
            yield SSECompleteResponse(
                key="presentation", value=presentation.model_dump(mode="json")
            ).to_string()

            logger.debug(f"[OutlineStream {id}] Waiting before closing stream")
            # Give MORE time for the complete response to be sent before closing
            await asyncio.sleep(0.2)
            logger.debug(f"[OutlineStream {id}] Try block completed successfully")

        except Exception as e:
            logger.error(
                f"[OutlineStream {id}] Unexpected error: {type(e).__name__}: {str(e)}",
                exc_info=True,
                extra={"extra_fields": {
                    "event_type": "outline_streaming_unexpected_error",
                    "presentation_id": str(id),
                    "error_type": type(e).__name__,
                    "error": str(e)
                }}
            )
            logger.debug(f"[OutlineStream {id}] Sending error response to client")
            yield SSEErrorResponse(
                detail=f"An unexpected server error occurred while generating outlines. This is likely a temporary issue.",
                error_code="UNEXPECTED_ERROR",
                suggested_action="Please try again in a moment. If the problem persists, contact support with this error message."
            ).to_string()
            await asyncio.sleep(0.1)
            logger.debug(f"[OutlineStream {id}] Error response sent")
        finally:
            logger.debug(f"[OutlineStream {id}] Entering finally block - sending closing event")

            # Send explicit end marker
            yield SSEResponse(
                event="end",
                data="stream_complete"
            ).to_string()
            await asyncio.sleep(0.3)

            # Always send closing event to properly close the stream
            yield SSEResponse(
                event="response",
                data=json.dumps({"type": "closing"}),
            ).to_string()

            # Ensure the closing event is fully sent before stream terminates
            await asyncio.sleep(1.0)

            # Force final flush with empty yield
            yield ""

            # Additional buffer time for network flush
            await asyncio.sleep(0.5)

            logger.info(
                f"[OutlineStream {id}] Stream closed successfully",
                extra={"extra_fields": {
                    "event_type": "outline_stream_end",
                    "presentation_id": str(id)
                }}
            )

            # Cleanup temp directory
            logger.debug(f"[OutlineStream {id}] Cleaning up temp directory")
            TEMP_FILE_SERVICE.cleanup_temp_dir(temp_dir)

    return StreamingResponse(
        inner(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked",
            "Content-Type": "text/event-stream; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
        }
    )
