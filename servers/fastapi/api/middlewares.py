import os
import time
import uuid

from fastapi import Request, HTTPException, Depends, Header
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from utils.get_env import get_can_change_keys_env
from utils.logger import clear_log_context, logger, log_api_request, set_log_context
from utils.user_config import update_env_with_user_config
from services.database import get_async_session
from services.auth_service import AuthService
from models.sql.user import User


class UserConfigEnvUpdateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if get_can_change_keys_env() != "false":
            update_env_with_user_config()
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log each request with duration and request id using the shared logger."""

    async def dispatch(self, request: Request, call_next):
        clear_log_context()
        start = time.perf_counter()
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        try:
            response: Response = await call_next(request)
            return response
        except Exception as exc:
            # Log the exception with context before letting FastAPI handle it
            duration_ms = (time.perf_counter() - start) * 1000
            logger.error(
                "Unhandled exception during request",
                exc_info=True,
                extra={
                    "extra_fields": {
                        "event_type": "api_request_error",
                        "http_method": request.method,
                        "http_path": request.url.path,
                        "request_id": request_id,
                        "duration_ms": duration_ms,
                    }
                },
            )
            raise exc
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            # Avoid duplicate logging if an exception was raised and handled upstream
            status_code = (
                response.status_code if "response" in locals() else 500
            )
            log_api_request(
                request.method,
                request.url.path,
                status_code,
                duration_ms,
                request_id=request_id,
                client_ip=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )


async def get_current_user(
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_async_session),
) -> User | None:
    """
    Dependency to get the current authenticated user.
    Returns None if authentication is disabled or no valid token provided.
    """
    # Check if authentication is required
    auth_required = os.getenv("REQUIRE_AUTH", "false").lower() == "true"

    if not auth_required:
        return None

    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]  # Remove "Bearer " prefix
    user = await AuthService.validate_session(token, session)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    set_log_context(user.id, user.username)
    return user


async def require_auth(
    user: User | None = Depends(get_current_user),
) -> User:
    """
    Dependency that requires authentication.
    Use this on routes that must be protected.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
