"""
Relaxed JSON parsing with automatic repair for LLM outputs.

Small models often produce invalid JSON with:
- Missing commas or brackets
- Trailing commas
- Single quotes instead of double quotes
- Extra text before/after JSON
- Incomplete JSON objects

This module attempts multiple repair strategies to extract valid JSON.
"""

import json
import re
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Try to import json_repair (optional dependency)
try:
    from json_repair import repair_json as jsonrepair
    HAS_JSONREPAIR = True
except ImportError:
    HAS_JSONREPAIR = False
    logger.warning("json-repair library not found. Install with: pip install json-repair")


def extract_json_from_markdown(text: str) -> Optional[str]:
    """
    Extract JSON from markdown code blocks.

    Handles patterns like:
    ```json
    {"key": "value"}
    ```

    Or:
    ```
    {"key": "value"}
    ```

    Args:
        text: Raw text potentially containing markdown

    Returns:
        Extracted JSON string or None
    """
    # Try to find JSON in code blocks
    patterns = [
        r'```json\s*\n(.*?)\n```',  # ```json ... ```
        r'```\s*\n(\{.*?\})\s*\n```',  # ``` ... ```
        r'```\s*\n(\[.*?\])\s*\n```',  # ``` [...] ```
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

    return None


def extract_first_json_object(text: str) -> Optional[str]:
    """
    Extract the first complete JSON object or array from text.

    Args:
        text: Raw text containing JSON

    Returns:
        First JSON object/array found or None
    """
    # Try to find complete JSON object
    obj_match = re.search(r'\{[^\}]*\}', text, re.DOTALL)
    if obj_match:
        # Try to expand to full nested object
        start = obj_match.start()
        depth = 0
        for i, char in enumerate(text[start:], start=start):
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    return text[start:i+1]

    # Try to find complete JSON array
    arr_match = re.search(r'\[[^\]]*\]', text, re.DOTALL)
    if arr_match:
        start = arr_match.start()
        depth = 0
        for i, char in enumerate(text[start:], start=start):
            if char == '[':
                depth += 1
            elif char == ']':
                depth -= 1
                if depth == 0:
                    return text[start:i+1]

    return None


def fix_common_json_issues(text: str) -> str:
    """
    Fix common JSON formatting issues.

    Args:
        text: Potentially malformed JSON string

    Returns:
        Fixed JSON string
    """
    # Replace single quotes with double quotes (but not in strings)
    # This is a simple heuristic, not perfect
    text = re.sub(r"'([^']*)':", r'"\1":', text)

    # Remove trailing commas before closing brackets
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)

    # Fix missing commas between properties (heuristic)
    text = re.sub(r'"\s*\n\s*"', '",\n"', text)

    # Remove comments (// and /* */)
    text = re.sub(r'//.*?\n', '\n', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)

    return text


def parse_llm_json(
    text: str,
    strict: bool = False,
    repair: bool = True
) -> Any:
    """
    Parse JSON from LLM output with multiple fallback strategies.

    Strategies (in order):
    1. Direct JSON parse
    2. Extract from markdown code blocks
    3. Fix common issues and parse
    4. Use jsonrepair library (if available)
    5. Extract first complete JSON object
    6. Manual repair attempts

    Args:
        text: Raw LLM output text
        strict: If True, only try direct parsing
        repair: If False, skip repair attempts

    Returns:
        Parsed JSON object

    Raises:
        ValueError: If JSON cannot be parsed with any strategy
    """
    if not text or not text.strip():
        raise ValueError("Empty text provided for JSON parsing")

    original_text = text
    text = text.strip()

    # Strategy 1: Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        if strict:
            raise ValueError(f"Strict mode: Invalid JSON - {e}")
        logger.debug(f"Direct JSON parse failed: {e}")

    if not repair:
        raise ValueError("Repair disabled and direct parse failed")

    # Strategy 2: Extract from markdown code blocks
    markdown_json = extract_json_from_markdown(text)
    if markdown_json:
        try:
            return json.loads(markdown_json)
        except json.JSONDecodeError:
            logger.debug("Markdown extraction failed to produce valid JSON")
            # Continue to next strategy with the extracted text
            text = markdown_json

    # Strategy 3: Fix common issues
    try:
        fixed_text = fix_common_json_issues(text)
        return json.loads(fixed_text)
    except json.JSONDecodeError as e:
        logger.debug(f"Common fixes parse failed: {e}")

    # Strategy 4: Use jsonrepair library
    if HAS_JSONREPAIR:
        try:
            repaired = jsonrepair(text)
            return json.loads(repaired)
        except Exception as e:
            logger.debug(f"jsonrepair failed: {e}")

    # Strategy 5: Extract first complete JSON object
    first_json = extract_first_json_object(text)
    if first_json:
        try:
            return json.loads(first_json)
        except json.JSONDecodeError:
            # Try fixing common issues on extracted JSON
            try:
                fixed_first = fix_common_json_issues(first_json)
                return json.loads(fixed_first)
            except json.JSONDecodeError as e:
                logger.debug(f"Extracted JSON parse failed: {e}")

    # All strategies failed
    logger.error(f"All JSON parsing strategies failed for text: {original_text[:200]}...")
    raise ValueError(
        "Could not parse JSON from LLM response. "
        "The model may have produced invalid output. "
        "Try using a more capable model or enabling strict mode."
    )


def validate_and_repair_json(
    text: str,
    expected_keys: Optional[list] = None,
    strict: bool = False
) -> dict:
    """
    Parse and validate JSON, ensuring required keys are present.

    Args:
        text: Raw LLM output
        expected_keys: List of keys that must be present
        strict: Use strict parsing mode

    Returns:
        Validated dictionary

    Raises:
        ValueError: If parsing fails or required keys are missing
    """
    data = parse_llm_json(text, strict=strict)

    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object, got {type(data)}")

    if expected_keys:
        missing_keys = [key for key in expected_keys if key not in data]
        if missing_keys:
            raise ValueError(f"Missing required keys: {missing_keys}")

    return data
