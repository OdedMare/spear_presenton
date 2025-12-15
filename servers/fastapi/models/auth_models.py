from datetime import datetime
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Request model for user login."""
    username: str = Field(..., min_length=2, max_length=100, description="Username for authentication")


class LoginResponse(BaseModel):
    """Response model for successful login."""
    user_id: int
    username: str
    session_token: str
    created_at: datetime
    last_login: datetime


class ValidateSessionResponse(BaseModel):
    """Response model for session validation."""
    valid: bool
    user_id: int | None = None
    username: str | None = None


class LogoutResponse(BaseModel):
    """Response model for logout."""
    success: bool
    message: str
