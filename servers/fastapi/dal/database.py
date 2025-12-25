from collections.abc import AsyncGenerator
import os
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy import select, text
from sqlmodel import SQLModel

from models.sql.async_presentation_generation_status import (
    AsyncPresentationGenerationTaskModel,
)
from models.sql.image_asset import ImageAsset
from models.sql.key_value import KeyValueSqlModel
from models.sql.ollama_pull_status import OllamaPullStatus
from models.sql.presentation import PresentationModel
from models.sql.slide import SlideModel
from models.sql.presentation_layout_code import PresentationLayoutCodeModel
from models.sql.template import TemplateModel
from models.sql.user import User
from models.sql.webhook_subscription import WebhookSubscription
from utils.database.db_utils import get_database_url_and_connect_args


database_url, connect_args = get_database_url_and_connect_args()

sql_engine: AsyncEngine = create_async_engine(database_url, connect_args=connect_args)
async_session_maker = async_sessionmaker(sql_engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session



from utils.config.env_config import get_app_data_directory_env

# Container DB (Lives inside the container)
# Use app_data directory for local development as well
container_db_path = os.path.join(get_app_data_directory_env() or "/tmp", "container.db")
container_db_url = f"sqlite+aiosqlite:///{container_db_path}"
container_db_engine: AsyncEngine = create_async_engine(
    container_db_url, connect_args={"check_same_thread": False}
)
container_db_async_session_maker = async_sessionmaker(
    container_db_engine, expire_on_commit=False
)


async def get_container_db_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with container_db_async_session_maker() as session:
        yield session


# Create Database and Tables
async def create_db_and_tables():
    async with sql_engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: SQLModel.metadata.create_all(
                sync_conn,
                tables=[
                    PresentationModel.__table__,
                    SlideModel.__table__,
                    KeyValueSqlModel.__table__,
                    ImageAsset.__table__,
                    PresentationLayoutCodeModel.__table__,
                    TemplateModel.__table__,
                    User.__table__,
                    WebhookSubscription.__table__,
                    AsyncPresentationGenerationTaskModel.__table__,
                ],
            )
        )
        
        # Simple migration for KeyValueSqlModel columns
        try:
            await conn.execute(text("ALTER TABLE keyvaluesqlmodel ADD COLUMN expires_at DATETIME"))
        except Exception:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE keyvaluesqlmodel ADD COLUMN created_at DATETIME"))
        except Exception:
            pass

        # Migrations for PresentationModel (frequent updates)
        presentation_columns = [
            ("instructions", "TEXT"),
            ("tone", "VARCHAR"),
            ("verbosity", "VARCHAR"),
            ("include_table_of_contents", "BOOLEAN DEFAULT FALSE"),
            ("include_title_slide", "BOOLEAN DEFAULT TRUE"),
            ("web_search", "BOOLEAN DEFAULT FALSE"),
            ("layout", "JSON"),
            ("structure", "JSON"),
            ("title", "VARCHAR"),
        ]
        
        for col_name, col_type in presentation_columns:
            try:
                await conn.execute(text(f"ALTER TABLE presentations ADD COLUMN {col_name} {col_type}"))
            except Exception:
                pass # Column already exists

        # Migration for SlideModel
        try:
            await conn.execute(text("ALTER TABLE slides ADD COLUMN speaker_note TEXT"))
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE slides ADD COLUMN properties JSON"))
        except Exception:
            pass

    async with container_db_engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: SQLModel.metadata.create_all(
                sync_conn,
                tables=[OllamaPullStatus.__table__],
            )
        )
