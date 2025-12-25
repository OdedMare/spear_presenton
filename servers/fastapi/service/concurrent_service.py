import asyncio
from typing import Any, Callable, List, TypeVar

T = TypeVar("T")

class ConcurrentService:
    """
    Service for running tasks concurrently.
    """
    async def run_concurrently(self, tasks: List[Callable[[], Any]]) -> List[Any]:
        """Run multiple async tasks concurrently and return results."""
        return await asyncio.gather(*[task() for task in tasks])

    async def run_in_thread(self, func: Callable, *args, **kwargs) -> Any:
        """Run a synchronous function in a separate thread to avoid blocking the event loop."""
        return await asyncio.to_thread(func, *args, **kwargs)

# Singleton instance
CONCURRENT_SERVICE = ConcurrentService()
