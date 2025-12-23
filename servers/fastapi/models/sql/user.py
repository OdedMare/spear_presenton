from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from utils.datetime_utils import get_current_utc_datetime


class User(SQLModel, table=True):
    """User model for username-only authentication."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=100)
    created_at: datetime = Field(default_factory=get_current_utc_datetime)
    last_login: Optional[datetime] = Field(default=None)

    class Config:
        from_attributes = True
