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
            yield SSEStatusResponse(
                status="Generating presentation outlines..."
            ).to_string()

            additional_context = ""
            if presentation.file_paths:
                logger.debug(f"[OutlineStream {id}] Loading {len(presentation.file_paths)} document files")
                documents_loader = DocumentsLoader(file_paths=presentation.file_paths)
                await documents_loader.load_documents(temp_dir)
                documents = documents_loader.documents
                if documents:
                    additional_context = "\n\n".join(documents)
                    logger.debug(f"[OutlineStream {id}] Loaded {len(documents)} documents, total context length: {len(additional_context)} chars")

            presentation_outlines_text = ""

            n_slides_to_generate = presentation.n_slides
            if presentation.include_table_of_contents:
                needed_toc_count = math.ceil((presentation.n_slides - 1) / 10)
                n_slides_to_generate -= math.ceil(
                    (presentation.n_slides - needed_toc_count) / 10
                )
                logger.debug(f"[OutlineStream {id}] Generating {n_slides_to_generate} slides (excluding {presentation.n_slides - n_slides_to_generate} TOC slides)")

            logger.debug(f"[OutlineStream {id}] Starting LLM streaming for outline generation")
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
                    yield SSEResponse(
                        event="response",
                        data=json.dumps({"type": "closing"}),
                    ).to_string()
                    return

                yield SSEResponse(
                    event="response",
                    data=json.dumps({"type": "chunk", "chunk": chunk}),
                ).to_string()

                presentation_outlines_text += chunk

            logger.debug(f"[OutlineStream {id}] LLM streaming completed, total text length: {len(presentation_outlines_text)} chars")
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
                    detail=f"Failed to parse presentation outlines JSON. Please try again. {str(e)}",
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
                    detail="The AI returned an invalid outline structure. Please try again with a different prompt or model.",
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
                    detail=f"Failed to validate presentation outlines. The AI response doesn't match the expected format. Please try again. Error: {str(e)}",
                ).to_string()
                yield SSEResponse(
                    event="response",
                    data=json.dumps({"type": "closing"}),
                ).to_string()
                return

            presentation_outlines.slides = presentation_outlines.slides[
                :n_slides_to_generate
            ]

            presentation.outlines = presentation_outlines.model_dump()
            presentation.title = get_presentation_title_from_outlines(presentation_outlines)

            sql_session.add(presentation)
            await sql_session.commit()

            yield SSECompleteResponse(
                key="presentation", value=presentation.model_dump(mode="json")
            ).to_string()

            # Give a moment for the complete response to be sent before closing
            await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Unexpected error in outline streaming: {str(e)}", exc_info=True, extra={"extra_fields": {
                "event_type": "outline_streaming_unexpected_error",
                "error": str(e)
            }})
            yield SSEErrorResponse(
                detail=f"An unexpected error occurred while generating outlines. Please try again. Error: {str(e)}",
            ).to_string()
            await asyncio.sleep(0.1)
        finally:
            # Always send closing event to properly close the stream
            yield SSEResponse(
                event="response",
                data=json.dumps({"type": "closing"}),
            ).to_string()

            # Ensure the closing event is fully sent before stream terminates
            await asyncio.sleep(0.1)

    return StreamingResponse(
        inner(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
        }
    )
