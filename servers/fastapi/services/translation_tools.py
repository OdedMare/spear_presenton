"""
Translation Tools Registry

This module implements the tool registry for the multi-agent translation system.
Each tool is a concrete implementation that agents can call.

Tool Categories:
1. Structure Tools - for parsing and extracting placeholders
2. Translation Tools - for actual translation work
3. Assembler Tools - for merging and validating results
"""

import os
import json
import logging
import re
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Lazy import of translation dependencies to allow server to start without them
_deep_translator = None
_langdetect = None


def _get_translator():
    """Lazy import GoogleTranslator"""
    global _deep_translator
    if _deep_translator is None:
        try:
            from deep_translator import GoogleTranslator
            _deep_translator = GoogleTranslator
        except ImportError:
            logger.error("deep_translator not installed. Run: pip install deep-translator")
            raise ImportError(
                "Translation dependencies not installed. "
                "Run: pip install deep-translator langdetect"
            )
    return _deep_translator


def _get_langdetect():
    """Lazy import langdetect"""
    global _langdetect
    if _langdetect is None:
        try:
            import langdetect
            _langdetect = langdetect
        except ImportError:
            logger.error("langdetect not installed. Run: pip install langdetect")
            raise ImportError(
                "Translation dependencies not installed. "
                "Run: pip install deep-translator langdetect"
            )
    return _langdetect

# Get app data directory for storing translation maps
APP_DATA_DIR = os.getenv("APP_DATA_DIRECTORY", "./app_data")
TRANSLATION_MAPS_DIR = Path(APP_DATA_DIR) / "translation_maps"
TRANSLATION_MAPS_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================================
# STRUCTURE TOOLS (Agent 1)
# ============================================================================

def read_json(path: str) -> Dict[str, Any]:
    """
    Read JSON file from filesystem.

    Args:
        path: Absolute or relative path to JSON file

    Returns:
        Parsed JSON as dictionary
    """
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {path}: {e}")
        raise


def extract_placeholders(placeholder_structure: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract all translatable placeholders from presentation structure.

    Args:
        placeholder_structure: Output from extract_all_placeholders

    Returns:
        List of placeholder dictionaries with metadata
    """
    placeholders = []

    for slide in placeholder_structure.get("slides", []):
        slide_num = slide.get("slideNumber")

        for element in slide.get("elements", []):
            placeholders.append({
                "id": element.get("id"),
                "text": element.get("text", ""),
                "slideNumber": slide_num,
                "type": element.get("type", ""),
                "placeholderType": element.get("placeholderType", ""),
                "maxLength": element.get("maxLength"),
                "maxLines": element.get("maxLines"),
            })

    logger.info(f"Extracted {len(placeholders)} placeholders")
    return placeholders


def detect_language(text_sample: str) -> str:
    """
    Detect language from a text sample.

    Args:
        text_sample: Sample text to analyze

    Returns:
        Language code (e.g., 'en', 'he', 'ar')
    """
    langdetect = _get_langdetect()
    try:
        lang = langdetect.detect(text_sample)
        logger.debug(f"Detected language: {lang}")
        return lang
    except Exception as e:
        logger.warning(f"Could not detect language from: {text_sample[:50]}... Error: {e}")
        return "unknown"


def validate_structure(structure: Dict[str, Any], schema: Optional[Dict[str, Any]] = None) -> bool:
    """
    Validate that structure matches expected schema.

    Args:
        structure: Structure to validate
        schema: Optional JSON schema (if None, uses basic validation)

    Returns:
        True if valid, raises exception otherwise
    """
    # Basic validation
    if not isinstance(structure, dict):
        raise ValueError("Structure must be a dictionary")

    if "slides" not in structure:
        raise ValueError("Structure missing 'slides' key")

    slides = structure["slides"]
    if not isinstance(slides, list):
        raise ValueError("'slides' must be a list")

    for idx, slide in enumerate(slides):
        if "slideNumber" not in slide:
            raise ValueError(f"Slide {idx} missing 'slideNumber'")
        if "elements" not in slide:
            raise ValueError(f"Slide {idx} missing 'elements'")

    logger.info(f"Structure validation passed: {len(slides)} slides")
    return True


def write_translation_map(presentation_id: str, translation_map: Dict[str, str]) -> str:
    """
    Write translation map to persistent storage.

    Args:
        presentation_id: Unique ID for this presentation
        translation_map: Dict mapping element_id -> translated_text

    Returns:
        Path to saved file
    """
    file_path = TRANSLATION_MAPS_DIR / f"{presentation_id}_map.json"

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(translation_map, f, ensure_ascii=False, indent=2)

    logger.info(f"Saved translation map to {file_path}")
    return str(file_path)


# ============================================================================
# TRANSLATION TOOLS (Agent 2)
# ============================================================================

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """
    Translate a single text string.

    Args:
        text: Text to translate
        source_lang: Source language code
        target_lang: Target language code

    Returns:
        Translated text
    """
    if not text or not text.strip():
        return text

    try:
        # Convert language names to codes if needed
        source_code = _normalize_language_code(source_lang)
        target_code = _normalize_language_code(target_lang)

        GoogleTranslator = _get_translator()
        translator = GoogleTranslator(source=source_code, target=target_code)
        result = translator.translate(text)

        logger.debug(f"Translated: {text[:50]}... -> {result[:50]}...")
        return result
    except Exception as e:
        logger.error(f"Translation failed for '{text[:50]}...': {e}")
        return text  # Return original on failure


def batch_translate(items: List[Dict[str, str]], source_lang: str, target_lang: str) -> Dict[str, str]:
    """
    Translate multiple items in batch.

    Args:
        items: List of dicts with 'id' and 'text' keys
        source_lang: Source language code
        target_lang: Target language code

    Returns:
        Dict mapping id -> translated_text
    """
    results = {}

    for item in items:
        item_id = item.get("id")
        text = item.get("text", "")

        translated = translate_text(text, source_lang, target_lang)
        results[item_id] = translated

    logger.info(f"Batch translated {len(items)} items")
    return results


def terminology_guard(text: str, protected_terms: List[str]) -> str:
    """
    Ensure protected terms are not translated (e.g., brand names, product names).

    Args:
        text: Text that may contain protected terms
        protected_terms: List of terms that should not be translated

    Returns:
        Text with protected terms marked for preservation
    """
    # Create placeholders for protected terms
    placeholders = {}
    result = text

    for idx, term in enumerate(protected_terms):
        if term in result:
            placeholder = f"__PROTECTED_{idx}__"
            placeholders[placeholder] = term
            result = result.replace(term, placeholder)

    return result


def restore_protected_terms(text: str, placeholders: Dict[str, str]) -> str:
    """
    Restore protected terms after translation.

    Args:
        text: Translated text with placeholders
        placeholders: Dict mapping placeholder -> original_term

    Returns:
        Text with original protected terms restored
    """
    result = text
    for placeholder, term in placeholders.items():
        result = result.replace(placeholder, term)
    return result


def quality_check_translation(source: str, translated: str, max_length: Optional[int] = None) -> Dict[str, Any]:
    """
    Perform quality checks on translation.

    Args:
        source: Original text
        translated: Translated text
        max_length: Optional maximum length constraint

    Returns:
        Dict with quality check results
    """
    checks = {
        "passes": True,
        "issues": []
    }

    # Check if translation is empty when source wasn't
    if source.strip() and not translated.strip():
        checks["passes"] = False
        checks["issues"].append("Translation is empty")

    # Check length constraint
    if max_length and len(translated) > max_length:
        checks["passes"] = False
        checks["issues"].append(f"Translation exceeds max length ({len(translated)} > {max_length})")

    # Check if translation is identical to source (possible translation failure)
    if source == translated and len(source) > 10:
        checks["issues"].append("Warning: Translation identical to source")

    return checks


# ============================================================================
# ASSEMBLER TOOLS (Agent 3)
# ============================================================================

def read_translation_map(presentation_id: str) -> Dict[str, str]:
    """
    Read translation map from storage.

    Args:
        presentation_id: Unique ID for this presentation

    Returns:
        Dict mapping element_id -> translated_text
    """
    file_path = TRANSLATION_MAPS_DIR / f"{presentation_id}_map.json"

    if not file_path.exists():
        raise FileNotFoundError(f"Translation map not found: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        translation_map = json.load(f)

    logger.info(f"Loaded translation map from {file_path}")
    return translation_map


def merge_translations(
    base_structure: Dict[str, Any],
    translations: Dict[str, str]
) -> Dict[str, Any]:
    """
    Merge translations back into original structure.

    Args:
        base_structure: Original placeholder structure
        translations: Dict mapping element_id -> translated_text

    Returns:
        New structure with translations applied
    """
    result = {"slides": []}

    for slide in base_structure.get("slides", []):
        translated_slide = {
            "slideNumber": slide.get("slideNumber"),
            "elements": []
        }

        for element in slide.get("elements", []):
            el_id = element.get("id")
            translated_text = translations.get(el_id, element.get("text", ""))

            translated_slide["elements"].append({
                "id": el_id,
                "text": translated_text
            })

        result["slides"].append(translated_slide)

    logger.info(f"Merged translations into {len(result['slides'])} slides")
    return result


def resize_text_if_overflow(
    text: str,
    max_length: Optional[int] = None,
    max_lines: Optional[int] = None
) -> str:
    """
    Intelligently resize text to fit constraints.

    Args:
        text: Text to resize
        max_length: Maximum character length
        max_lines: Maximum number of lines

    Returns:
        Resized text
    """
    result = text

    # Handle line constraint
    if max_lines:
        lines = result.split('\n')
        if len(lines) > max_lines:
            result = '\n'.join(lines[:max_lines])
            logger.warning(f"Truncated to {max_lines} lines")

    # Handle length constraint
    if max_length and len(result) > max_length:
        if max_length > 3:
            result = result[:max_length - 3] + "..."
        else:
            result = result[:max_length]
        logger.warning(f"Truncated to {max_length} characters")

    return result


def preserve_rtl_layout(structure: Dict[str, Any], target_lang: str) -> Dict[str, Any]:
    """
    Apply RTL (Right-to-Left) layout adjustments for Hebrew/Arabic.

    Args:
        structure: Presentation structure
        target_lang: Target language code

    Returns:
        Structure with RTL metadata applied
    """
    rtl_languages = ['he', 'ar', 'hebrew', 'arabic']

    is_rtl = any(lang in target_lang.lower() for lang in rtl_languages)

    if not is_rtl:
        return structure

    # Add RTL metadata to structure
    result = structure.copy()
    result["rtl"] = True
    result["textDirection"] = "rtl"

    logger.info(f"Applied RTL layout for {target_lang}")
    return result


def write_final_presentation(structure: Dict[str, Any], output_path: str) -> str:
    """
    Write final translated structure to file.

    Args:
        structure: Final presentation structure
        output_path: Path to write output

    Returns:
        Absolute path to written file
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(structure, f, ensure_ascii=False, indent=2)

    logger.info(f"Wrote final presentation to {output_path}")
    return str(output_path.absolute())


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def _normalize_language_code(lang: str) -> str:
    """
    Normalize language names/codes to ISO 639-1 codes.

    Args:
        lang: Language name or code

    Returns:
        ISO 639-1 language code
    """
    lang_map = {
        'hebrew': 'he',
        'english': 'en',
        'arabic': 'ar',
        'spanish': 'es',
        'french': 'fr',
        'german': 'de',
        'chinese': 'zh-CN',
        'japanese': 'ja',
        'korean': 'ko',
        'russian': 'ru',
        'portuguese': 'pt',
        'italian': 'it',
        'dutch': 'nl',
        'polish': 'pl',
        'turkish': 'tr',
        'vietnamese': 'vi',
        'thai': 'th',
        'hindi': 'hi',
    }

    lang_lower = lang.lower().strip()
    return lang_map.get(lang_lower, lang_lower)


# ============================================================================
# TOOL REGISTRY
# ============================================================================

TRANSLATION_TOOLS = {
    # Structure tools (Agent 1)
    "read_json": read_json,
    "extract_placeholders": extract_placeholders,
    "detect_language": detect_language,
    "validate_structure": validate_structure,
    "write_translation_map": write_translation_map,

    # Translation tools (Agent 2)
    "translate_text": translate_text,
    "batch_translate": batch_translate,
    "terminology_guard": terminology_guard,
    "restore_protected_terms": restore_protected_terms,
    "quality_check_translation": quality_check_translation,

    # Assembler tools (Agent 3)
    "read_translation_map": read_translation_map,
    "merge_translations": merge_translations,
    "resize_text_if_overflow": resize_text_if_overflow,
    "preserve_rtl_layout": preserve_rtl_layout,
    "write_final_presentation": write_final_presentation,
}


def get_tool(tool_name: str):
    """
    Get a tool from the registry.

    Args:
        tool_name: Name of the tool

    Returns:
        Tool function

    Raises:
        KeyError if tool not found
    """
    if tool_name not in TRANSLATION_TOOLS:
        raise KeyError(f"Tool '{tool_name}' not found in registry. Available tools: {list(TRANSLATION_TOOLS.keys())}")

    return TRANSLATION_TOOLS[tool_name]
