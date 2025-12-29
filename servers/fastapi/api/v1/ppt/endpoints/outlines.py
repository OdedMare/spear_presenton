import asyncio
import json
import math
import traceback
import uuid
import dirtyjson
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from models.presentation_outline_model import PresentationOutlineModel
from models.sql.presentation import PresentationModel
from models.sse_response import (
    SSECompleteResponse,
    SSEErrorResponse,
    SSEResponse,
    SSEStatusResponse,
)
from services.temp_file_service import TEMP_FILE_SERVICE
from services.database import get_async_session
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
