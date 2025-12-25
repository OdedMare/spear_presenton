"""
Base Repository - Generic CRUD operations for all entities.

This implements the Repository Pattern with generic type support,
following the DRY principle and providing consistent data access methods.
"""

from typing import Generic, TypeVar, Optional, List, Type, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete, update as sql_update
from sqlmodel import SQLModel

# Generic type for SQLModel entities
T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """
    Generic repository providing CRUD operations for any SQLModel entity.

    This class follows:
    - Single Responsibility Principle: Only handles data access
    - Open/Closed Principle: Extendable via inheritance
    - Liskov Substitution: Subclasses can replace base implementation
    - Dependency Inversion: Depends on SQLModel abstraction

    Type Parameters:
        T: The SQLModel entity type this repository manages
    """

    def __init__(self, session: AsyncSession, model: Type[T]):
        """
        Initialize repository with database session and model type.

        Args:
            session: Async database session
            model: SQLModel class this repository manages
        """
        self.session = session
        self.model = model

    async def get_by_id(self, entity_id: Any) -> Optional[T]:
        """
        Retrieve entity by primary key ID.

        Args:
            entity_id: Primary key value (int, UUID, etc.)

        Returns:
            Entity if found, None otherwise
        """
        return await self.session.get(self.model, entity_id)

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        Retrieve all entities with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of entities
        """
        statement = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def create(self, entity: T) -> T:
        """
        Create a new entity.

        Args:
            entity: Entity instance to create

        Returns:
            Created entity with generated ID and defaults
        """
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        return entity

    async def create_many(self, entities: List[T]) -> List[T]:
        """
        Create multiple entities in a single transaction.

        Args:
            entities: List of entities to create

        Returns:
            List of created entities
        """
        self.session.add_all(entities)
        await self.session.commit()
        for entity in entities:
            await self.session.refresh(entity)
        return entities

    async def update(self, entity: T) -> T:
        """
        Update an existing entity.

        Args:
            entity: Entity instance with updated values

        Returns:
            Updated entity
        """
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity_id: Any) -> bool:
        """
        Delete entity by ID.

        Args:
            entity_id: Primary key value

        Returns:
            True if deleted, False if not found
        """
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False

        await self.session.delete(entity)
        await self.session.commit()
        return True

    async def delete_many(self, entity_ids: List[Any]) -> int:
        """
        Delete multiple entities by IDs.

        Args:
            entity_ids: List of primary key values

        Returns:
            Number of entities deleted
        """
        statement = sql_delete(self.model).where(self.model.id.in_(entity_ids))
        result = await self.session.execute(statement)
        await self.session.commit()
        return result.rowcount

    async def exists(self, entity_id: Any) -> bool:
        """
        Check if entity exists by ID.

        Args:
            entity_id: Primary key value

        Returns:
            True if exists, False otherwise
        """
        entity = await self.get_by_id(entity_id)
        return entity is not None

    async def count(self) -> int:
        """
        Count total number of entities.

        Returns:
            Total count
        """
        from sqlalchemy import func
        statement = select(func.count()).select_from(self.model)
        result = await self.session.execute(statement)
        return result.scalar_one()
