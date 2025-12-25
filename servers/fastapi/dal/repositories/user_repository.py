"""
User Repository - Data access for users.

Handles user authentication and management data operations.
"""

from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from dal.repositories.base_repository import BaseRepository
from models.sql.user import User
from common.exceptions import NotFoundException, DuplicateEntityException


class UserRepository(BaseRepository[User]):
    """
    Repository for user data access.

    Provides user-specific queries for authentication and management.
    """

    def __init__(self, session: AsyncSession):
        """Initialize with async session."""
        super().__init__(session, User)

    async def get_by_id(self, user_id: int) -> User:
        """
        Get user by ID, raising exception if not found.

        Args:
            user_id: User ID

        Returns:
            User entity

        Raises:
            NotFoundException: If user doesn't exist
        """
        user = await super().get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)
        return user

    async def get_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.

        Args:
            username: Username string

        Returns:
            User entity or None if not found
        """
        statement = select(User).where(User.username == username)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def username_exists(self, username: str) -> bool:
        """
        Check if username already exists.

        Args:
            username: Username to check

        Returns:
            True if username exists
        """
        user = await self.get_by_username(username)
        return user is not None

    async def create_user(self, username: str) -> User:
        """
        Create a new user with username.

        Args:
            username: Username for new user

        Returns:
            Created user entity

        Raises:
            DuplicateEntityException: If username already exists
        """
        # Check for duplicate
        if await self.username_exists(username):
            raise DuplicateEntityException("User", "username", username)

        user = User(username=username)
        return await self.create(user)

    async def update_last_login(self, user_id: int) -> User:
        """
        Update user's last login timestamp.

        Args:
            user_id: User ID

        Returns:
            Updated user entity
        """
        user = await self.get_by_id(user_id)
        user.last_login = datetime.utcnow()
        return await self.update(user)

    async def get_or_create_user(self, username: str) -> tuple[User, bool]:
        """
        Get existing user or create new one.

        Args:
            username: Username to get or create

        Returns:
            Tuple of (User entity, created flag)
        """
        user = await self.get_by_username(username)
        if user:
            return user, False

        user = await self.create_user(username)
        return user, True
