"""
Performance monitoring for LLM operations.

Tracks success rates, retry counts, latency, and other metrics
to understand how well small model adaptations are working.
"""

import time
import logging
from typing import Optional, Dict, List
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict
import json

logger = logging.getLogger(__name__)


@dataclass
class LLMOperationMetrics:
    """Metrics for a single LLM operation."""

    operation_id: str
    operation_type: str  # "outline", "structure", "content", etc.
    model_name: str
    is_small_model: bool

    start_time: float
    end_time: Optional[float] = None

    attempts: int = 1
    success: bool = False
    error_message: Optional[str] = None

    used_json_repair: bool = False
    used_fallback: bool = False
    complexity_level: int = 0

    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None

    def duration_ms(self) -> Optional[float]:
        """Get operation duration in milliseconds."""
        if self.end_time is None:
            return None
        return (self.end_time - self.start_time) * 1000

    def to_dict(self) -> dict:
        """Convert metrics to dictionary."""
        return {
            "operation_id": self.operation_id,
            "operation_type": self.operation_type,
            "model_name": self.model_name,
            "is_small_model": self.is_small_model,
            "start_time": datetime.fromtimestamp(self.start_time).isoformat(),
            "end_time": datetime.fromtimestamp(self.end_time).isoformat() if self.end_time else None,
            "duration_ms": self.duration_ms(),
            "attempts": self.attempts,
            "success": self.success,
            "error_message": self.error_message,
            "used_json_repair": self.used_json_repair,
            "used_fallback": self.used_fallback,
            "complexity_level": self.complexity_level,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
        }


@dataclass
class AggregatedMetrics:
    """Aggregated metrics for analysis."""

    model_name: str
    operation_type: str
    total_operations: int = 0
    successful_operations: int = 0
    failed_operations: int = 0
    total_attempts: int = 0
    total_duration_ms: float = 0.0
    json_repair_count: int = 0
    fallback_count: int = 0

    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_operations == 0:
            return 0.0
        return (self.successful_operations / self.total_operations) * 100

    def average_attempts(self) -> float:
        """Calculate average attempts per operation."""
        if self.total_operations == 0:
            return 0.0
        return self.total_attempts / self.total_operations

    def average_duration_ms(self) -> float:
        """Calculate average duration in milliseconds."""
        if self.total_operations == 0:
            return 0.0
        return self.total_duration_ms / self.total_operations

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "model_name": self.model_name,
            "operation_type": self.operation_type,
            "total_operations": self.total_operations,
            "successful_operations": self.successful_operations,
            "failed_operations": self.failed_operations,
            "success_rate": f"{self.success_rate():.2f}%",
            "average_attempts": f"{self.average_attempts():.2f}",
            "average_duration_ms": f"{self.average_duration_ms():.1f}",
            "json_repair_used": f"{self.json_repair_count}x",
            "fallback_used": f"{self.fallback_count}x",
        }


class PerformanceMonitor:
    """
    Monitor LLM operation performance and track metrics.

    Thread-safe singleton for collecting metrics across the application.
    """

    _instance = None
    _metrics: List[LLMOperationMetrics] = []
    _enabled: bool = True

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._metrics = []
            cls._enabled = True
        return cls._instance

    @classmethod
    def enable(cls):
        """Enable metrics collection."""
        cls._enabled = True
        logger.info("Performance monitoring enabled")

    @classmethod
    def disable(cls):
        """Disable metrics collection."""
        cls._enabled = False
        logger.info("Performance monitoring disabled")

    @classmethod
    def start_operation(
        cls,
        operation_id: str,
        operation_type: str,
        model_name: str,
        is_small_model: bool
    ) -> LLMOperationMetrics:
        """
        Start tracking a new operation.

        Args:
            operation_id: Unique ID for this operation
            operation_type: Type of operation (outline, structure, etc.)
            model_name: Name of the LLM model
            is_small_model: Whether this is a small model

        Returns:
            Metrics object to track this operation
        """
        if not cls._enabled:
            return None

        metrics = LLMOperationMetrics(
            operation_id=operation_id,
            operation_type=operation_type,
            model_name=model_name,
            is_small_model=is_small_model,
            start_time=time.time()
        )

        logger.debug(f"Started tracking operation: {operation_id} ({operation_type})")

        return metrics

    @classmethod
    def end_operation(
        cls,
        metrics: LLMOperationMetrics,
        success: bool,
        error_message: Optional[str] = None
    ):
        """
        Finish tracking an operation.

        Args:
            metrics: Metrics object from start_operation
            success: Whether operation succeeded
            error_message: Error message if failed
        """
        if not cls._enabled or metrics is None:
            return

        metrics.end_time = time.time()
        metrics.success = success
        metrics.error_message = error_message

        cls._metrics.append(metrics)

        duration = metrics.duration_ms()
        status = "SUCCESS" if success else "FAILED"

        logger.info(
            f"Operation {metrics.operation_id} {status}: "
            f"{metrics.operation_type} with {metrics.model_name} "
            f"(attempts: {metrics.attempts}, duration: {duration:.1f}ms)"
        )

        if not success:
            logger.warning(f"  Error: {error_message}")

    @classmethod
    def record_attempt(cls, metrics: Optional[LLMOperationMetrics]):
        """Record a retry attempt."""
        if metrics:
            metrics.attempts += 1

    @classmethod
    def record_json_repair(cls, metrics: Optional[LLMOperationMetrics]):
        """Record use of JSON repair."""
        if metrics:
            metrics.used_json_repair = True

    @classmethod
    def record_fallback(cls, metrics: Optional[LLMOperationMetrics]):
        """Record use of fallback strategy."""
        if metrics:
            metrics.used_fallback = True

    @classmethod
    def set_complexity_level(
        cls,
        metrics: Optional[LLMOperationMetrics],
        level: int
    ):
        """Set the prompt complexity level used."""
        if metrics:
            metrics.complexity_level = level

    @classmethod
    def get_all_metrics(cls) -> List[LLMOperationMetrics]:
        """Get all recorded metrics."""
        return cls._metrics.copy()

    @classmethod
    def get_aggregated_metrics(
        cls,
        model_name: Optional[str] = None,
        operation_type: Optional[str] = None
    ) -> Dict[str, AggregatedMetrics]:
        """
        Get aggregated metrics grouped by model and operation type.

        Args:
            model_name: Filter by model name (optional)
            operation_type: Filter by operation type (optional)

        Returns:
            Dictionary of aggregated metrics
        """
        aggregated = defaultdict(lambda: AggregatedMetrics("", ""))

        for metric in cls._metrics:
            # Apply filters
            if model_name and metric.model_name != model_name:
                continue
            if operation_type and metric.operation_type != operation_type:
                continue

            key = f"{metric.model_name}:{metric.operation_type}"

            agg = aggregated[key]
            agg.model_name = metric.model_name
            agg.operation_type = metric.operation_type
            agg.total_operations += 1
            agg.total_attempts += metric.attempts

            if metric.success:
                agg.successful_operations += 1
            else:
                agg.failed_operations += 1

            if metric.duration_ms():
                agg.total_duration_ms += metric.duration_ms()

            if metric.used_json_repair:
                agg.json_repair_count += 1

            if metric.used_fallback:
                agg.fallback_count += 1

        return dict(aggregated)

    @classmethod
    def print_summary(cls):
        """Print a summary of collected metrics."""
        print("\n" + "=" * 80)
        print("LLM Performance Summary")
        print("=" * 80)

        aggregated = cls.get_aggregated_metrics()

        if not aggregated:
            print("No metrics collected yet.")
            return

        for key, agg in sorted(aggregated.items()):
            print(f"\n{agg.model_name} - {agg.operation_type}:")
            print(f"  Total Operations: {agg.total_operations}")
            print(f"  Success Rate: {agg.success_rate():.2f}%")
            print(f"  Average Attempts: {agg.average_attempts():.2f}")
            print(f"  Average Duration: {agg.average_duration_ms():.1f}ms")
            print(f"  JSON Repair Used: {agg.json_repair_count}x")
            print(f"  Fallback Used: {agg.fallback_count}x")

    @classmethod
    def export_metrics(cls, filepath: str):
        """
        Export metrics to JSON file.

        Args:
            filepath: Path to export file
        """
        data = {
            "timestamp": datetime.now().isoformat(),
            "total_operations": len(cls._metrics),
            "metrics": [m.to_dict() for m in cls._metrics],
            "aggregated": {
                key: agg.to_dict()
                for key, agg in cls.get_aggregated_metrics().items()
            }
        }

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        logger.info(f"Exported {len(cls._metrics)} metrics to {filepath}")

    @classmethod
    def clear(cls):
        """Clear all collected metrics."""
        count = len(cls._metrics)
        cls._metrics.clear()
        logger.info(f"Cleared {count} metrics")


# Convenience functions
def start_tracking(
    operation_id: str,
    operation_type: str,
    model_name: str,
    is_small_model: bool
) -> Optional[LLMOperationMetrics]:
    """Start tracking an operation (convenience function)."""
    return PerformanceMonitor.start_operation(
        operation_id,
        operation_type,
        model_name,
        is_small_model
    )


def end_tracking(
    metrics: Optional[LLMOperationMetrics],
    success: bool,
    error: Optional[str] = None
):
    """End tracking an operation (convenience function)."""
    PerformanceMonitor.end_operation(metrics, success, error)


# Example usage
if __name__ == "__main__":
    import uuid

    # Enable monitoring
    PerformanceMonitor.enable()

    # Simulate some operations
    for i in range(10):
        is_small = i % 2 == 0
        model = "qwen2.5-7b" if is_small else "gpt-4"

        metrics = start_tracking(
            operation_id=str(uuid.uuid4()),
            operation_type="outline",
            model_name=model,
            is_small_model=is_small
        )

        # Simulate work
        time.sleep(0.1)

        # Simulate retries for small models
        if is_small and i % 3 == 0:
            PerformanceMonitor.record_attempt(metrics)
            PerformanceMonitor.record_json_repair(metrics)

        # Simulate success/failure
        success = i % 4 != 0

        end_tracking(
            metrics,
            success=success,
            error="Test error" if not success else None
        )

    # Print summary
    PerformanceMonitor.print_summary()
