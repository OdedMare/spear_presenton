"""
Presentation chunking for small models.

Small models work better with smaller chunks of slides (3-5 at a time)
instead of processing all slides at once.

This module provides utilities to:
- Split presentations into manageable chunks
- Process chunks sequentially or in parallel
- Merge results back together
"""

import logging
from typing import List, TypeVar, Generic, Optional
from utils.llm.model_capabilities import get_chunk_size, is_small_model

logger = logging.getLogger(__name__)

T = TypeVar('T')


class PresentationChunk(Generic[T]):
    """Represents a chunk of slides for processing."""

    def __init__(
        self,
        items: List[T],
        chunk_index: int,
        total_chunks: int,
        start_index: int,
        end_index: int
    ):
        self.items = items
        self.chunk_index = chunk_index
        self.total_chunks = total_chunks
        self.start_index = start_index
        self.end_index = end_index

    def __repr__(self):
        return (
            f"PresentationChunk(chunk={self.chunk_index + 1}/{self.total_chunks}, "
            f"slides={self.start_index}-{self.end_index}, "
            f"size={len(self.items)})"
        )


def should_use_chunking(
    n_slides: int,
    model: Optional[str] = None,
    force: bool = False
) -> bool:
    """
    Determine if chunking should be used for a presentation.

    Args:
        n_slides: Total number of slides
        model: Model name for capability detection
        force: Force chunking even for large models

    Returns:
        True if chunking should be used, False otherwise

    Examples:
        >>> should_use_chunking(5, "qwen2.5-7b")
        False  # 5 slides is small enough
        >>> should_use_chunking(15, "qwen2.5-7b")
        True  # 15 slides benefits from chunking
        >>> should_use_chunking(15, "gpt-4")
        False  # GPT-4 can handle 15 slides at once
    """
    if force:
        return True

    # Only use chunking for small models
    if not model or not is_small_model(model):
        return False

    # Get appropriate chunk size for model
    chunk_size = get_chunk_size(model, n_slides)

    # Only chunk if presentation has more slides than chunk size
    return n_slides > chunk_size


def chunk_items(
    items: List[T],
    chunk_size: Optional[int] = None,
    model: Optional[str] = None
) -> List[PresentationChunk[T]]:
    """
    Split a list of items into chunks.

    Args:
        items: List of items to chunk
        chunk_size: Override chunk size (if None, uses model-based size)
        model: Model name for adaptive chunk sizing

    Returns:
        List of PresentationChunk objects

    Examples:
        >>> slides = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        >>> chunks = chunk_items(slides, chunk_size=3)
        >>> len(chunks)
        4  # [1-3], [4-6], [7-9], [10]
    """
    if not items:
        return []

    # Determine chunk size
    if chunk_size is None:
        chunk_size = get_chunk_size(model, len(items))

    chunks = []
    total_items = len(items)

    for i in range(0, total_items, chunk_size):
        chunk_items_list = items[i:i + chunk_size]
        chunk_index = i // chunk_size
        total_chunks = (total_items + chunk_size - 1) // chunk_size

        chunk = PresentationChunk(
            items=chunk_items_list,
            chunk_index=chunk_index,
            total_chunks=total_chunks,
            start_index=i,
            end_index=min(i + chunk_size, total_items)
        )
        chunks.append(chunk)

    logger.info(
        f"Split {total_items} items into {len(chunks)} chunks "
        f"(size={chunk_size})"
    )

    return chunks


def merge_chunks(chunks: List[PresentationChunk[T]]) -> List[T]:
    """
    Merge chunks back into a single list.

    Args:
        chunks: List of PresentationChunk objects

    Returns:
        Merged list of items in original order

    Examples:
        >>> chunks = [chunk1, chunk2, chunk3]
        >>> merged = merge_chunks(chunks)
    """
    if not chunks:
        return []

    # Sort chunks by index to ensure correct order
    sorted_chunks = sorted(chunks, key=lambda c: c.chunk_index)

    # Merge items
    result = []
    for chunk in sorted_chunks:
        result.extend(chunk.items)

    logger.info(
        f"Merged {len(chunks)} chunks into {len(result)} items"
    )

    return result


class ChunkingStrategy:
    """Strategy for chunking presentations based on model capabilities."""

    def __init__(self, model: Optional[str] = None):
        self.model = model
        self.is_small = is_small_model(model) if model else False

    def get_chunk_size(self, total_slides: int) -> int:
        """Get appropriate chunk size for the model and presentation."""
        return get_chunk_size(self.model, total_slides)

    def should_chunk(self, total_slides: int) -> bool:
        """Determine if this presentation should be chunked."""
        return should_use_chunking(total_slides, self.model)

    def create_chunks(self, items: List[T]) -> List[PresentationChunk[T]]:
        """Create chunks with model-appropriate sizing."""
        if not self.should_chunk(len(items)):
            # Return single chunk with all items
            return [
                PresentationChunk(
                    items=items,
                    chunk_index=0,
                    total_chunks=1,
                    start_index=0,
                    end_index=len(items)
                )
            ]

        chunk_size = self.get_chunk_size(len(items))
        return chunk_items(items, chunk_size=chunk_size, model=self.model)

    def log_strategy(self, total_slides: int):
        """Log the chunking strategy being used."""
        if not self.should_chunk(total_slides):
            logger.info(
                f"Processing {total_slides} slides in single batch "
                f"(model: {self.model or 'unknown'})"
            )
        else:
            chunk_size = self.get_chunk_size(total_slides)
            num_chunks = (total_slides + chunk_size - 1) // chunk_size
            logger.info(
                f"Processing {total_slides} slides in {num_chunks} chunks "
                f"of {chunk_size} slides each (small model: {self.model})"
            )


def chunk_presentation_outline(
    outline_data: dict,
    model: Optional[str] = None
) -> List[PresentationChunk[dict]]:
    """
    Chunk a presentation outline for processing.

    Args:
        outline_data: Presentation outline with 'slides' key
        model: Model name for adaptive chunking

    Returns:
        List of chunks, each containing a subset of slides

    Example:
        >>> outline = {"slides": [slide1, slide2, ..., slide10]}
        >>> chunks = chunk_presentation_outline(outline, "qwen2.5-7b")
        >>> # Returns chunks of 3 slides each for small model
    """
    slides = outline_data.get('slides', [])

    strategy = ChunkingStrategy(model)
    strategy.log_strategy(len(slides))

    return strategy.create_chunks(slides)


def create_chunked_context(
    chunk: PresentationChunk[T],
    include_context: bool = True
) -> str:
    """
    Create context string for chunk processing.

    Helps the model understand this is part of a larger presentation.

    Args:
        chunk: The chunk being processed
        include_context: Include information about chunk position

    Returns:
        Context string to add to prompts

    Example:
        >>> chunk = PresentationChunk(items=[...], chunk_index=1, total_chunks=4, ...)
        >>> context = create_chunked_context(chunk)
        >>> # "Processing slides 4-6 of 12 (chunk 2 of 4)"
    """
    if not include_context or chunk.total_chunks == 1:
        return ""

    return (
        f"Processing slides {chunk.start_index + 1}-{chunk.end_index} "
        f"of {chunk.end_index + (chunk.total_chunks - chunk.chunk_index - 1) * len(chunk.items)} "
        f"(chunk {chunk.chunk_index + 1} of {chunk.total_chunks}). "
        f"Maintain consistency with previous slides."
    )


# Example usage for documentation
if __name__ == "__main__":
    # Example: Chunking a presentation
    slides = [f"Slide {i}" for i in range(1, 16)]  # 15 slides

    # For small model
    print("Small model (qwen2.5-7b):")
    strategy_small = ChunkingStrategy("qwen2.5-7b")
    chunks_small = strategy_small.create_chunks(slides)
    for chunk in chunks_small:
        print(f"  {chunk}")
        print(f"    Context: {create_chunked_context(chunk)}")

    print("\nLarge model (gpt-4):")
    strategy_large = ChunkingStrategy("gpt-4")
    chunks_large = strategy_large.create_chunks(slides)
    for chunk in chunks_large:
        print(f"  {chunk}")
