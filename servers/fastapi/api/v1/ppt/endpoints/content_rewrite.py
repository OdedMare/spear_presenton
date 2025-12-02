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
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
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

logger = logging.getLogger(__name__)

router = APIRouter()


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
        # Flexible mode: Just copy elements, no strict validation
        # We'll validate slide count and basic structure only
        for rewritten_slide in rewritten_slides:
            sanitized["slides"].append({
                "slideNumber": rewritten_slide.get("slideNumber"),
                "elements": rewritten_slide.get("elements", [])
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
    file: UploadFile = File(..., description="PPTX file to extract text elements from")
):
    """
    Extract ALL text elements from an uploaded PPTX file with IDs and constraints.

    This is step 1 of the content rewrite workflow.
    Extracts shapes, textboxes, tables, charts, SmartArt, and speaker notes.
    Each element gets a unique ID and text length/line constraints for scale & fit.

    Returns the element structure that the LLM will use to generate new content.
    """
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

        logger.info(f"Extracting placeholders from uploaded file: {file.filename}")

        # Extract placeholder structure
        placeholder_structure = extract_all_placeholders(temp_path)

        # Store the file path in the response for later use
        # (Frontend will send this back when requesting rewrite)
        placeholder_structure["_temp_file_path"] = temp_path
        placeholder_structure["_original_filename"] = file.filename

        logger.info(
            f"Extracted {len(placeholder_structure['slides'])} slides from {file.filename}"
        )

        return RewriteResponse(
            placeholder_structure=placeholder_structure,
            message=f"Successfully extracted placeholders from {len(placeholder_structure['slides'])} slides"
        )

    except Exception as e:
        logger.error(f"Error extracting placeholders: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to extract placeholders: {str(e)}")


@router.post("/generate-rewritten-content", response_model=RewrittenContentResponse)
async def generate_rewritten_content(request: RewriteRequest):
    """
    Generate rewritten content using LLM with smart chunking and automatic fallback.

    Features:
    - Estimates token usage before sending to LLM
    - Automatically chunks large presentations
    - Tries full prompt first, falls back to lite prompt on failure
    - Processes chunks sequentially
    """
    try:
        user_prompt = request.user_prompt
        placeholder_structure = request.placeholder_structure
        mode = request.mode
        keywords = request.keywords or []
        source_language = request.source_language
        target_language = request.target_language

        # Remove metadata fields before sending to LLM
        clean_structure = {
            "slides": placeholder_structure.get("slides", [])
        }

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

        chunked_results = []
        
        for i, chunk in enumerate(chunks, 1):
            chunk_slides = chunk.get("slides", [])
            slide_numbers = [s.get("slideNumber") for s in chunk_slides]
            
            logger.info(f"Processing batch {i}/{len(chunks)}: {len(chunk_slides)} slides")
            
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
                    logger.info(f"Batch {i}: Attempting with {attempt_name} prompt...")
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
                        chunk_result = json.loads(response_text)
                        # If successful, break the retry loop
                        logger.info(f"Batch {i}: Success with {attempt_name} prompt")
                        break
                    except json.JSONDecodeError as e:
                        logger.warning(f"Batch {i}: Invalid JSON with {attempt_name} prompt: {e}")
                        last_error = e
                        continue
                        
                except Exception as e:
                    logger.warning(f"Batch {i}: Error with {attempt_name} prompt: {e}")
                    last_error = e
                    continue
            
            if chunk_result is None:
                error_msg = f"Failed to process batch {i} after {len(attempts)} attempts. Last error: {last_error}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)
            
            # Sanitize chunk result
            chunk_result = sanitize_rewritten_content(chunk, chunk_result, mode)
            chunked_results.append(chunk_result)
        
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

        return RewrittenContentResponse(
            rewritten_content=rewritten_content,
            message=f"Successfully generated content for {len(rewritten_content['slides'])} slides in {len(chunks)} batch(es)"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating rewritten content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")


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

        rewritten_content = json.loads(response)
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
