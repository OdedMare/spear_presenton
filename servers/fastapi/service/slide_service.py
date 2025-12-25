"""
Slide Service - Business logic for slide operations.

Handles slide CRUD, reordering, duplication, and content management.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from dal.repositories.slide_repository import SlideRepository
from dal.repositories.presentation_repository import PresentationRepository
from models.sql.slide import SlideModel
from common.exceptions import ValidationError, NotFoundException, BusinessRuleViolation
from common.logger import logger


class SlideService:
    """
    Service for slide business logic.

    Responsibilities:
    - Validate slide data
    - Manage slide creation, updates, deletion
    - Handle slide ordering and duplication
    - Enforce business rules for slides

    Dependencies:
    - SlideRepository (data access)
    - PresentationRepository (for validation)
    """

    def __init__(
        self,
        slide_repo: SlideRepository,
        presentation_repo: PresentationRepository,
    ):
        """
        Initialize with repository dependencies.

        Args:
            slide_repo: Slide data access
            presentation_repo: Presentation data access
        """
        self.slide_repo = slide_repo
        self.presentation_repo = presentation_repo

    async def get_slide(self, slide_id: UUID) -> SlideModel:
        """
        Retrieve slide by ID.

        Args:
            slide_id: Slide UUID

        Returns:
            Slide entity

        Raises:
            NotFoundException: If slide doesn't exist
        """
        return await self.slide_repo.get_by_id(slide_id)

    async def get_presentation_slides(
        self, presentation_id: UUID, ordered: bool = True
    ) -> List[SlideModel]:
        """
        Get all slides for a presentation.

        Args:
            presentation_id: Presentation UUID
            ordered: Whether to order by index

        Returns:
            List of slides

        Raises:
            NotFoundException: If presentation doesn't exist
        """
        # Verify presentation exists
        await self.presentation_repo.get_by_id(presentation_id)

        return await self.slide_repo.get_by_presentation(presentation_id, ordered)

    async def create_slide(
        self,
        presentation_id: UUID,
        layout_group: str,
        layout: str,
        index: int,
        content: Dict[str, Any],
        html_content: Optional[str] = None,
        speaker_note: Optional[str] = None,
        properties: Optional[Dict[str, Any]] = None,
    ) -> SlideModel:
        """
        Create a new slide in a presentation.

        Business rules:
        - Presentation must exist
        - Layout must be specified
        - Index must be non-negative
        - Content must be valid dict

        Args:
            presentation_id: Parent presentation UUID
            layout_group: Layout group name
            layout: Layout type
            index: Slide position (0-based)
            content: Slide content as dict
            html_content: Optional rendered HTML
            speaker_note: Optional speaker notes
            properties: Optional slide properties

        Returns:
            Created slide

        Raises:
            NotFoundException: If presentation doesn't exist
            ValidationError: If validation fails
        """
        # Business rule: Presentation must exist
        await self.presentation_repo.get_by_id(presentation_id)

        # Validation
        if not layout_group or not layout:
            raise ValidationError("Layout group and layout must be specified")

        if index < 0:
            raise ValidationError("Index must be non-negative", field="index")

        if not content or not isinstance(content, dict):
            raise ValidationError("Content must be a non-empty dict", field="content")

        # Create slide
        slide = SlideModel(
            presentation=presentation_id,
            layout_group=layout_group,
            layout=layout,
            index=index,
            content=content,
            html_content=html_content,
            speaker_note=speaker_note,
            properties=properties,
        )

        created = await self.slide_repo.create(slide)
        logger.info(f"Created slide {created.id} at index {index} for presentation {presentation_id}")

        return created

    async def update_slide(
        self, slide_id: UUID, **updates
    ) -> SlideModel:
        """
        Update slide fields.

        Args:
            slide_id: Slide UUID
            **updates: Fields to update

        Returns:
            Updated slide

        Raises:
            NotFoundException: If slide doesn't exist
            ValidationError: If validation fails
        """
        slide = await self.slide_repo.get_by_id(slide_id)

        # Apply updates
        for field, value in updates.items():
            if hasattr(slide, field):
                # Validate specific fields
                if field == "index" and value < 0:
                    raise ValidationError("Index must be non-negative")
                if field == "content" and not isinstance(value, dict):
                    raise ValidationError("Content must be a dict")

                setattr(slide, field, value)

        updated = await self.slide_repo.update(slide)
        logger.info(f"Updated slide {slide_id}")

        return updated

    async def update_slide_content(
        self, slide_id: UUID, content: Dict[str, Any], html_content: Optional[str] = None
    ) -> SlideModel:
        """
        Update slide content and optionally HTML.

        Args:
            slide_id: Slide UUID
            content: New content dict
            html_content: Optional new HTML

        Returns:
            Updated slide
        """
        if not content or not isinstance(content, dict):
            raise ValidationError("Content must be a non-empty dict")

        updates = {"content": content}
        if html_content is not None:
            updates["html_content"] = html_content

        return await self.update_slide(slide_id, **updates)

    async def update_speaker_note(
        self, slide_id: UUID, speaker_note: str
    ) -> SlideModel:
        """
        Update slide speaker notes.

        Args:
            slide_id: Slide UUID
            speaker_note: New speaker notes

        Returns:
            Updated slide
        """
        return await self.update_slide(slide_id, speaker_note=speaker_note)

    async def delete_slide(self, slide_id: UUID) -> bool:
        """
        Delete a slide.

        Business rule: Reindex remaining slides after deletion.

        Args:
            slide_id: Slide UUID

        Returns:
            True if deleted

        Raises:
            NotFoundException: If slide doesn't exist
        """
        slide = await self.slide_repo.get_by_id(slide_id)
        deleted_index = slide.index
        presentation_id = slide.presentation

        # Delete slide
        result = await self.slide_repo.delete(slide_id)

        # Reindex remaining slides
        remaining_slides = await self.slide_repo.get_by_presentation(presentation_id, ordered=True)
        for remaining in remaining_slides:
            if remaining.index > deleted_index:
                remaining.index -= 1
                await self.slide_repo.update(remaining)

        logger.info(f"Deleted slide {slide_id} and reindexed remaining slides")

        return result

    async def reorder_slides(
        self, presentation_id: UUID, slide_order: List[UUID]
    ) -> List[SlideModel]:
        """
        Reorder slides in a presentation.

        Business rules:
        - All slides must belong to the presentation
        - All existing slides must be included in new order

        Args:
            presentation_id: Presentation UUID
            slide_order: List of slide IDs in desired order

        Returns:
            Reordered slides

        Raises:
            ValidationError: If validation fails
        """
        # Verify presentation exists
        await self.presentation_repo.get_by_id(presentation_id)

        # Get existing slides
        existing_slides = await self.slide_repo.get_by_presentation(presentation_id, ordered=False)
        existing_ids = {slide.id for slide in existing_slides}

        # Business rule: All slides must be included
        if set(slide_order) != existing_ids:
            raise BusinessRuleViolation(
                "reorder_completeness",
                "All existing slides must be included in the new order"
            )

        # Perform reordering
        reordered = await self.slide_repo.reorder_slides(presentation_id, slide_order)
        logger.info(f"Reordered {len(reordered)} slides for presentation {presentation_id}")

        return reordered

    async def duplicate_slide(
        self, slide_id: UUID, new_index: Optional[int] = None
    ) -> SlideModel:
        """
        Duplicate a slide, optionally at a specific index.

        Args:
            slide_id: Slide UUID to duplicate
            new_index: Optional index for duplicate

        Returns:
            Duplicated slide

        Raises:
            NotFoundException: If slide doesn't exist
        """
        duplicated = await self.slide_repo.duplicate_slide(slide_id, new_index)
        logger.info(f"Duplicated slide {slide_id} to {duplicated.id} at index {duplicated.index}")

        return duplicated

    async def get_slides_by_layout(
        self, presentation_id: UUID, layout: str
    ) -> List[SlideModel]:
        """
        Get all slides with a specific layout.

        Args:
            presentation_id: Presentation UUID
            layout: Layout name

        Returns:
            List of slides with layout
        """
        # Verify presentation exists
        await self.presentation_repo.get_by_id(presentation_id)

        return await self.slide_repo.get_slides_by_layout(presentation_id, layout)

    async def count_slides(self, presentation_id: UUID) -> int:
        """
        Count slides in a presentation.

        Args:
            presentation_id: Presentation UUID

        Returns:
            Slide count
        """
        return await self.slide_repo.count_by_presentation(presentation_id)
