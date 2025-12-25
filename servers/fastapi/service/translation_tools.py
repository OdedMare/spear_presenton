import os
import json
import logging
import re
import uuid
import datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

# Lazy import of translation dependencies to allow server to start without them
_deep_translator = None
_langdetect = None

APP_DATA_DIR = os.getenv("APP_DATA_DIRECTORY", "./app_data")
TRANSLATION_MAPS_DIR = Path(APP_DATA_DIR) / "translation_maps"
TRANSLATION_MAPS_DIR.mkdir(parents=True, exist_ok=True)

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

def extract_placeholders(placeholder_structure: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract all translatable placeholders from presentation structure.
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
    """Detect language from a text sample."""
    langdetect = _get_langdetect()
    try:
        lang = langdetect.detect(text_sample)
        return lang
    except Exception as e:
        logger.warning(f"Could not detect language: {e}")
        return "unknown"

def validate_structure(structure: Dict[str, Any], schema: Optional[Dict[str, Any]] = None) -> bool:
    """Validate that structure matches expected schema."""
    if not isinstance(structure, dict):
        raise ValueError("Structure must be a dictionary")
    if "slides" not in structure:
        raise ValueError("Structure missing 'slides' key")
    return True

def write_translation_map(presentation_id: str, translation_map: Dict[str, str]) -> str:
    """Write translation map to filesystem."""
    file_path = TRANSLATION_MAPS_DIR / f"{presentation_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(translation_map, f, ensure_ascii=False, indent=2)
    return str(file_path)

def read_translation_map(presentation_id: str) -> Dict[str, str]:
    """Read translation map from filesystem."""
    file_path = TRANSLATION_MAPS_DIR / f"{presentation_id}.json"
    if not file_path.exists():
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def merge_translations(original_structure: Dict[str, Any], translations: Dict[str, str]) -> Dict[str, Any]:
    """Merge translations back into presentation structure."""
    result = {"slides": []}
    for slide in original_structure.get("slides", []):
        new_elements = []
        for element in slide.get("elements", []):
            el_id = element.get("id")
            new_elements.append({
                **element,
                "text": translations.get(el_id, element.get("text", ""))
            })
        result["slides"].append({**slide, "elements": new_elements})
    return result

def resize_text_if_overflow(text: str, max_length: int) -> str:
    """Resize text if it exceeds length constraints."""
    if len(text) > max_length:
        return text[:max_length-3] + "..." if max_length > 3 else text[:max_length]
    return text

def preserve_rtl_layout(structure: Dict[str, Any], target_lang: str) -> Dict[str, Any]:
    """Apply RTL layout adjustments if needed."""
    if target_lang.lower() in ['he', 'hebrew', 'ar', 'arabic']:
        # Basic RTL marking for the structure - actual presentation creator handles PDF/PPTX direction
        structure["rtl"] = True
    return structure

def write_final_presentation(structure: Dict[str, Any], output_path: str) -> str:
    """Write final translated structure to destination."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(structure, f, ensure_ascii=False, indent=2)
    return output_path

def quality_check_translation(source: str, translated: str, max_length: Optional[int] = None) -> Dict[str, Any]:
    """Perform quality check on translation."""
    return {
        "ok": True,
        "length_ok": len(translated) <= max_length if max_length else True,
        "source_len": len(source),
        "translated_len": len(translated)
    }
