from datetime import datetime
from enum import Enum
from typing import Optional
import uuid
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel
from utils.datetime_utils import get_current_utc_datetime


class OutlineJobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class OutlineJobModel(SQLModel, table=True):
    """
    Tracks background outline generation jobs.
    Used for polling-based approach where the client starts a job and polls for status.
    """

    __tablename__ = "outline_jobs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    presentation_id: uuid.UUID = Field(index=True)

    # Job status
    status: str = Field(default=OutlineJobStatus.PENDING.value)
    message: Optional[str] = None

    # Progress tracking
    progress_current: int = Field(default=0)
    progress_total: int = Field(default=6)
    progress_percentage: int = Field(default=0)

    # Error info
    error: Optional[dict] = Field(sa_column=Column(JSON), default=None)

    # Result data (outlines when completed)
    result: Optional[dict] = Field(sa_column=Column(JSON), default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=get_current_utc_datetime)
    updated_at: datetime = Field(default_factory=get_current_utc_datetime)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def update_progress(self, current: int, total: int, message: Optional[str] = None):
        """Update job progress"""
        self.progress_current = current
        self.progress_total = total
        self.progress_percentage = int((current / total) * 100) if total > 0 else 0
        if message:
            self.message = message
        self.updated_at = get_current_utc_datetime()

    def mark_processing(self, message: str = "Processing..."):
        """Mark job as processing"""
        self.status = OutlineJobStatus.PROCESSING.value
        self.message = message
        self.started_at = get_current_utc_datetime()
        self.updated_at = get_current_utc_datetime()

    def mark_completed(self, result: dict, message: str = "Completed"):
        """Mark job as completed with result"""
        self.status = OutlineJobStatus.COMPLETED.value
        self.message = message
        self.result = result
        self.progress_percentage = 100
        self.completed_at = get_current_utc_datetime()
        self.updated_at = get_current_utc_datetime()

    def mark_failed(self, error_message: str, error_details: Optional[dict] = None):
        """Mark job as failed"""
        self.status = OutlineJobStatus.FAILED.value
        self.message = error_message
        self.error = error_details or {"message": error_message}
        self.completed_at = get_current_utc_datetime()
        self.updated_at = get_current_utc_datetime()
