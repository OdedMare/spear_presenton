"""
Custom exceptions for the application.

These exceptions provide clear error semantics and enable
proper error handling across all layers.
"""

from typing import Optional, Any, Dict


class PresentonException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


# Data Access Layer Exceptions
class NotFoundException(PresentonException):
    """Raised when a requested entity is not found in the database."""

    def __init__(self, entity_type: str, entity_id: Any):
        message = f"{entity_type} with ID {entity_id} not found"
        super().__init__(message, {"entity_type": entity_type, "entity_id": entity_id})


class DuplicateEntityException(PresentonException):
    """Raised when attempting to create an entity that already exists."""

    def __init__(self, entity_type: str, field: str, value: Any):
        message = f"{entity_type} with {field}={value} already exists"
        super().__init__(
            message, {"entity_type": entity_type, "field": field, "value": value}
        )


class DatabaseException(PresentonException):
    """Raised when a database operation fails."""

    def __init__(self, operation: str, original_error: Exception):
        message = f"Database operation '{operation}' failed: {str(original_error)}"
        super().__init__(
            message, {"operation": operation, "original_error": str(original_error)}
        )


# Business Logic Exceptions
class ValidationError(PresentonException):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: Optional[str] = None):
        details = {"field": field} if field else {}
        super().__init__(message, details)


class AuthenticationError(PresentonException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message)


class AuthorizationError(PresentonException):
    """Raised when user lacks permission for an operation."""

    def __init__(self, message: str = "Not authorized to perform this operation"):
        super().__init__(message)


class BusinessRuleViolation(PresentonException):
    """Raised when a business rule is violated."""

    def __init__(self, rule: str, message: str):
        super().__init__(message, {"rule": rule})


# Service Layer Exceptions
class LLMError(PresentonException):
    """Raised when LLM operation fails."""

    def __init__(self, provider: str, operation: str, original_error: Exception):
        message = f"LLM operation '{operation}' failed for provider '{provider}': {str(original_error)}"
        super().__init__(
            message,
            {
                "provider": provider,
                "operation": operation,
                "original_error": str(original_error),
            },
        )


class ImageGenerationError(PresentonException):
    """Raised when image generation fails."""

    def __init__(self, provider: str, original_error: Exception):
        message = f"Image generation failed for provider '{provider}': {str(original_error)}"
        super().__init__(
            message, {"provider": provider, "original_error": str(original_error)}
        )


class DocumentProcessingError(PresentonException):
    """Raised when document processing fails."""

    def __init__(self, file_path: str, original_error: Exception):
        message = f"Failed to process document '{file_path}': {str(original_error)}"
        super().__init__(
            message, {"file_path": file_path, "original_error": str(original_error)}
        )


class ExportError(PresentonException):
    """Raised when presentation export fails."""

    def __init__(self, format: str, original_error: Exception):
        message = f"Failed to export presentation to {format}: {str(original_error)}"
        super().__init__(
            message, {"format": format, "original_error": str(original_error)}
        )


class TemplateError(PresentonException):
    """Raised when template rendering fails."""

    def __init__(self, template_name: str, original_error: Exception):
        message = f"Template '{template_name}' rendering failed: {str(original_error)}"
        super().__init__(
            message,
            {"template_name": template_name, "original_error": str(original_error)},
        )


class TranslationError(PresentonException):
    """Raised when translation operation fails."""

    def __init__(self, source_lang: str, target_lang: str, original_error: Exception):
        message = f"Translation from {source_lang} to {target_lang} failed: {str(original_error)}"
        super().__init__(
            message,
            {
                "source_lang": source_lang,
                "target_lang": target_lang,
                "original_error": str(original_error),
            },
        )


# External Service Exceptions
class WebhookError(PresentonException):
    """Raised when webhook delivery fails."""

    def __init__(self, webhook_url: str, original_error: Exception):
        message = f"Failed to deliver webhook to {webhook_url}: {str(original_error)}"
        super().__init__(
            message, {"webhook_url": webhook_url, "original_error": str(original_error)}
        )


class ExternalServiceError(PresentonException):
    """Raised when external service call fails."""

    def __init__(self, service_name: str, operation: str, original_error: Exception):
        message = f"External service '{service_name}' operation '{operation}' failed: {str(original_error)}"
        super().__init__(
            message,
            {
                "service_name": service_name,
                "operation": operation,
                "original_error": str(original_error),
            },
        )


# Configuration Exceptions
class ConfigurationError(PresentonException):
    """Raised when configuration is invalid or missing."""

    def __init__(self, config_key: str, message: str):
        super().__init__(f"Configuration error for '{config_key}': {message}")
        self.details = {"config_key": config_key}
