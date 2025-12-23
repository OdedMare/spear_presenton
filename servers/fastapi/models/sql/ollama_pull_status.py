from datetime import datetime
import uuid
from sqlmodel import Field, Column, JSON, SQLModel, DateTime
from utils.datetime_utils import get_current_utc_datetime


class OllamaPullStatus(SQLModel, table=True):
    id: str = Field(primary_key=True)
    last_updated: datetime = Field(
        sa_column=Column(DateTime(timezone=True), default=get_current_utc_datetime)
    )
    status: dict = Field(sa_column=Column(JSON))
