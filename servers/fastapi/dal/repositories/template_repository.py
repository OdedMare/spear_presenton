"""
Template Repository - Data access for custom templates.

Manages custom template persistence and retrieval.
"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from dal.repositories.base_repository import BaseRepository
from models.sql.template import TemplateModel
from common.exceptions import NotFoundException, DuplicateEntityException


class TemplateRepository(BaseRepository[TemplateModel]):
    """
    Repository for template data access.

    Provides template-specific queries for custom template management.
    """

    def __init__(self, session: AsyncSession):
        """Initialize with async session."""
        super().__init__(session, TemplateModel)

    async def get_by_id(self, template_id: UUID) -> TemplateModel:
        """
        Get template by ID, raising exception if not found.

        Args:
            template_id: Template UUID

        Returns:
            Template entity

        Raises:
            NotFoundException: If template doesn't exist
        """
        template = await super().get_by_id(template_id)
        if not template:
            raise NotFoundException("Template", template_id)
        return template

    async def get_by_name(self, name: str) -> Optional[TemplateModel]:
        """
        Get template by name.

        Args:
            name: Template name

        Returns:
            Template entity or None
        """
        statement = select(TemplateModel).where(TemplateModel.name == name)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def name_exists(self, name: str) -> bool:
        """
        Check if template name already exists.

        Args:
            name: Template name to check

        Returns:
            True if name exists
        """
        template = await self.get_by_name(name)
        return template is not None

    async def create_template(
        self, name: str, description: Optional[str] = None, template_id: Optional[UUID] = None
    ) -> TemplateModel:
        """
        Create a new template.

        Args:
            name: Template name
            description: Optional description
            template_id: Optional UUID (typically matches presentation_id)

        Returns:
            Created template entity

        Raises:
            DuplicateEntityException: If name already exists
        """
        if await self.name_exists(name):
            raise DuplicateEntityException("Template", "name", name)

        template = TemplateModel(name=name, description=description)
        if template_id:
            template.id = template_id

        return await self.create(template)

    async def get_all_templates(self, skip: int = 0, limit: int = 100) -> List[TemplateModel]:
        """
        Get all templates ordered by creation date.

        Args:
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of templates
        """
        statement = (
            select(TemplateModel)
            .order_by(desc(TemplateModel.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def search_by_name(self, search_term: str, limit: int = 50) -> List[TemplateModel]:
        """
        Search templates by name.

        Args:
            search_term: Text to search for in name
            limit: Maximum results

        Returns:
            List of matching templates
        """
        statement = (
            select(TemplateModel)
            .where(TemplateModel.name.ilike(f"%{search_term}%"))
            .order_by(desc(TemplateModel.created_at))
            .limit(limit)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def update_template(
        self, template_id: UUID, name: Optional[str] = None, description: Optional[str] = None
    ) -> TemplateModel:
        """
        Update template details.

        Args:
            template_id: Template UUID
            name: New name (optional)
            description: New description (optional)

        Returns:
            Updated template entity

        Raises:
            DuplicateEntityException: If new name already exists
        """
        template = await self.get_by_id(template_id)

        if name and name != template.name:
            if await self.name_exists(name):
                raise DuplicateEntityException("Template", "name", name)
            template.name = name

        if description is not None:
            template.description = description

        return await self.update(template)
