"""
Multi-Agent Translation Orchestrator

This module orchestrates the 3-agent translation pipeline with:
- Tool-based agent architecture
- Retry logic for fault tolerance
- Error handling with structured responses
- RTL support
- Persistent translation maps

Pipeline:
1. Structure Agent -> Extract and analyze placeholders using tools
2. Translation Agent -> Translate text using tools
3. Assembler Agent -> Merge and validate using tools
"""

import os
import uuid
import logging
import asyncio
from typing import Dict, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from contextlib import contextmanager

from services.translation_tools import (
    extract_placeholders,
    validate_structure,
    write_translation_map,
    read_translation_map,
    merge_translations,
    resize_text_if_overflow,
    preserve_rtl_layout,
    write_final_presentation,
    quality_check_translation,
    detect_language,
)
from services.translation_agents import (
    Agent1Parser,
    Agent2Translator,
    Agent3Validator,
    TranslationContext,
)

logger = logging.getLogger(__name__)


@contextmanager
def translation_env_override():
    """
    Context manager to temporarily override LLM environment variables
    with translation-specific settings if they are configured.

    This allows translation agents to use a different LLM endpoint
    than the main presentation generation pipeline.
    """
    # Store original values
    original_url = os.getenv("CUSTOM_LLM_URL")
    original_api_key = os.getenv("CUSTOM_LLM_API_KEY")
    original_provider = os.getenv("LLM")

    # Get translation-specific settings
    translation_url = os.getenv("TRANSLATION_CUSTOM_URL")
    translation_api_key = os.getenv("TRANSLATION_CUSTOM_API_KEY")

    # If translation-specific URL is set, temporarily override
    if translation_url:
        logger.info(f"Using translation-specific custom URL: {translation_url}")
        os.environ["CUSTOM_LLM_URL"] = translation_url
        if translation_api_key:
            os.environ["CUSTOM_LLM_API_KEY"] = translation_api_key
        # Force custom provider for translation
        os.environ["LLM"] = "custom"

    try:
        yield
    finally:
        # Restore original values
        if original_url:
            os.environ["CUSTOM_LLM_URL"] = original_url
        elif "CUSTOM_LLM_URL" in os.environ and translation_url:
            del os.environ["CUSTOM_LLM_URL"]

        if original_api_key:
            os.environ["CUSTOM_LLM_API_KEY"] = original_api_key
        elif "CUSTOM_LLM_API_KEY" in os.environ and translation_url:
            del os.environ["CUSTOM_LLM_API_KEY"]

        if original_provider:
            os.environ["LLM"] = original_provider
        elif "LLM" in os.environ and translation_url:
            del os.environ["LLM"]


class TranslationStage(str, Enum):
    """Translation pipeline stages"""
    STRUCTURE = "structure"
    TRANSLATION = "translation"
    ASSEMBLY = "assembly"


@dataclass
class TranslationError:
    """Structured error response"""
    stage: TranslationStage
    message: str
    details: Optional[Dict[str, Any]] = None


@dataclass
class TranslationResult:
    """Successful translation result"""
    status: str
    output_structure: Dict[str, Any]
    presentation_id: str
    translation_map_path: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None


class StructureAgent:
    """
    Agent 1: Structure Parser with Tool Integration

    Uses tools to extract and analyze presentation structure.
    """

    def __init__(self, use_llm: bool = False, model: Optional[str] = None):
        self.parser = Agent1Parser(use_llm=use_llm, model=model)

    def execute(
        self,
        placeholder_structure: Dict[str, Any],
        presentation_id: str
    ) -> Tuple[Dict[str, TranslationContext], Optional[TranslationError]]:
        """
        Execute structure extraction and analysis.

        Args:
            placeholder_structure: Input structure from extract_all_placeholders
            presentation_id: Unique ID for this translation job

        Returns:
            (contexts_dict, error) - error is None on success
        """
        try:
            # Tool: validate_structure
            logger.info(f"[Structure Agent] Validating structure for {presentation_id}")
            validate_structure(placeholder_structure)

            # Tool: extract_placeholders
            logger.info(f"[Structure Agent] Extracting placeholders")
            placeholders = extract_placeholders(placeholder_structure)

            # Use existing Agent1Parser for categorization
            contexts = self.parser.analyze_placeholder_structure(placeholder_structure)

            logger.info(f"[Structure Agent] Analyzed {len(contexts)} elements")
            return contexts, None

        except Exception as e:
            logger.error(f"[Structure Agent] Failed: {e}", exc_info=True)
            error = TranslationError(
                stage=TranslationStage.STRUCTURE,
                message=f"Structure analysis failed: {str(e)}",
                details={"presentation_id": presentation_id}
            )
            return {}, error


class TranslationAgent:
    """
    Agent 2: Translation Specialist with Tool Integration

    Uses tools for batch translation with quality checks.
    """

    def __init__(self, model: Optional[str] = None):
        self.translator = Agent2Translator(model=model)

    async def execute(
        self,
        contexts: Dict[str, TranslationContext],
        source_language: str,
        target_language: str,
        presentation_id: str,
        batch_size: int = 20
    ) -> Tuple[Dict[str, str], Optional[TranslationError]]:
        """
        Execute translation with quality checks.

        Args:
            contexts: Translation contexts from Structure Agent
            source_language: Source language name/code
            target_language: Target language name/code
            presentation_id: Unique ID for this translation job
            batch_size: Number of elements per batch

        Returns:
            (translations_dict, error) - error is None on success
        """
        try:
            logger.info(f"[Translation Agent] Starting translation: {source_language} -> {target_language}")

            # Use existing Agent2Translator for actual translation
            translations = await self.translator.translate_elements(
                contexts,
                source_language,
                target_language,
                batch_size
            )

            # Tool: write_translation_map (persist for debugging/recovery)
            logger.info(f"[Translation Agent] Saving translation map")
            map_path = write_translation_map(presentation_id, translations)

            logger.info(f"[Translation Agent] Completed {len(translations)} translations")
            logger.info(f"[Translation Agent] Translation map saved to: {map_path}")

            return translations, None

        except Exception as e:
            logger.error(f"[Translation Agent] Failed: {e}", exc_info=True)
            error = TranslationError(
                stage=TranslationStage.TRANSLATION,
                message=f"Translation failed: {str(e)}",
                details={
                    "presentation_id": presentation_id,
                    "source_language": source_language,
                    "target_language": target_language
                }
            )
            return {}, error


class AssemblerAgent:
    """
    Agent 3: Assembly & Validation with Tool Integration

    Uses tools to merge, validate, and apply RTL support.
    """

    def __init__(self, model: Optional[str] = None):
        self.validator = Agent3Validator(model=model)

    def execute(
        self,
        original_structure: Dict[str, Any],
        contexts: Dict[str, TranslationContext],
        translations: Dict[str, str],
        target_language: str,
        presentation_id: str
    ) -> Tuple[Dict[str, Any], Optional[TranslationError]]:
        """
        Execute assembly, validation, and RTL support.

        Args:
            original_structure: Original placeholder structure
            contexts: Translation contexts
            translations: Translations from Translation Agent
            target_language: Target language for RTL detection
            presentation_id: Unique ID for this translation job

        Returns:
            (final_structure, error) - error is None on success
        """
        try:
            logger.info(f"[Assembler Agent] Starting assembly and validation")

            # Use existing Agent3Validator for validation
            result = self.validator.validate_and_combine(
                original_structure,
                contexts,
                translations
            )

            # Tool: preserve_rtl_layout
            if target_language.lower() in ['he', 'hebrew', 'ar', 'arabic']:
                logger.info(f"[Assembler Agent] Applying RTL layout for {target_language}")
                result = preserve_rtl_layout(result, target_language)

            # Tool: validate_structure (final validation)
            logger.info(f"[Assembler Agent] Final structure validation")
            validate_structure(result)

            logger.info(f"[Assembler Agent] Assembly complete: {len(result['slides'])} slides")
            return result, None

        except Exception as e:
            logger.error(f"[Assembler Agent] Failed: {e}", exc_info=True)
            error = TranslationError(
                stage=TranslationStage.ASSEMBLY,
                message=f"Assembly failed: {str(e)}",
                details={
                    "presentation_id": presentation_id,
                    "target_language": target_language
                }
            )
            return {}, error


async def translate_presentation_with_agents(
    placeholder_structure: Dict[str, Any],
    source_language: str,
    target_language: str,
    presentation_id: Optional[str] = None,
    max_retries: int = 1,
    parser_config: Optional[Dict[str, Any]] = None,
    translator_config: Optional[Dict[str, Any]] = None,
    validator_config: Optional[Dict[str, Any]] = None
) -> Tuple[Optional[TranslationResult], Optional[TranslationError]]:
    """
    Main orchestrator for multi-agent translation with retry logic.

    This is the PRIMARY function to use for translation.

    Args:
        placeholder_structure: Output from extract_all_placeholders
        source_language: Source language (e.g., "en", "english", "he", "hebrew")
        target_language: Target language (e.g., "en", "english", "he", "hebrew")
        presentation_id: Optional unique ID (generated if not provided)
        max_retries: Number of retries per agent (default: 1)
        parser_config: Config for Structure Agent
        translator_config: Config for Translation Agent
        validator_config: Config for Assembler Agent

    Returns:
        (TranslationResult, None) on success
        (None, TranslationError) on failure

    Example:
        >>> structure = extract_all_placeholders("presentation.pptx")
        >>> result, error = await translate_presentation_with_agents(
        ...     structure,
        ...     source_language="hebrew",
        ...     target_language="english"
        ... )
        >>> if error:
        ...     print(f"Failed at {error.stage}: {error.message}")
        >>> else:
        ...     print(f"Success! Output: {result.output_structure}")
    """
    presentation_id = presentation_id or str(uuid.uuid4())
    parser_config = parser_config or {}
    translator_config = translator_config or {}
    validator_config = validator_config or {}

    logger.info(f"=" * 80)
    logger.info(f"Starting Multi-Agent Translation Pipeline")
    logger.info(f"Presentation ID: {presentation_id}")
    logger.info(f"Languages: {source_language} -> {target_language}")
    logger.info(f"Max Retries: {max_retries}")
    logger.info(f"=" * 80)

    # Use translation-specific environment configuration if set
    with translation_env_override():
        return await _execute_translation_pipeline(
            placeholder_structure,
            source_language,
            target_language,
            presentation_id,
            max_retries,
            parser_config,
            translator_config,
            validator_config
        )


async def _execute_translation_pipeline(
    placeholder_structure: Dict[str, Any],
    source_language: str,
    target_language: str,
    presentation_id: str,
    max_retries: int,
    parser_config: Dict[str, Any],
    translator_config: Dict[str, Any],
    validator_config: Dict[str, Any]
) -> Tuple[Optional[TranslationResult], Optional[TranslationError]]:
    """Internal function that executes the translation pipeline."""

    # Stage 1: Structure Agent
    logger.info(f"\n{'=' * 80}")
    logger.info(f"STAGE 1: STRUCTURE AGENT")
    logger.info(f"{'=' * 80}")

    structure_agent = StructureAgent(**parser_config)
    contexts = None
    last_error = None

    for attempt in range(max_retries + 1):
        if attempt > 0:
            logger.warning(f"[Structure Agent] Retry attempt {attempt}/{max_retries}")

        contexts, error = structure_agent.execute(placeholder_structure, presentation_id)

        if error is None:
            break

        last_error = error
        if attempt < max_retries:
            await asyncio.sleep(1)  # Brief delay before retry

    if contexts is None or last_error is not None:
        logger.error(f"[Structure Agent] Failed after {max_retries + 1} attempts")
        return None, last_error

    # Stage 2: Translation Agent
    logger.info(f"\n{'=' * 80}")
    logger.info(f"STAGE 2: TRANSLATION AGENT")
    logger.info(f"{'=' * 80}")

    translation_agent = TranslationAgent(model=translator_config.get("model"))
    batch_size = translator_config.get("batch_size", 20)
    translations = None
    last_error = None

    for attempt in range(max_retries + 1):
        if attempt > 0:
            logger.warning(f"[Translation Agent] Retry attempt {attempt}/{max_retries}")

        translations, error = await translation_agent.execute(
            contexts,
            source_language,
            target_language,
            presentation_id,
            batch_size
        )

        if error is None:
            break

        last_error = error
        if attempt < max_retries:
            await asyncio.sleep(1)

    if translations is None or last_error is not None:
        logger.error(f"[Translation Agent] Failed after {max_retries + 1} attempts")
        return None, last_error

    # Stage 3: Assembler Agent
    logger.info(f"\n{'=' * 80}")
    logger.info(f"STAGE 3: ASSEMBLER AGENT")
    logger.info(f"{'=' * 80}")

    assembler_agent = AssemblerAgent(model=validator_config.get("model"))
    final_structure = None
    last_error = None

    for attempt in range(max_retries + 1):
        if attempt > 0:
            logger.warning(f"[Assembler Agent] Retry attempt {attempt}/{max_retries}")

        final_structure, error = assembler_agent.execute(
            placeholder_structure,
            contexts,
            translations,
            target_language,
            presentation_id
        )

        if error is None:
            break

        last_error = error
        if attempt < max_retries:
            await asyncio.sleep(1)

    if final_structure is None or last_error is not None:
        logger.error(f"[Assembler Agent] Failed after {max_retries + 1} attempts")
        return None, last_error

    # Success!
    logger.info(f"\n{'=' * 80}")
    logger.info(f"TRANSLATION PIPELINE COMPLETE")
    logger.info(f"{'=' * 80}")

    # Calculate statistics
    total_elements = len(contexts)
    translatable_elements = sum(1 for ctx in contexts.values() if ctx.should_translate)
    skipped_elements = total_elements - translatable_elements

    stats = {
        "total_elements": total_elements,
        "translatable_elements": translatable_elements,
        "skipped_elements": skipped_elements,
        "total_slides": len(final_structure.get("slides", [])),
        "source_language": source_language,
        "target_language": target_language,
    }

    result = TranslationResult(
        status="success",
        output_structure=final_structure,
        presentation_id=presentation_id,
        stats=stats
    )

    logger.info(f"Translation Statistics:")
    logger.info(f"  - Total Elements: {stats['total_elements']}")
    logger.info(f"  - Translated: {stats['translatable_elements']}")
    logger.info(f"  - Skipped: {stats['skipped_elements']}")
    logger.info(f"  - Total Slides: {stats['total_slides']}")

    return result, None
