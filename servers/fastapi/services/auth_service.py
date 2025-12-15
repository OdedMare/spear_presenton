"""
Authentication service for username-only authentication.
Handles user login, session management, and token validation.
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlmodel import update

from models.sql.user import User
from models.sql.key_value import KeyValueSqlModel


class AuthService:
    """Service for handling authentication operations."""

    # Session tokens are stored in the key_value table with prefix "session:"
    SESSION_PREFIX = "session:"
    SESSION_EXPIRY_DAYS = 30

    @staticmethod
    async def login(username: str, session: AsyncSession) -> tuple[User, str]:
        """
        Login or create a user with the given username.

        Args:
            username: The username to login with
            session: Database session

        Returns:
            Tuple of (User, session_token)
        """
        # Validate username
        username = username.strip()
        if not username or len(username) < 2:
            raise ValueError("Username must be at least 2 characters")
        if len(username) > 100:
            raise ValueError("Username must be at most 100 characters")

        # Get or create user
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if user:
            # Update last login
            await session.execute(
                update(User)
                .where(User.id == user.id)
                .values(last_login=datetime.utcnow())
            )
            await session.commit()
            await session.refresh(user)
        else:
            # Create new user
            user = User(username=username, last_login=datetime.utcnow())
            session.add(user)
            await session.commit()
            await session.refresh(user)

        # Generate session token
        session_token = secrets.token_urlsafe(32)

        # Store session in key_value table
        expiry = datetime.utcnow() + timedelta(days=AuthService.SESSION_EXPIRY_DAYS)
        session_record = KeyValueSqlModel(
            key=f"{AuthService.SESSION_PREFIX}{session_token}",
            value=str(user.id),
            expires_at=expiry
        )
        session.add(session_record)
        await session.commit()

        return user, session_token

    @staticmethod
    async def validate_session(token: str, session: AsyncSession) -> Optional[User]:
        """
        Validate a session token and return the associated user.

        Args:
            token: The session token to validate
            session: Database session

        Returns:
            User if token is valid, None otherwise
        """
        # Get session from key_value table
        result = await session.execute(
            select(KeyValueSqlModel).where(
                KeyValueSqlModel.key == f"{AuthService.SESSION_PREFIX}{token}"
            )
        )
        session_record = result.scalar_one_or_none()

        if not session_record:
            return None

        # Check if session is expired
        if session_record.expires_at and session_record.expires_at < datetime.utcnow():
            # Delete expired session
            await session.delete(session_record)
            await session.commit()
            return None

        # Get user
        user_id = int(session_record.value)
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        return user

    @staticmethod
    async def logout(token: str, session: AsyncSession) -> bool:
        """
        Logout by deleting the session token.

        Args:
            token: The session token to invalidate
            session: Database session

        Returns:
            True if session was deleted, False if not found
        """
        result = await session.execute(
            select(KeyValueSqlModel).where(
                KeyValueSqlModel.key == f"{AuthService.SESSION_PREFIX}{token}"
            )
        )
        session_record = result.scalar_one_or_none()

        if session_record:
            await session.delete(session_record)
            await session.commit()
            return True

        return False
