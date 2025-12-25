"""
Webhook Repository - Data access for webhook subscriptions.

Manages webhook subscription persistence and queries.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from dal.repositories.base_repository import BaseRepository
from models.sql.webhook_subscription import WebhookSubscription
from common.exceptions import NotFoundException


class WebhookRepository(BaseRepository[WebhookSubscription]):
    """
    Repository for webhook subscription data access.

    Provides webhook-specific queries for event management.
    """

    def __init__(self, session: AsyncSession):
        """Initialize with async session."""
        super().__init__(session, WebhookSubscription)

    async def get_by_id(self, webhook_id: str) -> WebhookSubscription:
        """
        Get webhook by ID, raising exception if not found.

        Args:
            webhook_id: Webhook ID

        Returns:
            Webhook subscription entity

        Raises:
            NotFoundException: If webhook doesn't exist
        """
        webhook = await super().get_by_id(webhook_id)
        if not webhook:
            raise NotFoundException("Webhook", webhook_id)
        return webhook

    async def get_by_event(self, event: str) -> List[WebhookSubscription]:
        """
        Get all webhook subscriptions for a specific event.

        Args:
            event: Event name (e.g., "presentation.created")

        Returns:
            List of webhook subscriptions for the event
        """
        statement = select(WebhookSubscription).where(
            WebhookSubscription.event == event
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_by_url(self, url: str) -> List[WebhookSubscription]:
        """
        Get all webhook subscriptions for a specific URL.

        Args:
            url: Webhook URL

        Returns:
            List of webhook subscriptions for the URL
        """
        statement = select(WebhookSubscription).where(WebhookSubscription.url == url)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_by_url_and_event(
        self, url: str, event: str
    ) -> Optional[WebhookSubscription]:
        """
        Get webhook subscription by URL and event combination.

        Args:
            url: Webhook URL
            event: Event name

        Returns:
            Webhook subscription or None
        """
        statement = select(WebhookSubscription).where(
            WebhookSubscription.url == url, WebhookSubscription.event == event
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def create_subscription(
        self, url: str, event: str, secret: Optional[str] = None
    ) -> WebhookSubscription:
        """
        Create a new webhook subscription.

        Args:
            url: Webhook URL
            event: Event name to subscribe to
            secret: Optional secret for signature verification

        Returns:
            Created webhook subscription
        """
        webhook = WebhookSubscription(url=url, event=event, secret=secret)
        return await self.create(webhook)

    async def delete_by_url_and_event(self, url: str, event: str) -> bool:
        """
        Delete webhook subscription by URL and event.

        Args:
            url: Webhook URL
            event: Event name

        Returns:
            True if deleted, False if not found
        """
        webhook = await self.get_by_url_and_event(url, event)
        if not webhook:
            return False

        await self.delete(webhook.id)
        return True

    async def delete_all_for_url(self, url: str) -> int:
        """
        Delete all webhook subscriptions for a URL.

        Args:
            url: Webhook URL

        Returns:
            Number of subscriptions deleted
        """
        webhooks = await self.get_by_url(url)
        webhook_ids = [w.id for w in webhooks]
        return await self.delete_many(webhook_ids)
