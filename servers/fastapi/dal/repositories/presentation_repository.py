"""
Presentation Repository - Data access for presentations.

Implements the Repository Pattern for presentation entities,
providing specialized queries beyond basic CRUD operations.
"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from dal.repositories.base_repository import BaseRepository
from models.sql.presentation import PresentationModel
from common.exceptions import NotFoundException


class PresentationRepository(BaseRepository[PresentationModel]):
    """
    Repository for presentation data access.

    Provides presentation-specific queries while inheriting
    generic CRUD operations from BaseRepository.
    """

    def __init__(self, session: AsyncSession):
        """Initialize with async session."""
        super().__init__(session, PresentationModel)

    async def get_by_id(self, presentation_id: UUID) -> PresentationModel:
        """
        Get presentation by ID, raising exception if not found.

        Args:
            presentation_id: Presentation UUID

        Returns:
            Presentation entity

        Raises:
            NotFoundException: If presentation doesn't exist
        """
        presentation = await super().get_by_id(presentation_id)
        if not presentation:
            raise NotFoundException("Presentation", presentation_id)
        return presentation

    async def get_by_id_optional(self, presentation_id: UUID) -> Optional[PresentationModel]:
        """
        Get presentation by ID, returning None if not found.

        Args:
            presentation_id: Presentation UUID

        Returns:
            Presentation entity or None
        """
        return await super().get_by_id(presentation_id)

    async def get_all_ordered(
        self, skip: int = 0, limit: int = 100, order_by: str = "created_at"
    ) -> List[PresentationModel]:
        """
        Get all presentations with ordering and pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records
            order_by: Field to order by (created_at, updated_at, title)

        Returns:
            List of presentations ordered by specified field
        """
        order_column = getattr(PresentationModel, order_by, PresentationModel.created_at)
        statement = (
            select(PresentationModel)
            .order_by(desc(order_column))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def search_by_title(self, search_term: str, limit: int = 50) -> List[PresentationModel]:
        """
        Search presentations by title.

        Args:
            search_term: Text to search for in title
            limit: Maximum results to return

        Returns:
            List of matching presentations
        """
        statement = (
            select(PresentationModel)
            .where(PresentationModel.title.ilike(f"%{search_term}%"))
            .order_by(desc(PresentationModel.updated_at))
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_by_language(self, language: str, limit: int = 100) -> List[PresentationModel]:
        """
        Get presentations by language.

        Args:
            language: Language code
            limit: Maximum results

        Returns:
            List of presentations in specified language
        """
        statement = (
            select(PresentationModel)
            .where(PresentationModel.language == language)
            .order_by(desc(PresentationModel.created_at))
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 10) -> List[PresentationModel]:
        """
        Get most recently created presentations.

        Args:
            limit: Number of presentations to return

        Returns:
            List of recent presentations
        """
        statement = (
            select(PresentationModel)
            .order_by(desc(PresentationModel.created_at))
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_recently_updated(self, limit: int = 10) -> List[PresentationModel]:
        """
        Get most recently updated presentations.

        Args:
            limit: Number of presentations to return

        Returns:
            List of recently updated presentations
        """
        statement = (
            select(PresentationModel)
            .order_by(desc(PresentationModel.updated_at))
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def count_by_language(self, language: str) -> int:
        """
        Count presentations in a specific language.

        Args:
            language: Language code

        Returns:
            Count of presentations
        """
        from sqlalchemy import func
        statement = (
            select(func.count())
            .select_from(PresentationModel)
            .where(PresentationModel.language == language)
        )
        result = await self.session.execute(statement)
        return result.scalar_one()
