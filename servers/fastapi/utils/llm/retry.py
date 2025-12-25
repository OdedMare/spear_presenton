"""
Retry logic with exponential backoff for LLM calls.

Small models are less reliable and benefit from:
- More retry attempts
- Longer delays between retries
- Progressive prompt simplification
"""

import asyncio
import logging
from typing import TypeVar, Callable, Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


class LLMRetryError(Exception):
    """Raised when all retry attempts are exhausted."""
    def __init__(self, message: str, last_error: Exception):
        super().__init__(message)
        self.last_error = last_error


async def retry_with_backoff(
    func: Callable[..., T],
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    is_small_model: bool = False,
    on_retry: Optional[Callable[[int, Exception], None]] = None
) -> T:
    """
    Retry an async function with exponential backoff.

    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        backoff_factor: Multiplier for delay after each retry
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay between retries
        is_small_model: If True, use more retries and longer delays
        on_retry: Optional callback function called on each retry

    Returns:
        Result from successful function call

    Raises:
        LLMRetryError: If all retry attempts fail

    Example:
        >>> async def call_llm():
        ...     return await client.generate(prompt)
        >>> result = await retry_with_backoff(call_llm, max_retries=5)
    """
    # Adjust retry parameters for small models
    if is_small_model:
        max_retries = max(max_retries, 5)
        backoff_factor = max(backoff_factor, 2.5)

    last_exception = None
    delay = initial_delay

    for attempt in range(max_retries):
        try:
            logger.debug(f"Attempt {attempt + 1}/{max_retries}")
            result = await func()

            if attempt > 0:
                logger.info(f"Success after {attempt + 1} attempts")

            return result

        except Exception as e:
            last_exception = e
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {str(e)}")

            # Call retry callback if provided
            if on_retry:
                try:
                    on_retry(attempt + 1, e)
                except Exception as callback_error:
                    logger.error(f"Retry callback failed: {callback_error}")

            # Don't delay after the last attempt
            if attempt < max_retries - 1:
                # Calculate delay with exponential backoff
                current_delay = min(delay * (backoff_factor ** attempt), max_delay)
                logger.debug(f"Waiting {current_delay:.2f}s before retry...")
                await asyncio.sleep(current_delay)

    # All retries exhausted
    error_msg = f"All {max_retries} retry attempts failed. Last error: {str(last_exception)}"
    logger.error(error_msg)
    raise LLMRetryError(error_msg, last_exception)


def retry_async(
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    is_small_model: bool = False
):
    """
    Decorator for adding retry logic to async functions.

    Args:
        max_retries: Maximum number of retry attempts
        backoff_factor: Multiplier for delay after each retry
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay between retries
        is_small_model: If True, use more retries

    Example:
        >>> @retry_async(max_retries=5, is_small_model=True)
        >>> async def generate_outline(prompt):
        ...     return await llm_client.generate(prompt)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            async def call_func():
                return await func(*args, **kwargs)

            return await retry_with_backoff(
                call_func,
                max_retries=max_retries,
                backoff_factor=backoff_factor,
                initial_delay=initial_delay,
                max_delay=max_delay,
                is_small_model=is_small_model
            )

        return wrapper
    return decorator


class RetryableError(Exception):
    """Base class for errors that should trigger a retry."""
    pass


class NonRetryableError(Exception):
    """Base class for errors that should NOT trigger a retry."""
    pass


async def retry_with_fallback(
    primary_func: Callable[..., T],
    fallback_func: Optional[Callable[..., T]] = None,
    max_retries: int = 3,
    is_small_model: bool = False
) -> T:
    """
    Retry primary function, then fall back to alternative if all attempts fail.

    Args:
        primary_func: Main async function to try
        fallback_func: Alternative function to try if primary fails
        max_retries: Maximum retry attempts for primary function
        is_small_model: Adjust retry strategy for small models

    Returns:
        Result from successful function call

    Raises:
        Exception: If both primary and fallback fail

    Example:
        >>> async def try_strict_json():
        ...     return await client.generate(strict=True)
        >>> async def try_relaxed_json():
        ...     return await client.generate(strict=False)
        >>> result = await retry_with_fallback(try_strict_json, try_relaxed_json)
    """
    try:
        return await retry_with_backoff(
            primary_func,
            max_retries=max_retries,
            is_small_model=is_small_model
        )
    except LLMRetryError as e:
        logger.warning(f"Primary function failed after retries: {e}")

        if fallback_func:
            logger.info("Attempting fallback function...")
            try:
                return await retry_with_backoff(
                    fallback_func,
                    max_retries=max(2, max_retries // 2),  # Fewer retries for fallback
                    is_small_model=is_small_model
                )
            except LLMRetryError as fallback_error:
                logger.error(f"Fallback function also failed: {fallback_error}")
                raise Exception(
                    f"Both primary and fallback failed. "
                    f"Primary: {str(e.last_error)}, "
                    f"Fallback: {str(fallback_error.last_error)}"
                )
        else:
            raise


async def retry_with_progressive_simplification(
    func: Callable[[int], T],
    max_retries: int = 5,
    is_small_model: bool = True
) -> T:
    """
    Retry with progressively simpler prompts on each attempt.

    The provided function should accept an attempt number parameter
    and simplify its behavior accordingly.

    Args:
        func: Async function that accepts attempt number (0-indexed)
        max_retries: Maximum retry attempts
        is_small_model: Enable small model optimizations

    Returns:
        Result from successful function call

    Example:
        >>> async def generate_with_complexity(attempt: int):
        ...     complexity = "complex" if attempt == 0 else "simple"
        ...     return await client.generate(prompt, mode=complexity)
        >>> result = await retry_with_progressive_simplification(generate_with_complexity)
    """
    last_exception = None
    delay = 1.0

    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries} (complexity level: {attempt})")
            return await func(attempt)

        except Exception as e:
            last_exception = e
            logger.warning(
                f"Attempt {attempt + 1} failed: {str(e)}. "
                f"Next attempt will use simpler approach."
            )

            if attempt < max_retries - 1:
                current_delay = delay * (2.0 ** attempt)
                await asyncio.sleep(min(current_delay, 60.0))

    error_msg = f"All {max_retries} attempts failed with progressive simplification"
    logger.error(error_msg)
    raise LLMRetryError(error_msg, last_exception)


def should_retry_error(error: Exception) -> bool:
    """
    Determine if an error should trigger a retry.

    Args:
        error: Exception that was raised

    Returns:
        True if error is retryable, False otherwise
    """
    # Don't retry explicit non-retryable errors
    if isinstance(error, NonRetryableError):
        return False

    # Retry explicit retryable errors
    if isinstance(error, RetryableError):
        return True

    # Retry timeout and connection errors
    error_str = str(error).lower()
    retryable_patterns = [
        'timeout',
        'connection',
        'rate limit',
        'too many requests',
        'service unavailable',
        '429',
        '500',
        '502',
        '503',
        '504'
    ]

    return any(pattern in error_str for pattern in retryable_patterns)


async def smart_retry(
    func: Callable[..., T],
    max_retries: int = 3,
    is_small_model: bool = False
) -> T:
    """
    Retry only on specific error types.

    Args:
        func: Async function to retry
        max_retries: Maximum retry attempts
        is_small_model: Adjust strategy for small models

    Returns:
        Result from successful function call

    Raises:
        Exception: Original exception if non-retryable
        LLMRetryError: If retryable error persists after all attempts
    """
    last_exception = None
    attempts = 0

    while attempts < max_retries:
        try:
            return await func()
        except Exception as e:
            last_exception = e

            # Check if error is retryable
            if not should_retry_error(e):
                logger.info(f"Non-retryable error encountered: {e}")
                raise

            attempts += 1
            if attempts < max_retries:
                delay = 1.0 * (2.0 ** (attempts - 1))
                logger.warning(
                    f"Retryable error on attempt {attempts}: {e}. "
                    f"Retrying in {delay:.2f}s..."
                )
                await asyncio.sleep(min(delay, 60.0))

    raise LLMRetryError(
        f"Retryable error persisted after {max_retries} attempts",
        last_exception
    )
