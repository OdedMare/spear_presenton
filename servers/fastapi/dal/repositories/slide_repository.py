"""
Slide Repository - Data access for slides.

Handles all database operations for slide entities.
"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc

from dal.repositories.base_repository import BaseRepository
from models.sql.slide import SlideModel
from common.exceptions import NotFoundException


class SlideRepository(BaseRepository[SlideModel]):
    """
    Repository for slide data access.

    Provides slide-specific queries and operations.
    """

    def __init__(self, session: AsyncSession):
        """Initialize with async session."""
        super().__init__(session, SlideModel)

    async def get_by_id(self, slide_id: UUID) -> SlideModel:
        """
        Get slide by ID, raising exception if not found.

        Args:
            slide_id: Slide UUID

        Returns:
            Slide entity

        Raises:
            NotFoundException: If slide doesn't exist
        """
        slide = await super().get_by_id(slide_id)
        if not slide:
            raise NotFoundException("Slide", slide_id)
        return slide

    async def get_by_presentation(
        self, presentation_id: UUID, ordered: bool = True
    ) -> List[SlideModel]:
        """
        Get all slides for a presentation.

        Args:
            presentation_id: Presentation UUID
            ordered: Whether to order by index (default True)

        Returns:
            List of slides for the presentation
        """
        statement = select(SlideModel).where(SlideModel.presentation == presentation_id)

        if ordered:
            statement = statement.order_by(asc(SlideModel.index))

        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_by_presentation_and_index(
        self, presentation_id: UUID, index: int
    ) -> Optional[SlideModel]:
        """
        Get slide by presentation and index position.

        Args:
            presentation_id: Presentation UUID
            index: Slide index (0-based)

        Returns:
            Slide at specified index or None
        """
        statement = select(SlideModel).where(
            SlideModel.presentation == presentation_id, SlideModel.index == index
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_slides_by_layout(
        self, presentation_id: UUID, layout: str
    ) -> List[SlideModel]:
        """
        Get all slides with a specific layout in a presentation.

        Args:
            presentation_id: Presentation UUID
            layout: Layout name

        Returns:
            List of slides with specified layout
        """
        statement = (
            select(SlideModel)
            .where(
                SlideModel.presentation == presentation_id, SlideModel.layout == layout
            )
            .order_by(asc(SlideModel.index))
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def delete_by_presentation(self, presentation_id: UUID) -> int:
        """
        Delete all slides for a presentation.

        Args:
            presentation_id: Presentation UUID

        Returns:
            Number of slides deleted
        """
        slides = await self.get_by_presentation(presentation_id, ordered=False)
        slide_ids = [slide.id for slide in slides]
        return await self.delete_many(slide_ids)

    async def count_by_presentation(self, presentation_id: UUID) -> int:
        """
        Count slides in a presentation.

        Args:
            presentation_id: Presentation UUID

        Returns:
            Number of slides
        """
        from sqlalchemy import func

        statement = (
            select(func.count())
            .select_from(SlideModel)
            .where(SlideModel.presentation == presentation_id)
        )
        result = await self.session.execute(statement)
        return result.scalar_one()

    async def reorder_slides(
        self, presentation_id: UUID, slide_order: List[UUID]
    ) -> List[SlideModel]:
        """
        Reorder slides in a presentation.

        Args:
            presentation_id: Presentation UUID
            slide_order: List of slide IDs in desired order

        Returns:
            Updated list of slides in new order
        """
        slides = []
        for index, slide_id in enumerate(slide_order):
            slide = await self.get_by_id(slide_id)
            if slide.presentation != presentation_id:
                raise ValueError(f"Slide {slide_id} does not belong to presentation {presentation_id}")
            slide.index = index
            slides.append(slide)

        await self.session.commit()
        for slide in slides:
            await self.session.refresh(slide)

        return slides

    async def duplicate_slide(self, slide_id: UUID, new_index: Optional[int] = None) -> SlideModel:
        """
        Duplicate a slide, optionally at a specific index.

        Args:
            slide_id: Slide UUID to duplicate
            new_index: Optional index for new slide

        Returns:
            Newly created slide
        """
        original = await self.get_by_id(slide_id)

        # If no index provided, insert after original
        if new_index is None:
            new_index = original.index + 1

        # Shift subsequent slides
        slides = await self.get_by_presentation(original.presentation)
        for slide in slides:
            if slide.index >= new_index:
                slide.index += 1
                self.session.add(slide)

        # Create duplicate
        new_slide = original.get_new_slide(
            presentation=original.presentation, content=original.content
        )
        new_slide.index = new_index

        await self.session.commit()
        await self.session.refresh(new_slide)

        return new_slide
