"""
Advanced Content Rewrite API Endpoint

This endpoint allows users to:
1. Upload a PPTX file with their desired design
2. Provide a prompt describing the content they want
3. Get back a rewritten PPTX with the same design but completely new content

Advanced Features:
- Rewrites ALL text elements: shapes, textboxes, tables, charts, SmartArt, notes
- Respects visual constraints (maxLength, maxLines) to prevent overflow
- Uses element IDs for precise text replacement
- Maintains design integrity across all element types

Workflow:
1. Extract ALL text elements from uploaded PPTX with IDs and constraints
2. Send element structure + user prompt to LLM
3. LLM returns rewritten content respecting scale & fit rules
4. Inject rewritten content back into PPTX using element IDs
5. Return modified PPTX to user
"""

import os
import uuid
import json
import logging
from urllib.parse import quote
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.placeholder_extractor import extract_all_placeholders, validate_rewritten_content
from services.placeholder_injector import inject_content_into_pptx
from services.llm_client import LLMClient
from services.content_chunker import (
    chunk_placeholder_structure,
    combine_chunked_results,
    estimate_structure_tokens
)
from services.translation_agents import translate_with_agents
from models.llm_message import LLMSystemMessage, LLMUserMessage
from utils.llm_provider import get_model
from api.v1.ppt.endpoints.prompts import (
    CONTENT_REWRITE_SYSTEM_PROMPT,
    CONTENT_REWRITE_FLEXIBLE_SYSTEM_PROMPT,
    CONTENT_REWRITE_LITE_SYSTEM_PROMPT,
    CONTENT_REWRITE_FLEXIBLE_LITE_SYSTEM_PROMPT,
    CONTENT_TRANSLATE_SYSTEM_PROMPT,
    CONTENT_TRANSLATE_LITE_SYSTEM_PROMPT
)
from enum import Enum
from api.middlewares import get_current_user
from models.sql.user import User
from utils.logger import logger
from fastapi import BackgroundTasks
from models.sql.async_presentation_generation_status import AsyncPresentationGenerationTaskModel
from services.database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

router = APIRouter()


def clean_json_response(response_text: str) -> str:
    """
    Clean JSON response from LLM by removing markdown code blocks and extra text.

    Some models (especially smaller ones like Qwen) may wrap JSON in ```json blocks
    or add explanatory text before/after the JSON. This function strips those away.

    Args:
        response_text: Raw response from LLM

    Returns:
        Cleaned JSON string
    """
    # Strip leading/trailing whitespace
    text = response_text.strip()

    # Remove markdown code blocks if present
    # Pattern 1: ```json\n{...}\n```
    if text.startswith("```json"):
        text = text[7:]  # Remove ```json
        if text.endswith("```"):
            text = text[:-3]  # Remove trailing ```
        text = text.strip()
    # Pattern 2: ```\n{...}\n```
    elif text.startswith("```"):
        text = text[3:]  # Remove ```
        if text.endswith("```"):
            text = text[:-3]  # Remove trailing ```
        text = text.strip()

    # Find the first { and last } to extract JSON
    # This handles cases where there's explanatory text before/after JSON
    first_brace = text.find('{')
    last_brace = text.rfind('}')

    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace:last_brace + 1]

    return text


def attempt_json_repair(json_string: str) -> Optional[str]:
    """
    Attempt to repair malformed JSON from small models.

    Common issues fixed:
    - Missing closing braces/brackets
    - Trailing commas
    - Incomplete last element

    Returns repaired JSON string or None if unrepairable.
    """
    try:
        # First attempt: try parsing as-is
        json.loads(json_string)
        return json_string
    except json.JSONDecodeError as e:
        logger.info(f"Attempting JSON repair. Error: {e}")

        # Attempt 1: Add missing closing braces
        if e.msg and "Expecting" in e.msg:
            # Count opening and closing braces
            open_braces = json_string.count('{')
            close_braces = json_string.count('}')
            open_brackets = json_string.count('[')
            close_brackets = json_string.count(']')

            # Add missing closers
            repaired = json_string
            repaired += ']' * (open_brackets - close_brackets)
            repaired += '}' * (open_braces - close_braces)

            try:
                json.loads(repaired)
                logger.info("JSON repair successful: added missing closing braces/brackets")
                return repaired
            except:
                pass

        # Attempt 2: Remove trailing comma before closing brace/bracket
        import re
        repaired = re.sub(r',(\s*[}\]])', r'\1', json_string)
        try:
            json.loads(repaired)
            logger.info("JSON repair successful: removed trailing commas")
            return repaired
        except:
            pass

        # Attempt 3: Try to extract complete "slides" array
        match = re.search(r'"slides"\s*:\s*\[(.*)\]', json_string, re.DOTALL)
        if match:
            repaired = '{"slides":[' + match.group(1) + ']}'
            try:
                json.loads(repaired)
                logger.info("JSON repair successful: extracted complete slides array")
                return repaired
            except:
                pass

        logger.warning("JSON repair failed - unable to fix malformed JSON")
        return None


class RewriteMode(str, Enum):
    """Rewrite mode options"""
    STRICT = "strict"  # Exact structure matching - only rewrite text
    FLEXIBLE = "flexible"  # Allow structure changes - can add/remove elements
    TRANSLATE = "translate"  # Translation mode - translate text while preserving exact structure


def sanitize_rewritten_content(
    original_structure: Dict[str, Any],
    rewritten_content: Dict[str, Any],
    mode: RewriteMode = RewriteMode.STRICT
) -> Dict[str, Any]:
    """
    Sanitize rewritten content based on the rewrite mode.

    STRICT mode: Ensures exact structure match and respects all constraints.
                 Matches elements by ID, allowing for reordering.
    FLEXIBLE mode: Allows structure changes, more lenient with length constraints.

    Returns sanitized copy of rewritten_content.
    """
    sanitized = {"slides": []}

    original_slides = original_structure.get("slides", [])
    rewritten_slides = rewritten_content.get("slides", [])

    # TRANSLATE mode uses same strict validation as STRICT mode
    if mode == RewriteMode.FLEXIBLE:
        # Flexible mode: Support both modifying existing elements AND creating new ones
        # Elements with IDs from original structure = modify existing
        # Elements with ID starting with "new_" = create new text boxes
        orig_slides_map = {s.get("slideNumber"): s for s in original_slides}

        for rewritten_slide in rewritten_slides:
            slide_num = rewritten_slide.get("slideNumber")
            orig_slide = orig_slides_map.get(slide_num)

            if not orig_slide:
                logger.warning(f"Flexible mode: Skipping unknown slide number {slide_num}")
                continue

            # Create a map of valid element IDs for this slide
            valid_ids = {e.get("id") for e in orig_slide.get("elements", [])}

            # Separate existing elements from new elements
            existing_elements = []
            new_elements = []

            for rewritten_el in rewritten_slide.get("elements", []):
                el_id = rewritten_el.get("id", "")
                text = rewritten_el.get("text", "")

                # Check if this is a new element (ID starts with "new_")
                if el_id.startswith("new_"):
                    # New element - will be created as a text box
                    # Pass through position, size, layout, shapeType, and fontSize parameters
                    new_element = {
                        "id": el_id,
                        "text": text
                    }

                    # Optional position control
                    if "position" in rewritten_el:
                        new_element["position"] = rewritten_el["position"]

                    # Optional size control
                    if "size" in rewritten_el:
                        new_element["size"] = rewritten_el["size"]

                    # Optional layout control
                    if "layout" in rewritten_el:
                        new_element["layout"] = rewritten_el["layout"]

                    # Optional shape type (textbox, title, subtitle)
                    if "shapeType" in rewritten_el:
                        new_element["shapeType"] = rewritten_el["shapeType"]

                    # Optional font size
                    if "fontSize" in rewritten_el:
                        new_element["fontSize"] = rewritten_el["fontSize"]

                    # Optional clone source (to duplicate styling from existing element)
                    if "cloneFrom" in rewritten_el:
                        new_element["cloneFrom"] = rewritten_el["cloneFrom"]
                        logger.info(f"Flexible mode: Element {el_id} will clone styling from {rewritten_el['cloneFrom']}")

                    new_elements.append(new_element)
                    logger.info(f"Flexible mode: Creating new element {el_id} on slide {slide_num} (position: {new_element.get('position', 'bottom')}, size: {new_element.get('size', 'medium')}, shapeType: {new_element.get('shapeType', 'textbox')}, fontSize: {new_element.get('fontSize', 'default')})")
                elif el_id in valid_ids:
                    # Existing element - will be modified via injection
                    element_data = {
                        "id": el_id,
                        "text": text
                    }

                    # Support element removal
                    if rewritten_el.get("remove", False):
                        element_data["remove"] = True
                        logger.info(f"Flexible mode: Marking element {el_id} for removal on slide {slide_num}")

                    # Support font size changes for existing elements
                    if "fontSize" in rewritten_el:
                        element_data["fontSize"] = rewritten_el["fontSize"]
                        logger.info(f"Flexible mode: Changing font size for {el_id} to {rewritten_el['fontSize']}pt")

                    existing_elements.append(element_data)
                else:
                    logger.warning(f"Flexible mode: Skipping invalid element ID {el_id} on slide {slide_num}")

            sanitized["slides"].append({
                "slideNumber": slide_num,
                "elements": existing_elements,
                "newElements": new_elements  # Separate list for new elements
            })
        return sanitized

    # STRICT mode: Apply original constraints using ID matching
    # Map original slides by slideNumber for O(1) lookup
    orig_slides_map = {s.get("slideNumber"): s for s in original_slides}

    for rewritten_slide in rewritten_slides:
        slide_num = rewritten_slide.get("slideNumber")
        orig_slide = orig_slides_map.get(slide_num)

        if not orig_slide:
            # In strict mode, we skip slides that weren't in the original request
            logger.warning(f"Strict mode: Skipping unknown slide number {slide_num}")
            continue

        # Map original elements by ID for O(1) lookup
        orig_elements_map = {e.get("id"): e for e in orig_slide.get("elements", [])}
        
        rewritten_elements = rewritten_slide.get("elements", [])
        sanitized_elements = []

        for rewritten_el in rewritten_elements:
            el_id = rewritten_el.get("id")
            orig_el = orig_elements_map.get(el_id)

            if not orig_el:
                # In strict mode, we skip elements that weren't in the original request
                logger.warning(f"Strict mode: Skipping unknown element ID {el_id}")
                continue

            text = rewritten_el.get("text", "")
            max_length = orig_el.get("maxLength")
            max_lines = orig_el.get("maxLines")

            # Truncate if text exceeds maxLength
            if max_length and len(text) > max_length:
                logger.warning(
                    f"Truncating element {el_id}: "
                    f"length {len(text)} exceeds maxLength {max_length}"
                )
                # Truncate with ellipsis if possible
                if max_length > 3:
                    text = text[:max_length - 3] + "..."
                else:
                    text = text[:max_length]

            # Truncate lines if exceeds maxLines
            if max_lines:
                lines = text.split('\n')
                if len(lines) > max_lines:
                    logger.warning(
                        f"Truncating lines for element {el_id}: "
                        f"{len(lines)} lines exceeds maxLines {max_lines}"
                    )
                    text = '\n'.join(lines[:max_lines])

            sanitized_elements.append({
                "id": el_id,
                "text": text
            })

        sanitized["slides"].append({
            "slideNumber": slide_num,
            "elements": sanitized_elements
        })

    return sanitized


class RewriteRequest(BaseModel):
    """Request model for content rewriting"""
    user_prompt: str
    placeholder_structure: Dict[str, Any]
    mode: RewriteMode = RewriteMode.STRICT  # Default to strict mode
    keywords: Optional[List[str]] = None  # List of must-have keywords
    source_language: Optional[str] = None  # Source language for translation mode
    target_language: Optional[str] = None  # Target language for translation mode

    # Translation Agents Configuration
    translation_use_agents: Optional[bool] = None
    translation_parser_use_llm: Optional[bool] = None
    translation_parser_model: Optional[str] = None
    translation_model: Optional[str] = None
    translation_batch_size: Optional[int] = None
    translation_validator_model: Optional[str] = None


class RewriteResponse(BaseModel):
    """Response model for placeholder extraction"""
    placeholder_structure: Dict[str, Any]
    message: str


class RewrittenContentResponse(BaseModel):
    """Response model for rewritten content"""
    rewritten_content: Dict[str, Any]
    message: str


@router.post("/extract-placeholders", response_model=RewriteResponse)
async def extract_placeholders(
    file: UploadFile = File(..., description="PPTX file to extract text elements from"),
    current_user: User | None = Depends(get_current_user),
):
    """
    Extract ALL text elements from an uploaded PPTX file with IDs and constraints.

    This is step 1 of the content rewrite workflow.
    Extracts shapes, textboxes, tables, charts, SmartArt, and speaker notes.
    Each element gets a unique ID and text length/line constraints for scale & fit.

    Returns the element structure that the LLM will use to generate new content.
    """
    user_id = current_user.id if current_user else None
    username = current_user.username if current_user else None

    try:
        # Save uploaded file temporarily
        upload_dir = os.getenv("APP_DATA_DIRECTORY", "/app/app_data") + "/temp_uploads"
        os.makedirs(upload_dir, exist_ok=True)

        file_id = str(uuid.uuid4())
        temp_path = os.path.join(upload_dir, f"{file_id}.pptx")

        # Write uploaded file
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        logger.info(f"Extracting placeholders from uploaded file: {file.filename}", extra={"extra_fields": {
            "user_id": user_id,
            "username": username,
            "file_id": file_id,
            "filename": file.filename,
            "event_type": "content_rewrite_extract_started",
        }})

        # Extract placeholder structure
        placeholder_structure = extract_all_placeholders(temp_path)

        # Store the file path in the response for later use
        # (Frontend will send this back when requesting rewrite)
        placeholder_structure["_temp_file_path"] = temp_path
        placeholder_structure["_original_filename"] = file.filename

        slide_count = len(placeholder_structure['slides'])
        logger.info(f"Extracted {slide_count} slides from {file.filename}", extra={"extra_fields": {
            "user_id": user_id,
            "username": username,
            "file_id": file_id,
            "filename": file.filename,
            "slide_count": slide_count,
            "event_type": "content_rewrite_extract_completed",
        }})

        return RewriteResponse(
            placeholder_structure=placeholder_structure,
            message=f"Successfully extracted placeholders from {slide_count} slides"
        )

    except Exception as e:
        logger.error(f"Error extracting placeholders: {e}", exc_info=True, extra={"extra_fields": {
            "user_id": user_id,
            "username": username,
            "filename": file.filename,
            "error": str(e),
            "event_type": "content_rewrite_extract_error",
        }})
        raise HTTPException(status_code=500, detail=f"Failed to extract placeholders: {str(e)}")


@router.post("/generate-rewritten-content", response_model=AsyncPresentationGenerationTaskModel)
async def generate_rewritten_content(
    request: RewriteRequest,
    background_tasks: BackgroundTasks,
    sql_session: AsyncSession = Depends(get_async_session),
    current_user: User | None = Depends(get_current_user),
):
    """
    Initiate async content rewrite task.
    Returns a task ID to poll for status.
    """
    try:
        # Create task record
        async_status = AsyncPresentationGenerationTaskModel(
            status="pending",
            message="Queued for content rewrite",
            data=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        sql_session.add(async_status)
        await sql_session.commit()
        await sql_session.refresh(async_status)

        # Add background task
        background_tasks.add_task(
            process_rewrite_task,
            request,
            async_status.id,
            sql_session,
            current_user
        )

        return async_status

    except Exception as e:
        logger.error(f"Failed to queue rewrite task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to queue task: {str(e)}")


async def process_rewrite_task(
    request: RewriteRequest,
    task_id: str,
    sql_session: AsyncSession,
    current_user: User | None
):
    """
    Background task handler for content rewrite.
    """
    try:
        # Get fresh task object
        async_status = await sql_session.get(AsyncPresentationGenerationTaskModel, task_id)
        if not async_status:
            logger.error(f"Task {task_id} not found in background handler")
            return

        # Update status to processing
        async_status.status = "processing"
        async_status.message = "Generating content..."
        async_status.updated_at = datetime.utcnow()
        sql_session.add(async_status)
        await sql_session.commit()

        user_prompt = request.user_prompt
        placeholder_structure = request.placeholder_structure
        mode = request.mode
        keywords = request.keywords or []
        source_language = request.source_language
        target_language = request.target_language
        
        # Log process start explicitly
        process_type = "Translation" if mode == RewriteMode.TRANSLATE else "Rewrite"
        logger.info(f"Process started: {process_type}", extra={"extra_fields": {
            "event_type": "process_started",
            "process_type": process_type,
            "mode": mode.value,
            "source_language": source_language,
            "target_language": target_language,
            "slide_count": len(placeholder_structure.get("slides", [])),
            "user_prompt_length": len(user_prompt) if user_prompt else 0,
            "task_id": str(task_id)
        }})

        # Remove metadata fields before sending to LLM
        clean_structure = {
            "slides": placeholder_structure.get("slides", [])
        }

        # ===== TRANSLATION MODE: Use Multi-Agent System =====
        if mode == RewriteMode.TRANSLATE and source_language and target_language:
            logger.info(f"Using multi-agent translation: {source_language} → {target_language}")

            async_status.message = "Running multi-agent translation..."
            sql_session.add(async_status)
            await sql_session.commit()

            # Get agent configurations from request (with env var fallbacks)
            use_agents = (
                request.translation_use_agents
                if request.translation_use_agents is not None
                else os.getenv("TRANSLATION_USE_AGENTS", "true").lower() == "true"
            )


            if use_agents:
                # Configure agents from request or environment variables
                parser_config = {
                    "use_llm": (
                        request.translation_parser_use_llm
                        if request.translation_parser_use_llm is not None
                        else os.getenv("TRANSLATION_PARSER_USE_LLM", "false").lower() == "true"
                    ),
                    "model": (
                        request.translation_parser_model
                        if request.translation_parser_model
                        else os.getenv("TRANSLATION_PARSER_MODEL", "gpt-4o-mini")
                    )
                }

                translator_config = {
                    "model": (
                        request.translation_model
                        if request.translation_model
                        else os.getenv("TRANSLATION_MODEL", "gpt-4")
                    ),
                    "batch_size": (
                        request.translation_batch_size
                        if request.translation_batch_size is not None
                        else int(os.getenv("TRANSLATION_BATCH_SIZE", "20"))
                    )
                }

                validator_config = {
                    "model": (
                        request.translation_validator_model
                        if request.translation_validator_model
                        else os.getenv("TRANSLATION_VALIDATOR_MODEL", "gpt-4o-mini")
                    )
                }

                logger.info(f"Agent Config - Parser: {parser_config['model']}, "
                          f"Translator: {translator_config['model']}, "
                          f"Validator: {validator_config['model']}")

                # Use agent-based translation
                rewritten_content = await translate_with_agents(
                    placeholder_structure=clean_structure,
                    source_language=source_language,
                    target_language=target_language,
                    parser_config=parser_config,
                    translator_config=translator_config,
                    validator_config=validator_config
                )

                logger.info("Multi-agent translation completed successfully")

                # Success - Update Task
                async_status.status = "completed"
                async_status.message = "Translation completed"
                async_status.data = {"rewritten_content": rewritten_content}
                async_status.updated_at = datetime.utcnow()
                sql_session.add(async_status)
                await sql_session.commit()
                return
            else:
                logger.info("Multi-agent system disabled, using legacy translation flow")
                # Fall through to legacy translation below

        # Determine prompt mode from env (default to "auto" which means try full then lite)
        prompt_mode = os.getenv("CONTENT_REWRITE_PROMPT_MODE", "auto").lower()
        
        # Helper to get prompts based on mode
        def get_prompts(use_lite: bool):
            if mode == RewriteMode.TRANSLATE:
                return (
                    CONTENT_TRANSLATE_LITE_SYSTEM_PROMPT
                    if use_lite
                    else CONTENT_TRANSLATE_SYSTEM_PROMPT
                )
            elif mode == RewriteMode.FLEXIBLE:
                return (
                    CONTENT_REWRITE_FLEXIBLE_LITE_SYSTEM_PROMPT
                    if use_lite
                    else CONTENT_REWRITE_FLEXIBLE_SYSTEM_PROMPT
                )
            else:
                return (
                    CONTENT_REWRITE_LITE_SYSTEM_PROMPT
                    if use_lite
                    else CONTENT_REWRITE_SYSTEM_PROMPT
                )

        # Format the user message template
        if mode == RewriteMode.TRANSLATE:
            mode_instruction = f"Translate all text from {source_language} to {target_language} while preserving exact structure."
        elif mode == RewriteMode.FLEXIBLE:
            mode_instruction = "You can adapt the structure as needed for better content flow."
        else:
            mode_instruction = "you must fill these exact placeholders"
        
        keyword_instruction = ""
        if keywords:
            keyword_list = ", ".join(f'"{k}"' for k in keywords)
            keyword_instruction = f"\nIMPORTANT: You MUST include the following keywords/terms in the rewritten content: {keyword_list}."

        user_message_template = f"""User's Content Request:
{user_prompt}
{keyword_instruction}

Placeholder Structure ({mode_instruction}):
{{PLACEHOLDER_DATA}}

Generate rewritten content in {mode.value} mode.
IMPORTANT: If a placeholder has empty text ("text": "") but has maxLength/maxLines constraints, you MUST generate appropriate content for it based on the User's Content Request. Do not leave it empty."""

        # Get model
        llm_client = LLMClient()
        model = get_model()
        
        # Get max input tokens
        max_input_tokens = int(os.getenv("CONTENT_REWRITE_MAX_INPUT_TOKENS", "8000"))
        logger.info(f"Using model '{model}' with max input tokens: {max_input_tokens}")

        # Estimate total tokens
        estimated_tokens = estimate_structure_tokens(clean_structure)
        logger.info(f"Estimated tokens for {len(clean_structure['slides'])} slides: ~{estimated_tokens}")
        
        # Chunk the structure
        # We use the full prompt for chunking estimation to be safe
        base_system_prompt = get_prompts(use_lite=False)
        chunks = chunk_placeholder_structure(
            clean_structure,
            base_system_prompt,
            user_message_template,
            max_input_tokens=max_input_tokens
        )

        logger.info(f"Processing content rewrite in {len(chunks)} batch(es)")

        # Define async function to process a single chunk
        async def process_chunk(i: int, chunk: dict):
            chunk_slides = chunk.get("slides", [])
            slide_numbers = [s.get("slideNumber") for s in chunk_slides]

            logger.info(f"Processing batch {i+1}/{len(chunks)}: {len(chunk_slides)} slides")

            # Create user message for this chunk
            user_message = user_message_template.replace(
                "{PLACEHOLDER_DATA}",
                json.dumps(chunk, indent=2)
            )

            # Try processing with fallback logic
            chunk_result = None
            last_error = None

            # Determine attempts based on prompt_mode
            attempts = []
            if prompt_mode == "lite":
                attempts.append(("lite", True))
            elif prompt_mode == "full":
                attempts.append(("full", False))
            else: # auto
                attempts.append(("full", False))
                attempts.append(("lite", True))

            for attempt_name, use_lite in attempts:
                try:
                    logger.info(f"Batch {i+1}: Attempting with {attempt_name} prompt...")
                    system_prompt = get_prompts(use_lite=use_lite)

                    messages = [
                        LLMSystemMessage(content=system_prompt),
                        LLMUserMessage(content=user_message)
                    ]

                    response_text = await llm_client.generate(
                        model=model,
                        messages=messages,
                    )

                    try:
                        # Clean the response to remove markdown code blocks and extra text
                        cleaned_response = clean_json_response(response_text)

                        # Try to parse the cleaned response
                        try:
                            chunk_result = json.loads(cleaned_response)
                            logger.info(f"Batch {i+1}: Success with {attempt_name} prompt (direct parse)")
                            break
                        except json.JSONDecodeError as parse_error:
                            # Attempt JSON repair for small models
                            logger.info(f"Batch {i+1}: Direct parse failed, attempting repair...")
                            repaired_json = attempt_json_repair(cleaned_response)

                            if repaired_json:
                                chunk_result = json.loads(repaired_json)
                                logger.info(f"Batch {i+1}: Success with {attempt_name} prompt (after repair)")
                                break
                            else:
                                # Repair failed, log and try next attempt
                                logger.warning(f"Batch {i+1}: Invalid JSON with {attempt_name} prompt: {parse_error}")
                                logger.warning(f"Batch {i+1}: Raw response (first 500 chars): {response_text[:500]}")
                                logger.warning(f"Batch {i+1}: Cleaned response (first 500 chars): {cleaned_response[:500]}")
                                last_error = parse_error
                                continue
                    except Exception as inner_error:
                        logger.warning(f"Batch {i+1}: Unexpected error parsing JSON: {inner_error}")
                        last_error = inner_error
                        continue

                except Exception as e:
                    logger.warning(f"Batch {i+1}: Error with {attempt_name} prompt: {e}")
                    last_error = e
                    continue

            if chunk_result is None:
                error_msg = f"Failed to process batch {i+1} after {len(attempts)} attempts. Last error: {last_error}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)

            # Sanitize chunk result
            chunk_result = sanitize_rewritten_content(chunk, chunk_result, mode)
            return (i, chunk_result)

        # Process batches in parallel using asyncio.gather
        import asyncio
        logger.info(f"Processing {len(chunks)} batches in parallel...")
        start_time = asyncio.get_event_loop().time()

        tasks = [process_chunk(i, chunk) for i, chunk in enumerate(chunks)]
        results = await asyncio.gather(*tasks)

        elapsed = asyncio.get_event_loop().time() - start_time
        logger.info(f"Completed {len(chunks)} batches in {elapsed:.2f}s (parallel processing)")

        # Sort results by index to maintain order
        results.sort(key=lambda x: x[0])
        chunked_results = [result for _, result in results]
        
        # Combine all chunk results
        if len(chunks) > 1:
            logger.info(f"Combining {len(chunked_results)} batches into final result")
            rewritten_content = combine_chunked_results(chunked_results)
        else:
            rewritten_content = chunked_results[0]

        # Validate that rewritten content matches original structure
        try:
            if mode == RewriteMode.STRICT or mode == RewriteMode.TRANSLATE:
                validate_rewritten_content(clean_structure, rewritten_content)

                # Validate keywords in STRICT mode (not for TRANSLATE mode)
                if keywords and mode == RewriteMode.STRICT:
                    all_text = ""
                    for slide in rewritten_content.get("slides", []):
                        for element in slide.get("elements", []):
                            all_text += element.get("text", "") + " "

                    missing_keywords = [k for k in keywords if k.lower() not in all_text.lower()]
                    if missing_keywords:
                        raise ValueError(f"Rewritten content missing required keywords: {', '.join(missing_keywords)}")
                        
            else:
                # Flexible mode validation
                rewritten_slides = rewritten_content.get("slides", [])
                if not rewritten_slides:
                    raise ValueError("Flexible mode: No slides found in rewritten content")

                for i, slide in enumerate(rewritten_slides, start=1):
                    if "slideNumber" not in slide:
                        raise ValueError(f"Flexible mode: Slide {i} missing slideNumber field")
                    if "elements" not in slide:
                        raise ValueError(f"Flexible mode: Slide {i} missing elements field")

                logger.info(f"Flexible mode validation passed: {len(rewritten_slides)} slides generated")

        except ValueError as e:
            logger.error(f"Rewritten content validation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"LLM output doesn't match placeholder structure: {str(e)}"
            )

        logger.info("Successfully generated rewritten content")

        # Success - Update Task
        async_status.status = "completed"
        async_status.message = "Rewrite completed successfully"
        async_status.data = {"rewritten_content": rewritten_content}
        async_status.updated_at = datetime.utcnow()
        sql_session.add(async_status)
        await sql_session.commit()

    except Exception as e:
        logger.error(f"Error in rewrite task {task_id}: {e}", exc_info=True)
        # Update task with error
        try:
            # Re-fetch in case session was weird
            async_status = await sql_session.get(AsyncPresentationGenerationTaskModel, task_id)
            if async_status:
                async_status.status = "failed"
                async_status.message = "Process failed"
                async_status.error = {"detail": str(e)}
                async_status.updated_at = datetime.utcnow()
                sql_session.add(async_status)
                await sql_session.commit()
        except Exception as update_error:
             logger.error(f"Failed to update error status for task {task_id}: {update_error}")



@router.post("/inject-and-download")
async def inject_and_download(
    temp_file_path: str = Form(..., description="Path to temporary PPTX file"),
    rewritten_content: str = Form(..., description="JSON string of rewritten content"),
    original_filename: str = Form(default="presentation.pptx", description="Original filename")
):
    """
    Inject rewritten content into PPTX and return download file.

    This is step 3 of the content rewrite workflow.
    Takes the rewritten content and injects it into the original PPTX.
    """
    try:
        # Parse rewritten content JSON
        try:
            content_dict = json.loads(rewritten_content)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON in rewritten_content: {str(e)}")

        # Validate temp file exists
        if not os.path.exists(temp_file_path):
            raise HTTPException(status_code=404, detail="Original PPTX file not found. Please re-upload.")

        # Create output path
        output_dir = os.getenv("APP_DATA_DIRECTORY", "/app/app_data") + "/rewritten_presentations"
        os.makedirs(output_dir, exist_ok=True)

        output_filename = f"rewritten_{uuid.uuid4().hex[:8]}_{original_filename}"
        output_path = os.path.join(output_dir, output_filename)

        logger.info(f"Injecting content into PPTX: {temp_file_path} -> {output_path}")

        # Inject content into PPTX
        inject_content_into_pptx(temp_file_path, output_path, content_dict)

        logger.info(f"Successfully created rewritten PPTX: {output_path}")

        # Return file for download
        # Use RFC 5987 encoding for non-ASCII filenames (e.g., Hebrew)
        # Format: filename*=UTF-8''encoded_filename
        encoded_filename = quote(output_filename)

        return FileResponse(
            path=output_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=output_filename,
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error injecting content and creating download: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create rewritten presentation: {str(e)}")


@router.post("/rewrite-complete")
async def rewrite_complete(
    file: UploadFile = File(..., description="PPTX file to rewrite"),
    user_prompt: str = Form(..., description="User's content generation prompt")
):
    """
    Complete end-to-end content rewrite in a single API call.

    Combines all three steps:
    1. Extract placeholders
    2. Generate rewritten content
    3. Inject and return file

    This is a convenience endpoint for simple workflows.
    """
    try:
        # STEP 1: Extract placeholders
        upload_dir = os.getenv("APP_DATA_DIRECTORY", "/app/app_data") + "/temp_uploads"
        os.makedirs(upload_dir, exist_ok=True)

        file_id = str(uuid.uuid4())
        temp_path = os.path.join(upload_dir, f"{file_id}.pptx")

        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        logger.info(f"Starting complete rewrite for: {file.filename}")

        placeholder_structure = extract_all_placeholders(temp_path)
        clean_structure = {"slides": placeholder_structure.get("slides", [])}

        # STEP 2: Generate rewritten content
        user_message = f"""User's Content Request:
{user_prompt}

Placeholder Structure (you must fill these exact placeholders):
{json.dumps(clean_structure, indent=2)}

Generate rewritten content that matches this structure exactly."""

        llm_client = LLMClient()
        response = llm_client.get_completion(
            system_prompt=CONTENT_REWRITE_SYSTEM_PROMPT,
            user_prompt=user_message,
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        # Clean the response before parsing
        cleaned_response = clean_json_response(response)
        rewritten_content = json.loads(cleaned_response)
        rewritten_content = sanitize_rewritten_content(clean_structure, rewritten_content)
        validate_rewritten_content(clean_structure, rewritten_content)

        # STEP 3: Inject and create output file
        output_dir = os.getenv("APP_DATA_DIRECTORY", "/app/app_data") + "/rewritten_presentations"
        os.makedirs(output_dir, exist_ok=True)

        output_filename = f"rewritten_{uuid.uuid4().hex[:8]}_{file.filename}"
        output_path = os.path.join(output_dir, output_filename)

        inject_content_into_pptx(temp_path, output_path, rewritten_content)

        logger.info(f"Complete rewrite successful: {output_path}")

        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass

        return FileResponse(
            path=output_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=output_filename,
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"'
            }
        )

    except json.JSONDecodeError as e:
        logger.error(f"LLM returned invalid JSON: {e}")
        raise HTTPException(status_code=500, detail=f"Content generation failed: Invalid LLM response")
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error in complete rewrite: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")
