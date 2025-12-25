"""
Model capability detection for adaptive prompt and validation strategies.

This module helps the system automatically adapt to different model capabilities:
- Small models (Qwen 2.5, Llama 3, etc.) get simplified prompts
- Large models (GPT-4, Claude, etc.) get detailed instructions
"""

import os
import re
from typing import Literal

# List of known small/medium models that need simplified prompts
SMALL_MODELS = [
    "qwen", "llama-3.2", "llama-3-8b", "mistral-7b", "gemma",
    "phi", "llama-3.1-8b", "qwen2.5-7b", "qwen2.5-3b",
    "llama3.2", "llama3-8b", "yi-6b", "deepseek-7b"
]

# Parameter size patterns that indicate small models
SMALL_SIZE_PATTERNS = [
    r"\b[0-9]b\b",      # 1b, 3b, 7b, 8b
    r"\b[0-9]\.[0-9]b\b"  # 1.5b, 2.5b
]

# Models known to work well with complex prompts
LARGE_MODELS = [
    "gpt-4", "gpt-4o", "claude-3", "claude-3.5", "gemini-1.5-pro",
    "gemini-pro", "command-r-plus", "llama-3.1-70b", "llama-3-70b",
    "qwen2.5-72b", "mixtral-8x22b"
]


def is_small_model(model_name: str) -> bool:
    """
    Detect if a model is a smaller/weaker model that needs simplified prompts.

    Args:
        model_name: Name of the LLM model (e.g., "qwen2.5-7b", "gpt-4")

    Returns:
        True if model is small/weak, False otherwise

    Examples:
        >>> is_small_model("qwen2.5-7b")
        True
        >>> is_small_model("gpt-4")
        False
        >>> is_small_model("llama-3.1-8b")
        True
    """
    # Check if adaptive mode is forced via environment variable
    force_adaptive = os.getenv("FORCE_ADAPTIVE_MODE")
    if force_adaptive and force_adaptive.lower() in ["true", "1", "yes"]:
        return True

    if not model_name:
        return False

    model_lower = model_name.lower()

    # Check against known large models first (these can handle complex prompts)
    for large in LARGE_MODELS:
        if large in model_lower:
            return False

    # Check against known small model names
    for small in SMALL_MODELS:
        if small in model_lower:
            return True

    # Check for parameter size indicators (1b, 3b, 7b, 8b, etc.)
    for pattern in SMALL_SIZE_PATTERNS:
        if re.search(pattern, model_lower):
            # Extract the number
            match = re.search(r'([0-9.]+)b', model_lower)
            if match:
                size = float(match.group(1))
                # Models <= 14B are considered small
                if size <= 14:
                    return True

    # Default to False (assume it can handle complex prompts)
    return False


def get_prompt_mode(model_name: str = None) -> Literal["simple", "complex"]:
    """
    Determine which prompt complexity mode to use based on model capability.

    Args:
        model_name: Name of the LLM model. If None, checks environment variable.

    Returns:
        "simple" for small models, "complex" for large models

    Examples:
        >>> get_prompt_mode("qwen2.5-7b")
        'simple'
        >>> get_prompt_mode("gpt-4")
        'complex'
    """
    # Allow manual override via environment variable
    prompt_mode = os.getenv("PROMPT_MODE")
    if prompt_mode in ["simple", "complex"]:
        return prompt_mode

    # Auto-detect based on model
    if model_name and is_small_model(model_name):
        return "simple"

    return "complex"


def should_use_strict_json(model_name: str = None) -> bool:
    """
    Determine whether to use strict JSON schema validation.

    Small models often struggle with strict JSON schemas and work better
    with relaxed validation + repair.

    Args:
        model_name: Name of the LLM model

    Returns:
        False for small models (use relaxed validation)
        True for large models (use strict validation)
    """
    # Allow manual override
    strict_env = os.getenv("STRICT_JSON_VALIDATION")
    if strict_env is not None:
        return strict_env.lower() == "true"

    # Small models get relaxed validation
    if model_name and is_small_model(model_name):
        return False

    # Large models can handle strict validation
    return True


def get_max_retries(model_name: str = None) -> int:
    """
    Get the maximum number of retries for LLM calls.

    Small models are less reliable and benefit from more retries.

    Args:
        model_name: Name of the LLM model

    Returns:
        Number of retry attempts (3 for large models, 5 for small)
    """
    # Allow manual override
    max_retries_env = os.getenv("MAX_RETRIES")
    if max_retries_env:
        try:
            return int(max_retries_env)
        except ValueError:
            pass

    # Small models get more retries
    if model_name and is_small_model(model_name):
        return int(os.getenv("MAX_RETRIES_SMALL_MODEL", "5"))

    # Large models need fewer retries
    return int(os.getenv("MAX_RETRIES_LARGE_MODEL", "3"))


def get_chunk_size(model_name: str = None, total_slides: int = 10) -> int:
    """
    Get the optimal chunk size for processing presentations.

    Small models work better with smaller chunks (3-5 slides at a time).
    Large models can handle more slides in one go.

    Args:
        model_name: Name of the LLM model
        total_slides: Total number of slides in the presentation

    Returns:
        Number of slides to process per chunk
    """
    # Allow manual override
    chunk_size_env = os.getenv("PRESENTATION_CHUNK_SIZE")
    if chunk_size_env:
        try:
            return int(chunk_size_env)
        except ValueError:
            pass

    # Small models work better with smaller chunks
    if model_name and is_small_model(model_name):
        return min(3, total_slides)

    # Large models can handle larger chunks
    return min(10, total_slides)


def get_model_info(model_name: str) -> dict:
    """
    Get comprehensive information about a model's capabilities.

    Args:
        model_name: Name of the LLM model

    Returns:
        Dictionary with model capability information
    """
    is_small = is_small_model(model_name)

    return {
        "model_name": model_name,
        "is_small_model": is_small,
        "prompt_mode": get_prompt_mode(model_name),
        "strict_json": should_use_strict_json(model_name),
        "max_retries": get_max_retries(model_name),
        "chunk_size": get_chunk_size(model_name),
        "recommended_settings": {
            "temperature": 0.3 if is_small else 0.7,
            "top_p": 0.9,
            "max_tokens": 2048 if is_small else 4096
        }
    }
