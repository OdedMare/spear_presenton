"""
Service Dependencies - Dependency injection for service layer.

Provides factory functions for creating service instances with their dependencies.
These are used as FastAPI Depends() parameters in route handlers.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from dal.database import get_async_session
from dal.repositories.presentation_repository import PresentationRepository
from dal.repositories.slide_repository import SlideRepository
from dal.repositories.user_repository import UserRepository
from dal.repositories.webhook_repository import WebhookRepository
from dal.repositories.template_repository import TemplateRepository
from service.presentation_service import PresentationService
from service.slide_service import SlideService
from service.auth_service import AuthService


# Repository Factories
async def get_presentation_repository(
    session: AsyncSession = Depends(get_async_session),
) -> PresentationRepository:
    """
    Create PresentationRepository with database session.

    Args:
        session: Async database session

    Returns:
        PresentationRepository instance
    """
    return PresentationRepository(session)


async def get_slide_repository(
    session: AsyncSession = Depends(get_async_session),
) -> SlideRepository:
    """
    Create SlideRepository with database session.

    Args:
        session: Async database session

    Returns:
        SlideRepository instance
    """
    return SlideRepository(session)


async def get_user_repository(
    session: AsyncSession = Depends(get_async_session),
) -> UserRepository:
    """
    Create UserRepository with database session.

    Args:
        session: Async database session

    Returns:
        UserRepository instance
    """
    return UserRepository(session)


async def get_webhook_repository(
    session: AsyncSession = Depends(get_async_session),
) -> WebhookRepository:
    """
    Create WebhookRepository with database session.

    Args:
        session: Async database session

    Returns:
        WebhookRepository instance
    """
    return WebhookRepository(session)


async def get_template_repository(
    session: AsyncSession = Depends(get_async_session),
) -> TemplateRepository:
    """
    Create TemplateRepository with database session.

    Args:
        session: Async database session

    Returns:
        TemplateRepository instance
    """
    return TemplateRepository(session)


# Service Factories
async def get_presentation_service(
    presentation_repo: PresentationRepository = Depends(get_presentation_repository),
    slide_repo: SlideRepository = Depends(get_slide_repository),
) -> PresentationService:
    """
    Create PresentationService with repository dependencies.

    This implements Dependency Injection - the service receives
    its dependencies rather than creating them internally.

    Args:
        presentation_repo: Presentation repository
        slide_repo: Slide repository

    Returns:
        PresentationService instance
    """
    return PresentationService(
        presentation_repo=presentation_repo,
        slide_repo=slide_repo,
    )


async def get_slide_service(
    slide_repo: SlideRepository = Depends(get_slide_repository),
    presentation_repo: PresentationRepository = Depends(get_presentation_repository),
) -> SlideService:
    """
    Create SlideService with repository dependencies.

    Args:
        slide_repo: Slide repository
        presentation_repo: Presentation repository

    Returns:
        SlideService instance
    """
    return SlideService(
        slide_repo=slide_repo,
        presentation_repo=presentation_repo,
    )


async def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> AuthService:
    """
    Create AuthService with repository dependencies.

    Args:
        user_repo: User repository

    Returns:
        AuthService instance
    """
    return AuthService(user_repo=user_repo)
