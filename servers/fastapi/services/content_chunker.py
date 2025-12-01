"""
Smart Content Chunker for Large Presentations

This service intelligently chunks large presentation content to stay within
model token limits while processing content rewrites.

Features:
- Estimates token count before sending to LLM
- Splits presentations into optimal batches
- Processes batches sequentially to save tokens
- Combines results back together
"""

import json
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


def estimate_tokens(text: str) -> int:
    """
    Estimate token count for text.
    
    Uses a simple heuristic: ~4 characters per token on average.
    This is conservative and works well for most languages.
    
    Args:
        text: Text to estimate tokens for
        
    Returns:
        Estimated token count
    """
    return len(text) // 4


def estimate_structure_tokens(structure: Dict[str, Any]) -> int:
    """
    Estimate total tokens for a placeholder structure.
    
    Args:
        structure: Placeholder structure dict
        
    Returns:
        Estimated token count
    """
    # Convert to JSON string and estimate
    json_str = json.dumps(structure, ensure_ascii=False)
    return estimate_tokens(json_str)


def chunk_placeholder_structure(
    placeholder_structure: Dict[str, Any],
    system_prompt: str,
    user_prompt: str,
    max_input_tokens: int = 8000,  # Conservative limit (leaving room for output)
    overhead_tokens: int = 500  # Reserve for formatting, instructions, etc.
) -> List[Dict[str, Any]]:
    """
    Split a large placeholder structure into smaller chunks that fit within token limits.
    
    Strategy:
    1. Estimate tokens for system prompt + user prompt base
    2. Calculate available tokens for placeholder data
    3. Group slides into batches that fit within limit
    4. Return list of chunked structures
    
    Args:
        placeholder_structure: Full placeholder structure with all slides
        system_prompt: System prompt text
        user_prompt: User prompt template (without placeholder data)
        max_input_tokens: Maximum input tokens allowed
        overhead_tokens: Reserved tokens for formatting
        
    Returns:
        List of chunked placeholder structures, each within token limit
    """
    slides = placeholder_structure.get("slides", [])
    
    if not slides:
        return [placeholder_structure]
    
    # Estimate base prompt tokens
    base_tokens = estimate_tokens(system_prompt) + estimate_tokens(user_prompt) + overhead_tokens
    available_tokens = max_input_tokens - base_tokens
    
    logger.info(f"Base prompt tokens: ~{base_tokens}, Available for content: ~{available_tokens}")
    
    # Estimate tokens per slide
    slide_tokens = []
    for slide in slides:
        slide_json = json.dumps({"slides": [slide]}, ensure_ascii=False)
        tokens = estimate_tokens(slide_json)
        slide_tokens.append(tokens)
        logger.debug(f"Slide {slide.get('slideNumber')}: ~{tokens} tokens")
    
    # Check if we need to chunk at all
    total_tokens = sum(slide_tokens)
    if total_tokens <= available_tokens:
        logger.info(f"No chunking needed. Total tokens: ~{total_tokens} (limit: {available_tokens})")
        return [placeholder_structure]
    
    # Group slides into batches
    chunks = []
    current_batch = []
    current_batch_tokens = 0
    
    for i, (slide, tokens) in enumerate(zip(slides, slide_tokens)):
        # Check if single slide exceeds limit
        if tokens > available_tokens:
            logger.warning(
                f"Slide {slide.get('slideNumber')} alone has ~{tokens} tokens, "
                f"exceeds limit of {available_tokens}. Will process individually and may fail."
            )
            # Process this slide alone
            if current_batch:
                chunks.append({"slides": current_batch})
                current_batch = []
                current_batch_tokens = 0
            chunks.append({"slides": [slide]})
            continue
        
        # Check if adding this slide would exceed limit
        if current_batch_tokens + tokens > available_tokens:
            # Save current batch and start new one
            chunks.append({"slides": current_batch})
            logger.info(f"Created batch with {len(current_batch)} slides (~{current_batch_tokens} tokens)")
            current_batch = [slide]
            current_batch_tokens = tokens
        else:
            # Add to current batch
            current_batch.append(slide)
            current_batch_tokens += tokens
    
    # Add remaining batch
    if current_batch:
        chunks.append({"slides": current_batch})
        logger.info(f"Created final batch with {len(current_batch)} slides (~{current_batch_tokens} tokens)")
    
    logger.info(
        f"Split {len(slides)} slides into {len(chunks)} batches "
        f"(original: ~{total_tokens} tokens, limit: {available_tokens})"
    )
    
    return chunks


def combine_chunked_results(chunked_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Combine multiple chunked rewrite results back into a single structure.
    
    Args:
        chunked_results: List of rewritten content chunks
        
    Returns:
        Combined placeholder structure
    """
    if not chunked_results:
        return {"slides": []}
    
    if len(chunked_results) == 1:
        return chunked_results[0]
    
    # Combine all slides from all chunks
    combined_slides = []
    for chunk in chunked_results:
        slides = chunk.get("slides", [])
        combined_slides.extend(slides)
    
    # Sort by slide number to maintain order
    combined_slides.sort(key=lambda s: s.get("slideNumber", 0))
    
    logger.info(f"Combined {len(chunked_results)} chunks into {len(combined_slides)} slides")
    
    return {"slides": combined_slides}


def get_optimal_batch_size(
    total_slides: int,
    avg_tokens_per_slide: int,
    max_input_tokens: int = 8000,
    base_tokens: int = 2000
) -> int:
    """
    Calculate optimal batch size for processing slides.
    
    Args:
        total_slides: Total number of slides
        avg_tokens_per_slide: Average tokens per slide
        max_input_tokens: Maximum input tokens allowed
        base_tokens: Base tokens for prompts
        
    Returns:
        Optimal number of slides per batch
    """
    available_tokens = max_input_tokens - base_tokens
    batch_size = max(1, available_tokens // avg_tokens_per_slide)
    
    logger.info(
        f"Optimal batch size: {batch_size} slides "
        f"(avg {avg_tokens_per_slide} tokens/slide, {available_tokens} available)"
    )
    
    return batch_size
