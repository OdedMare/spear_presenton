from __future__ import annotations

import inspect
from functools import wraps
from typing import Any, Awaitable, Callable, Optional, TypeVar, Union, overload

F = TypeVar("F", bound=Callable[..., Any])
AsyncF = TypeVar("AsyncF", bound=Callable[..., Awaitable[Any]])


def _warn(message: Optional[str], exc: BaseException, default: str) -> None:
    info = message or default
    print(f"{info}: {exc}")
    print("Warning: external dependency unavailable, continuing without it")


@overload
def safe_init(func: F) -> F: ...


@overload
def safe_init(*, message: Optional[str] = None) -> Callable[[F], F]: ...


def safe_init(func: Optional[Callable[..., Any]] = None, *, message: Optional[str] = None):
    """
    Decorator to guard initialization code so FastAPI startup never crashes.
    Works with both sync and async callables and prints a clear warning when skipped.
    """

    def decorator(inner_func: Callable[..., Any]):
        if inspect.iscoroutinefunction(inner_func):

            @wraps(inner_func)
            async def async_wrapper(*args: Any, **kwargs: Any):
                try:
                    return await inner_func(*args, **kwargs)
                except Exception as exc:  # pragma: no cover - defensive
                    _warn(message, exc, f"Initialization skipped for {inner_func.__name__}")
                    return None

            return async_wrapper  # type: ignore[return-value]

        @wraps(inner_func)
        def sync_wrapper(*args: Any, **kwargs: Any):
            try:
                return inner_func(*args, **kwargs)
            except Exception as exc:  # pragma: no cover - defensive
                _warn(message, exc, f"Initialization skipped for {inner_func.__name__}")
                return None

        return sync_wrapper  # type: ignore[return-value]

    if func is None:
        return decorator
    return decorator(func)
