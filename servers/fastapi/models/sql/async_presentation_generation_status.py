from datetime import datetime
import secrets
from typing import Optional
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel
from utils.datetime_utils import get_current_utc_datetime


class AsyncPresentationGenerationTaskModel(SQLModel, table=True):

    __tablename__ = "async_presentation_generation_tasks"

    id: str = Field(
        default_factory=lambda: f"task-{secrets.token_hex(32)}", primary_key=True
    )
    status: str
    message: Optional[str] = None
    error: Optional[dict] = Field(sa_column=Column(JSON), default=None)
    created_at: datetime = Field(default_factory=get_current_utc_datetime)
    updated_at: datetime = Field(default_factory=get_current_utc_datetime)
    data: Optional[dict] = Field(sa_column=Column(JSON), default=None)
