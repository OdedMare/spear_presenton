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
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.placeholder_extractor import extract_all_placeholders, validate_rewritten_content
from services.placeholder_injector import inject_content_into_pptx
from services.llm_client import LLMClient
from models.llm_message import LLMSystemMessage, LLMUserMessage
from utils.llm_provider import get_model
from api.v1.ppt.endpoints.prompts import CONTENT_REWRITE_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

router = APIRouter()


def sanitize_rewritten_content(original_structure: Dict[str, Any], rewritten_content: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize rewritten content to ensure it respects maxLength and maxLines constraints.

    This is a safety mechanism to automatically truncate text that exceeds constraints,
    preventing validation errors when the LLM generates slightly too much text.

    Returns sanitized copy of rewritten_content.
    """
    sanitized = {"slides": []}

    original_slides = original_structure.get("slides", [])
    rewritten_slides = rewritten_content.get("slides", [])

    for orig_slide, rewritten_slide in zip(original_slides, rewritten_slides):
        orig_elements = orig_slide.get("elements", [])
        rewritten_elements = rewritten_slide.get("elements", [])

        sanitized_elements = []

        for orig_el, rewritten_el in zip(orig_elements, rewritten_elements):
            text = rewritten_el.get("text", "")
            max_length = orig_el.get("maxLength")
            max_lines = orig_el.get("maxLines")

            # Truncate if text exceeds maxLength
            if max_length and len(text) > max_length:
                logger.warning(
                    f"Truncating element {rewritten_el.get('id')}: "
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
                        f"Truncating lines for element {rewritten_el.get('id')}: "
                        f"{len(lines)} lines exceeds maxLines {max_lines}"
                    )
                    text = '\n'.join(lines[:max_lines])

            sanitized_elements.append({
                "id": rewritten_el.get("id"),
                "text": text
            })

        sanitized["slides"].append({
            "slideNumber": rewritten_slide.get("slideNumber"),
            "elements": sanitized_elements
        })

    return sanitized


class RewriteRequest(BaseModel):
    """Request model for content rewriting"""
    user_prompt: str
    placeholder_structure: Dict[str, Any]


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
    Generate rewritten content using LLM.

    This is step 2 of the content rewrite workflow.
    Takes placeholder structure and user prompt, returns rewritten content.
    """
    try:
        user_prompt = request.user_prompt
        placeholder_structure = request.placeholder_structure

        # Remove metadata fields before sending to LLM
        clean_structure = {
            "slides": placeholder_structure.get("slides", [])
        }

        # Format the user message for the LLM
        user_message = f"""User's Content Request:
{user_prompt}

Placeholder Structure (you must fill these exact placeholders):
{json.dumps(clean_structure, indent=2)}

Generate rewritten content that matches this structure exactly."""

        logger.info(f"Sending content rewrite request to LLM for {len(clean_structure['slides'])} slides")

        # Call LLM to generate rewritten content
        llm_client = LLMClient()
        model = get_model()

        # Prepare messages
        messages = [
            LLMSystemMessage(content=CONTENT_REWRITE_SYSTEM_PROMPT),
            LLMUserMessage(content=user_message)
        ]

        # Use generate() for plain text output (LLM will return JSON based on system prompt)
        response_text = await llm_client.generate(
            model=model,
            messages=messages,
        )

        # Parse JSON response
        try:
            rewritten_content = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"LLM returned invalid JSON: {response_text}")
            raise HTTPException(
                status_code=500,
                detail=f"LLM returned invalid JSON format: {str(e)}"
            )

        # Sanitize content to ensure it fits within constraints
        rewritten_content = sanitize_rewritten_content(clean_structure, rewritten_content)

        # Validate that rewritten content matches original structure
        try:
            validate_rewritten_content(clean_structure, rewritten_content)
        except ValueError as e:
            logger.error(f"Rewritten content validation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"LLM output doesn't match placeholder structure: {str(e)}"
            )

        logger.info("Successfully generated rewritten content")

        return RewrittenContentResponse(
            rewritten_content=rewritten_content,
            message=f"Successfully generated content for {len(rewritten_content['slides'])} slides"
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
        return FileResponse(
            path=output_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=output_filename,
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"'
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
