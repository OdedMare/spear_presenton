"""
Auth Service - Business logic for authentication.

Handles user authentication, session management, and authorization.
"""

from typing import Optional
from datetime import datetime

from dal.repositories.user_repository import UserRepository
from models.sql.user import User
from common.exceptions import AuthenticationError, ValidationError
from common.logger import logger


class AuthService:
    """
    Service for authentication business logic.

    Responsibilities:
    - Validate user credentials
    - Manage user sessions
    - Handle user creation and login
    - Enforce authentication business rules

    Dependencies:
    - UserRepository (data access)
    """

    def __init__(self, user_repo: UserRepository):
        """
        Initialize with repository dependency.

        Args:
            user_repo: User data access
        """
        self.user_repo = user_repo

    async def authenticate_user(self, username: str) -> User:
        """
        Authenticate user by username (simple username-only auth).

        Business rules:
        - Username must be provided and non-empty
        - User is auto-created if doesn't exist
        - Last login timestamp is updated

        Args:
            username: Username to authenticate

        Returns:
            Authenticated user

        Raises:
            ValidationError: If username is invalid
        """
        # Validation
        if not username or len(username.strip()) == 0:
            raise ValidationError("Username cannot be empty", field="username")

        if len(username) > 100:
            raise ValidationError("Username too long (max 100 characters)", field="username")

        # Get or create user
        user, created = await self.user_repo.get_or_create_user(username.strip())

        if created:
            logger.info(f"Created new user: {username}")
        else:
            logger.info(f"User logged in: {username}")

        # Update last login
        await self.user_repo.update_last_login(user.id)

        return user

    async def get_user(self, user_id: int) -> User:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User entity

        Raises:
            NotFoundException: If user doesn't exist
        """
        return await self.user_repo.get_by_id(user_id)

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.

        Args:
            username: Username

        Returns:
            User or None
        """
        return await self.user_repo.get_by_username(username)

    async def create_user(self, username: str) -> User:
        """
        Create a new user.

        Args:
            username: Username for new user

        Returns:
            Created user

        Raises:
            ValidationError: If username invalid
            DuplicateEntityException: If username exists
        """
        if not username or len(username.strip()) == 0:
            raise ValidationError("Username cannot be empty", field="username")

        if len(username) > 100:
            raise ValidationError("Username too long", field="username")

        user = await self.user_repo.create_user(username.strip())
        logger.info(f"Created user: {username}")

        return user

    async def username_exists(self, username: str) -> bool:
        """
        Check if username already exists.

        Args:
            username: Username to check

        Returns:
            True if exists
        """
        return await self.user_repo.username_exists(username)
