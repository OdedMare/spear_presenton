"""
Authentication endpoints for username-only authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from models.auth_models import (
    LoginRequest,
    LoginResponse,
    ValidateSessionResponse,
    LogoutResponse,
)
from services.auth_service import AuthService
from services.database import get_async_session
from utils.logger import logger

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Login or create a user with the given username.
    Returns a session token for authentication.
    """
    try:
        user, session_token = await AuthService.login(request.username, session)

        logger.info(
            f"User logged in: {user.username}",
            extra={
                "extra_fields": {
                    "event_type": "user_login",
                    "user_id": user.id,
                    "username": user.username,
                }
            },
        )

        return LoginResponse(
            user_id=user.id,
            username=user.username,
            session_token=session_token,
            created_at=user.created_at,
            last_login=user.last_login or user.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/validate", response_model=ValidateSessionResponse)
async def validate_session(
    authorization: str = Header(..., description="Bearer token"),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Validate a session token.
    Expects Authorization header with format: Bearer <token>
    """
    try:
        # Extract token from "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = authorization[7:]  # Remove "Bearer " prefix

        user = await AuthService.validate_session(token, session)

        if user:
            return ValidateSessionResponse(
                valid=True, user_id=user.id, username=user.username
            )
        else:
            return ValidateSessionResponse(valid=False)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session validation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    authorization: str = Header(..., description="Bearer token"),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Logout by invalidating the session token.
    Expects Authorization header with format: Bearer <token>
    """
    try:
        # Extract token from "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = authorization[7:]  # Remove "Bearer " prefix

        success = await AuthService.logout(token, session)

        if success:
            logger.info(
                "User logged out",
                extra={
                    "extra_fields": {
                        "event_type": "user_logout",
                    }
                },
            )
            return LogoutResponse(success=True, message="Logged out successfully")
        else:
            return LogoutResponse(success=False, message="Session not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
