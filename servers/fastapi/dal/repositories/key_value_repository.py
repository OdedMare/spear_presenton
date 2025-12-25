"""
Key-Value Repository - Data access for key-value storage.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete

from dal.repositories.base_repository import BaseRepository
from models.sql.key_value import KeyValueSqlModel
from common.exceptions import NotFoundException


class KeyValueRepository(BaseRepository[KeyValueSqlModel]):
    """Repository for key-value storage."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, KeyValueSqlModel)

    async def get_by_key(self, key: str) -> Optional[str]:
        """
        Get value by key. Returns None if not found or expired.
        """
        statement = select(KeyValueSqlModel).where(KeyValueSqlModel.key == key)
        result = await self.session.execute(statement)
        kv = result.scalar_one_or_none()

        if not kv:
            return None

        # Check expiration
        if kv.expires_at and kv.expires_at < datetime.utcnow():
            await self.delete_by_key(key)
            return None

        return kv.value

    async def set_value(
        self, key: str, value: str, expires_at: Optional[datetime] = None
    ) -> KeyValueSqlModel:
        """
        Set or update a key-value pair.
        """
        # Check if key exists
        statement = select(KeyValueSqlModel).where(KeyValueSqlModel.key == key)
        result = await self.session.execute(statement)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing
            existing.value = value
            existing.expires_at = expires_at
            existing.created_at = datetime.utcnow()
            return await self.update(existing)
        else:
            # Create new
            kv = KeyValueSqlModel(key=key, value=value, expires_at=expires_at)
            return await self.create(kv)

    async def delete_by_key(self, key: str) -> bool:
        """Delete key-value pair by key."""
        statement = sql_delete(KeyValueSqlModel).where(KeyValueSqlModel.key == key)
        result = await self.session.execute(statement)
        await self.session.commit()
        return result.rowcount > 0

    async def delete_expired(self) -> int:
        """Delete all expired keys."""
        statement = sql_delete(KeyValueSqlModel).where(
            KeyValueSqlModel.expires_at < datetime.utcnow()
        )
        result = await self.session.execute(statement)
        await self.session.commit()
        return result.rowcount
