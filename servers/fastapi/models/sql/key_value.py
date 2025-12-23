import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class KeyValueSqlModel(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    key: str = Field(index=True, unique=True)
    value: str = Field()
    expires_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
