"""
Presentation Service - Business logic for presentation operations.

Orchestrates presentation creation, retrieval, updates, and deletion.
Contains business rules and validation logic.
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from dal.repositories.presentation_repository import PresentationRepository
from dal.repositories.slide_repository import SlideRepository
from models.sql.presentation import PresentationModel
from models.presentation_layout import PresentationLayoutModel
from models.presentation_structure_model import PresentationStructureModel
from common.exceptions import ValidationError, NotFoundException, BusinessRuleViolation
from common.logger import logger, log_presentation_generation


class PresentationService:
    """
    Service for presentation business logic.

    Responsibilities:
    - Validate presentation data
    - Orchestrate presentation creation and updates
    - Enforce business rules
    - Coordinate with slide service

    Dependencies:
    - PresentationRepository (data access)
    - SlideRepository (for slide operations)
    """

    def __init__(
        self,
        presentation_repo: PresentationRepository,
        slide_repo: SlideRepository,
    ):
        """
        Initialize with repository dependencies.

        Args:
            presentation_repo: Presentation data access
            slide_repo: Slide data access
        """
        self.presentation_repo = presentation_repo
        self.slide_repo = slide_repo

    async def get_presentation(self, presentation_id: UUID) -> PresentationModel:
        """
        Retrieve presentation by ID.

        Args:
            presentation_id: Presentation UUID

        Returns:
            Presentation entity

        Raises:
            NotFoundException: If presentation doesn't exist
        """
        logger.info(f"Retrieving presentation {presentation_id}")
        return await self.presentation_repo.get_by_id(presentation_id)

    async def list_presentations(
        self, skip: int = 0, limit: int = 100, order_by: str = "created_at"
    ) -> List[PresentationModel]:
        """
        List all presentations with pagination and ordering.

        Args:
            skip: Number to skip
            limit: Maximum results
            order_by: Field to order by

        Returns:
            List of presentations
        """
        # Business rule: Limit maximum results
        if limit > 1000:
            raise ValidationError("Maximum limit is 1000", field="limit")

        return await self.presentation_repo.get_all_ordered(skip, limit, order_by)

    async def create_presentation(
        self,
        content: str,
        n_slides: int,
        language: str,
        title: Optional[str] = None,
        file_paths: Optional[List[str]] = None,
        instructions: Optional[str] = None,
        tone: Optional[str] = None,
        verbosity: Optional[str] = None,
        include_table_of_contents: bool = False,
        include_title_slide: bool = True,
        web_search: bool = False,
    ) -> PresentationModel:
        """
        Create a new presentation.

        Business rules:
        - Content must not be empty
        - Number of slides must be between 1 and 100
        - Language must be specified
        - Title is optional but recommended

        Args:
            content: Presentation content/prompt
            n_slides: Number of slides to generate
            language: Language code
            title: Optional presentation title
            file_paths: Optional source document paths
            instructions: Optional generation instructions
            tone: Optional tone (professional, casual, etc.)
            verbosity: Optional verbosity level
            include_table_of_contents: Whether to include TOC
            include_title_slide: Whether to include title slide
            web_search: Whether to enable web search

        Returns:
            Created presentation

        Raises:
            ValidationError: If validation fails
        """
        # Business validation
        if not content or len(content.strip()) == 0:
            raise ValidationError("Content cannot be empty", field="content")

        if n_slides < 1 or n_slides > 100:
            raise ValidationError(
                "Number of slides must be between 1 and 100", field="n_slides"
            )

        if not language:
            raise ValidationError("Language must be specified", field="language")

        # Create presentation entity
        presentation = PresentationModel(
            content=content,
            n_slides=n_slides,
            language=language,
            title=title,
            file_paths=file_paths,
            instructions=instructions,
            tone=tone,
            verbosity=verbosity,
            include_table_of_contents=include_table_of_contents,
            include_title_slide=include_title_slide,
            web_search=web_search,
        )

        # Persist
        created = await self.presentation_repo.create(presentation)

        logger.info(f"Created presentation {created.id}")
        log_presentation_generation(str(created.id), "created")

        return created

    async def update_presentation(
        self, presentation_id: UUID, **updates
    ) -> PresentationModel:
        """
        Update presentation fields.

        Args:
            presentation_id: Presentation UUID
            **updates: Fields to update

        Returns:
            Updated presentation

        Raises:
            NotFoundException: If presentation doesn't exist
            ValidationError: If validation fails
        """
        presentation = await self.presentation_repo.get_by_id(presentation_id)

        # Apply updates
        for field, value in updates.items():
            if hasattr(presentation, field):
                setattr(presentation, field, value)

        # Validate after updates
        if presentation.n_slides < 1 or presentation.n_slides > 100:
            raise ValidationError("Number of slides must be between 1 and 100")

        updated = await self.presentation_repo.update(presentation)
        logger.info(f"Updated presentation {presentation_id}")

        return updated

    async def set_presentation_layout(
        self, presentation_id: UUID, layout: PresentationLayoutModel
    ) -> PresentationModel:
        """
        Set presentation layout configuration.

        Args:
            presentation_id: Presentation UUID
            layout: Layout configuration

        Returns:
            Updated presentation
        """
        presentation = await self.presentation_repo.get_by_id(presentation_id)
        presentation.set_layout(layout)

        updated = await self.presentation_repo.update(presentation)
        logger.info(f"Set layout for presentation {presentation_id}")

        return updated

    async def set_presentation_structure(
        self, presentation_id: UUID, structure: PresentationStructureModel
    ) -> PresentationModel:
        """
        Set presentation structure.

        Args:
            presentation_id: Presentation UUID
            structure: Structure configuration

        Returns:
            Updated presentation
        """
        presentation = await self.presentation_repo.get_by_id(presentation_id)
        presentation.set_structure(structure)

        updated = await self.presentation_repo.update(presentation)
        logger.info(f"Set structure for presentation {presentation_id}")

        return updated

    async def delete_presentation(self, presentation_id: UUID) -> bool:
        """
        Delete presentation and all associated slides.

        Business rule: Cascade delete all slides.

        Args:
            presentation_id: Presentation UUID

        Returns:
            True if deleted

        Raises:
            NotFoundException: If presentation doesn't exist
        """
        # Verify exists
        await self.presentation_repo.get_by_id(presentation_id)

        # Delete associated slides first (cascade)
        deleted_slides = await self.slide_repo.delete_by_presentation(presentation_id)
        logger.info(f"Deleted {deleted_slides} slides for presentation {presentation_id}")

        # Delete presentation
        result = await self.presentation_repo.delete(presentation_id)
        logger.info(f"Deleted presentation {presentation_id}")

        return result

    async def search_presentations(
        self, search_term: str, limit: int = 50
    ) -> List[PresentationModel]:
        """
        Search presentations by title.

        Args:
            search_term: Text to search for
            limit: Maximum results

        Returns:
            List of matching presentations
        """
        if not search_term or len(search_term.strip()) == 0:
            raise ValidationError("Search term cannot be empty", field="search_term")

        return await self.presentation_repo.search_by_title(search_term, limit)

    async def get_recent_presentations(self, limit: int = 10) -> List[PresentationModel]:
        """
        Get recently created presentations.

        Args:
            limit: Number of presentations

        Returns:
            List of recent presentations
        """
        return await self.presentation_repo.get_recent(limit)

    async def duplicate_presentation(self, presentation_id: UUID) -> PresentationModel:
        """
        Duplicate an existing presentation with all slides.

        Args:
            presentation_id: Presentation UUID to duplicate

        Returns:
            New duplicated presentation

        Raises:
            NotFoundException: If presentation doesn't exist
        """
        # Get original
        original = await self.presentation_repo.get_by_id(presentation_id)

        # Create duplicate
        duplicate = original.get_new_presentation()

        # Persist duplicate
        created = await self.presentation_repo.create(duplicate)

        # Duplicate all slides
        original_slides = await self.slide_repo.get_by_presentation(presentation_id)
        for slide in original_slides:
            new_slide = slide.get_new_slide(created.id)
            await self.slide_repo.create(new_slide)

        logger.info(
            f"Duplicated presentation {presentation_id} to {created.id} with {len(original_slides)} slides"
        )

        return created
