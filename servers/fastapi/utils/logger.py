"""
Logger utility for sending logs to Elasticsearch in production environments.

Usage:
    from utils.logger import logger

    logger.info("Application started")
    logger.error("An error occurred", extra={"user_id": 123})
"""

import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional
import json


class ElasticsearchHandler(logging.Handler):
    """Custom logging handler that sends logs to Elasticsearch."""

    def __init__(self, elasticsearch_url: str, index_prefix: str = "presenton-logs"):
        super().__init__()
        self.elasticsearch_url = elasticsearch_url
        self.index_prefix = index_prefix
        self.session = None
        self.connection_failed = False  # Track if connection has failed
        self.error_logged = False  # Only log connection error once
        self._init_session()

    def _init_session(self):
        """Initialize HTTP session for Elasticsearch."""
        try:
            import requests
            self.session = requests.Session()

            # Disable SSL verification if needed (for self-signed certs)
            if os.getenv("DISABLE_SSL_VERIFY", "false").lower() == "true":
                self.session.verify = False
                import urllib3
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

            # Set auth if provided
            es_user = os.getenv("ELASTICSEARCH_USER")
            es_password = os.getenv("ELASTICSEARCH_PASSWORD")
            if es_user and es_password:
                self.session.auth = (es_user, es_password)

        except ImportError:
            print("Warning: requests library not available, Elasticsearch logging disabled")
            self.session = None

    def emit(self, record: logging.LogRecord):
        """Send log record to Elasticsearch."""
        # Skip if session not initialized or connection already failed
        if not self.session or self.connection_failed:
            return

        try:
            # Create index name with current date (for daily rotation)
            index_name = f"{self.index_prefix}-{datetime.utcnow().strftime('%Y.%m.%d')}"

            # Build log document
            log_doc = {
                "@timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
                "process_id": record.process,
                "thread_id": record.thread,
                "environment": os.getenv("ENVIRONMENT", "production"),
                "service": "presenton",
            }

            # Add exception info if present
            if record.exc_info:
                log_doc["exception"] = self.format(record)

            # Add any extra fields passed via extra={'extra_fields': {...}}
            if hasattr(record, "extra_fields") and isinstance(record.extra_fields, dict):
                log_doc.update(record.extra_fields)

            # Send to Elasticsearch
            url = f"{self.elasticsearch_url}/{index_name}/_doc"
            response = self.session.post(
                url,
                json=log_doc,
                headers={"Content-Type": "application/json"},
                timeout=2  # Reduced timeout to fail faster
            )
            response.raise_for_status()

        except Exception as e:
            # Don't let logging errors crash the application
            error_msg = str(e)

            # Mark connection as failed to stop trying
            if "Connection" in error_msg or "refused" in error_msg.lower() or "timeout" in error_msg.lower():
                self.connection_failed = True

                # Only log the error once to avoid spam
                if not self.error_logged:
                    self.error_logged = True
                    print(
                        f"⚠️  Elasticsearch logging disabled - Connection failed: {self.elasticsearch_url}",
                        file=sys.stderr
                    )
                    print(
                        "   Logs will only be written to console. Set ELASTICSEARCH_URL to enable remote logging.",
                        file=sys.stderr
                    )
            else:
                # Log other non-connection errors (but don't spam)
                if not self.error_logged:
                    print(f"Elasticsearch logging error: {error_msg}", file=sys.stderr)


class CustomLogger(logging.Logger):
    """Custom logger that adds extra fields to log records."""

    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False, stacklevel=1, **kwargs):
        """Override _log to handle extra fields."""
        if extra:
            # Store extra fields in the record
            if "extra_fields" not in extra:
                extra["extra_fields"] = {}
            if kwargs:
                extra["extra_fields"].update(kwargs)
        super()._log(level, msg, args, exc_info, extra, stack_info, stacklevel + 1)


def setup_logger(name: str = "presenton") -> logging.Logger:
    """
    Set up logger with console and Elasticsearch handlers.

    Environment Variables:
        ELASTICSEARCH_URL: Elasticsearch endpoint (e.g., http://elasticsearch:9200)
        ELASTICSEARCH_USER: Elasticsearch username (optional)
        ELASTICSEARCH_PASSWORD: Elasticsearch password (optional)
        LOG_LEVEL: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        DISABLE_SSL_VERIFY: Set to "true" to disable SSL verification

    Args:
        name: Logger name

    Returns:
        Configured logger instance
    """
    # Create custom logger
    logging.setLoggerClass(CustomLogger)
    logger = logging.getLogger(name)

    # Set log level from environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, log_level, logging.INFO))

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    # Console handler (always enabled)
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Elasticsearch handler (only if URL is configured AND not explicitly disabled)
    elasticsearch_url = os.getenv("ELASTICSEARCH_URL")
    disable_elasticsearch = os.getenv("DISABLE_ELASTICSEARCH_LOGGING", "false").lower() == "true"

    if elasticsearch_url and not disable_elasticsearch and elasticsearch_url.strip():
        try:
            es_handler = ElasticsearchHandler(
                elasticsearch_url=elasticsearch_url,
                index_prefix=os.getenv("ELASTICSEARCH_INDEX_PREFIX", "presenton-logs")
            )
            es_handler.setLevel(logging.INFO)  # Only send INFO and above to ES
            logger.addHandler(es_handler)

            # Test connection (non-blocking) - only if explicitly requested
            skip_health_check = os.getenv("SKIP_ELASTICSEARCH_HEALTH_CHECK", "false").lower() == "true"

            if not skip_health_check:
                try:
                    if es_handler.session:
                        test_response = es_handler.session.get(
                            f"{elasticsearch_url}/_cluster/health",
                            timeout=2
                        )
                        if test_response.status_code == 200:
                            logger.info(
                                "✅ Elasticsearch logging enabled",
                                extra={"extra_fields": {"elasticsearch_url": elasticsearch_url}}
                            )
                        else:
                            es_handler.connection_failed = True
                            print(
                                f"⚠️  Elasticsearch health check failed (status {test_response.status_code}). "
                                f"Logging to console only.",
                                file=sys.stderr
                            )
                except Exception as test_error:
                    # Connection test failed, disable ES logging silently
                    es_handler.connection_failed = True
                    print(
                        f"⚠️  Elasticsearch not available: {elasticsearch_url}. Logging to console only.",
                        file=sys.stderr
                    )
            else:
                # Health check skipped, assume Elasticsearch is available
                print(f"ℹ️  Elasticsearch health check skipped. Logging to {elasticsearch_url}", file=sys.stderr)

        except Exception as e:
            logger.warning(f"Failed to initialize Elasticsearch handler: {e}")
    elif elasticsearch_url and disable_elasticsearch:
        print("ℹ️  Elasticsearch logging is disabled via DISABLE_ELASTICSEARCH_LOGGING", file=sys.stderr)

    return logger


# Global logger instance
logger = setup_logger()


def reinitialize_logger():
    """
    Reinitialize the logger with updated configuration from environment variables.
    This is useful when Elasticsearch settings are changed at runtime.

    Returns:
        bool: True if reinitialization was successful
    """
    global logger

    try:
        # Remove all existing handlers
        for handler in logger.handlers[:]:
            handler.close()
            logger.removeHandler(handler)

        # Recreate logger with new configuration
        logger = setup_logger()

        logger.info("Logger reinitialized with updated configuration")
        return True
    except Exception as e:
        print(f"Failed to reinitialize logger: {e}", file=sys.stderr)
        return False


# Convenience functions for structured logging
def log_api_request(method: str, path: str, status_code: int, duration_ms: float, user_id: Optional[int] = None, username: Optional[str] = None, **kwargs):
    """Log API request with structured data."""
    extra_fields = {
        "event_type": "api_request",
        "http_method": method,
        "http_path": path,
        "http_status": status_code,
        "duration_ms": duration_ms,
        **kwargs
    }

    # Add user context if provided
    if user_id:
        extra_fields["user_id"] = user_id
    if username:
        extra_fields["username"] = username

    logger.info(
        f"{method} {path} - {status_code} ({duration_ms:.2f}ms)",
        extra={
            "extra_fields": extra_fields
        }
    )


def log_presentation_generation(presentation_id: str, status: str, duration_s: Optional[float] = None, **kwargs):
    """Log presentation generation event."""
    msg = f"Presentation {presentation_id} - {status}"
    if duration_s:
        msg += f" ({duration_s:.2f}s)"

    logger.info(
        msg,
        extra={
            "extra_fields": {
                "event_type": "presentation_generation",
                "presentation_id": presentation_id,
                "status": status,
                "duration_s": duration_s,
                **kwargs
            }
        }
    )


def log_error(error: Exception, context: str, **kwargs):
    """Log error with context and stack trace."""
    logger.error(
        f"{context}: {str(error)}",
        exc_info=True,
        extra={
            "extra_fields": {
                "event_type": "error",
                "error_type": type(error).__name__,
                "context": context,
                **kwargs
            }
        }
    )
