"""
Image Asset Repository - Data access for image assets.
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from dal.repositories.base_repository import BaseRepository
from models.sql.image_asset import ImageAsset
from common.exceptions import NotFoundException


class ImageAssetRepository(BaseRepository[ImageAsset]):
    """Repository for image asset data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, ImageAsset)

    async def get_by_id(self, asset_id: UUID) -> ImageAsset:
        asset = await super().get_by_id(asset_id)
        if not asset:
            raise NotFoundException("ImageAsset", asset_id)
        return asset

    async def get_by_path(self, path: str) -> Optional[ImageAsset]:
        """Get image asset by file path."""
        statement = select(ImageAsset).where(ImageAsset.path == path)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_uploaded_assets(self) -> List[ImageAsset]:
        """Get all uploaded (user-provided) images."""
        statement = select(ImageAsset).where(ImageAsset.is_uploaded == True)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_generated_assets(self) -> List[ImageAsset]:
        """Get all AI-generated images."""
        statement = select(ImageAsset).where(ImageAsset.is_uploaded == False)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
