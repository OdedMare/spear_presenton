"""
Multi-Agent Presentation Translation API

This endpoint provides standalone translation for presentations using the
3-agent architecture (Structure, Translation, Assembler).

Endpoint:
    POST /api/v1/ppt/translate

Features:
    - Upload PPTX and translate to target language
    - Multi-agent pipeline with retry logic
    - RTL support for Hebrew/Arabic
    - Structured error responses
    - Translation map persistence
"""

import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from services.placeholder_extractor import extract_all_placeholders
from services.placeholder_injector import inject_content_into_pptx
from services.translation_orchestrator import (
    translate_presentation_with_agents,
    TranslationResult,
    TranslationError,
)
from services.temp_file_service import TempFileService

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TranslateRequest(BaseModel):
    """Request model for translation (when using JSON payload)"""
    presentation_id: Optional[str] = Field(None, description="Optional presentation ID")
    source_language: str = Field(..., description="Source language (e.g., 'en', 'hebrew')")
    target_language: str = Field(..., description="Target language (e.g., 'he', 'english')")
    use_llm_parser: bool = Field(False, description="Use LLM for parsing instead of rule-based")
    parser_model: Optional[str] = Field(None, description="Model for parser agent")
    translator_model: Optional[str] = Field(None, description="Model for translator agent")
    validator_model: Optional[str] = Field(None, description="Model for validator agent")
    batch_size: int = Field(20, description="Translation batch size")
    max_retries: int = Field(1, description="Max retries per agent")


class TranslateSuccessResponse(BaseModel):
    """Success response model"""
    status: str = "success"
    presentation_id: str
    output_path: str
    download_url: str
    stats: dict


class TranslateErrorResponse(BaseModel):
    """Error response model"""
    status: str = "error"
    stage: str
    message: str
    details: Optional[dict] = None


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post(
    "/translate",
    summary="Translate presentation using multi-agent pipeline",
    description="""
    Translate a PPTX presentation using a 3-agent architecture:

    1. **Structure Agent** - Analyzes and extracts translatable content
    2. **Translation Agent** - Performs high-quality translation
    3. **Assembler Agent** - Validates and merges translations

    Features:
    - Automatic RTL support for Hebrew/Arabic
    - Retry logic for fault tolerance
    - Preserves formatting and layout
    - Respects text length constraints

    Example:
    ```bash
    curl -X POST http://localhost:8000/api/v1/ppt/translate \\
      -F "file=@presentation.pptx" \\
      -F "source_language=hebrew" \\
      -F "target_language=english"
    ```
    """,
    responses={
        200: {
            "description": "Translation successful",
            "model": TranslateSuccessResponse
        },
        400: {
            "description": "Translation failed",
            "model": TranslateErrorResponse
        }
    }
)
async def translate_presentation(
    file: UploadFile = File(..., description="PPTX file to translate"),
    source_language: str = Form(..., description="Source language (e.g., 'en', 'hebrew', 'he')"),
    target_language: str = Form(..., description="Target language (e.g., 'he', 'english', 'en')"),
    presentation_id: Optional[str] = Form(None, description="Optional unique ID"),
    use_llm_parser: bool = Form(False, description="Use LLM for parsing (default: rule-based)"),
    parser_model: Optional[str] = Form(None, description="Model for parser agent (optional, uses TRANSLATION_PARSER_MODEL env var)"),
    translator_model: Optional[str] = Form(None, description="Model for translator (required, uses TRANSLATION_MODEL env var)"),
    validator_model: Optional[str] = Form(None, description="Model for validator (optional, uses TRANSLATION_VALIDATOR_MODEL env var)"),
    batch_size: int = Form(20, description="Translation batch size (default: 20)"),
    max_retries: int = Form(1, description="Max retries per agent (default: 1)"),
):
    """
    Translate a presentation from source language to target language.

    This endpoint uses a multi-agent architecture for optimal quality and cost:
    - Structure Agent: Analyzes placeholder structure
    - Translation Agent: Performs actual translation
    - Assembler Agent: Validates and merges results

    Returns:
        TranslateSuccessResponse with download URL on success
        TranslateErrorResponse with error details on failure
    """
    temp_file_service = TempFileService()
    presentation_id = presentation_id or str(uuid.uuid4())

    try:
        logger.info(f"=" * 80)
        logger.info(f"Translation Request Received")
        logger.info(f"Presentation ID: {presentation_id}")
        logger.info(f"Source: {source_language} -> Target: {target_language}")
        logger.info(f"File: {file.filename}")
        logger.info(f"=" * 80)

        # Validate file type
        if not file.filename.endswith('.pptx'):
            raise HTTPException(
                status_code=400,
                detail="Only PPTX files are supported"
            )

        # Save uploaded file
        logger.info(f"Saving uploaded file: {file.filename}")
        input_path = temp_file_service.save_upload_file(file, f"{presentation_id}_input.pptx")
        logger.info(f"Saved to: {input_path}")

        # Step 1: Extract placeholders
        logger.info(f"Extracting placeholders from PPTX...")
        placeholder_structure = extract_all_placeholders(input_path)
        logger.info(f"Extracted structure with {len(placeholder_structure.get('slides', []))} slides")

        # Step 2: Run multi-agent translation pipeline
        logger.info(f"Starting multi-agent translation pipeline...")

        parser_config = {
            "use_llm": use_llm_parser,
            "model": parser_model
        }

        translator_config = {
            "model": translator_model,
            "batch_size": batch_size
        }

        validator_config = {
            "model": validator_model
        }

        result, error = await translate_presentation_with_agents(
            placeholder_structure=placeholder_structure,
            source_language=source_language,
            target_language=target_language,
            presentation_id=presentation_id,
            max_retries=max_retries,
            parser_config=parser_config,
            translator_config=translator_config,
            validator_config=validator_config
        )

        # Check for errors
        if error is not None:
            logger.error(f"Translation failed at stage '{error.stage}': {error.message}")
            return TranslateErrorResponse(
                status="error",
                stage=error.stage,
                message=error.message,
                details=error.details
            )

        # Step 3: Inject translations back into PPTX
        logger.info(f"Injecting translations into PPTX...")
        output_filename = f"{presentation_id}_translated.pptx"
        output_path = temp_file_service.get_temp_path(output_filename)

        inject_content_into_pptx(
            input_pptx_path=input_path,
            rewritten_content=result.output_structure,
            output_pptx_path=output_path
        )

        logger.info(f"Translation complete! Output: {output_path}")

        # Generate download URL
        download_url = f"/api/v1/ppt/files/download/{output_filename}"

        # Build success response
        response = TranslateSuccessResponse(
            status="success",
            presentation_id=presentation_id,
            output_path=output_path,
            download_url=download_url,
            stats=result.stats or {}
        )

        logger.info(f"=" * 80)
        logger.info(f"Translation Success!")
        logger.info(f"Download URL: {download_url}")
        logger.info(f"Stats: {result.stats}")
        logger.info(f"=" * 80)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during translation: {e}", exc_info=True)
        return TranslateErrorResponse(
            status="error",
            stage="unknown",
            message=f"Unexpected error: {str(e)}",
            details={"presentation_id": presentation_id}
        )


@router.get(
    "/translate/status/{presentation_id}",
    summary="Get translation status",
    description="Check the status of a translation job by presentation ID"
)
async def get_translation_status(presentation_id: str):
    """
    Get the status of a translation job.

    This can be used to check if a translation is complete and retrieve
    the translation map file if available.
    """
    from services.translation_tools import TRANSLATION_MAPS_DIR
    from pathlib import Path

    map_path = TRANSLATION_MAPS_DIR / f"{presentation_id}_map.json"

    if not map_path.exists():
        return {
            "status": "not_found",
            "presentation_id": presentation_id,
            "message": "Translation not found or not yet started"
        }

    # Read translation map
    import json
    with open(map_path, 'r', encoding='utf-8') as f:
        translation_map = json.load(f)

    return {
        "status": "completed",
        "presentation_id": presentation_id,
        "total_translations": len(translation_map),
        "map_path": str(map_path)
    }


@router.get(
    "/translate/health",
    summary="Health check for translation service",
    description="Check if translation service is available and configured properly"
)
async def translation_health_check():
    """
    Health check endpoint for translation service.

    Returns service status and configuration info.
    """
    import os

    # Check if translation dependencies are installed
    dependencies_installed = False
    dependency_error = None
    try:
        from services.translation_tools import _get_translator, _get_langdetect
        _get_translator()
        _get_langdetect()
        dependencies_installed = True
    except ImportError as e:
        dependency_error = str(e)

    config = {
        "parser_use_llm": os.getenv("TRANSLATION_PARSER_USE_LLM", "false"),
        "parser_model": os.getenv("TRANSLATION_PARSER_MODEL", "not configured"),
        "translator_model": os.getenv("TRANSLATION_MODEL", "not configured"),
        "validator_model": os.getenv("TRANSLATION_VALIDATOR_MODEL", "not configured"),
        "batch_size": os.getenv("TRANSLATION_BATCH_SIZE", "20"),
    }

    status = "healthy" if dependencies_installed else "dependencies_missing"

    response = {
        "status": status,
        "service": "multi-agent-translation",
        "version": "1.0.0",
        "agents": ["structure", "translation", "assembler"],
        "configuration": config,
        "dependencies_installed": dependencies_installed
    }

    if not dependencies_installed:
        response["error"] = dependency_error
        response["install_command"] = "pip install deep-translator langdetect"

    return response


# Export router
TRANSLATION_ROUTER = router
