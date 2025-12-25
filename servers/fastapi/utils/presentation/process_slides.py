import asyncio
from typing import List, Optional, Tuple
from models.image_prompt import ImagePrompt
from models.sql.image_asset import ImageAsset
from models.sql.slide import SlideModel
from service.icon_finder_service import ICON_FINDER_SERVICE
from service.image_service import ImageGenerationService
from utils.file_operations.asset_directory import get_images_directory
from utils.data_processing.dict_utils import get_dict_at_path, get_dict_paths_with_key, set_dict_at_path


async def process_slide_and_fetch_assets(
    image_generation_service: ImageGenerationService,
    slide: SlideModel,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
) -> List[ImageAsset]:
    """
    Fetch assets for a slide.

    NOTE: Image generation has been disabled - users add images manually.
    This function only fetches icons now.
    """

    async_tasks = []
    icon_paths = get_dict_paths_with_key(slide.content, "__icon_query__")

    # NOTE: Image generation removed - users add images manually
    # Old code searched for __image_prompt__ but that field no longer exists

    # Fetch icons only
    for icon_path in icon_paths:
        __icon_query__parent = get_dict_at_path(slide.content, icon_path)
        async_tasks.append(
            ICON_FINDER_SERVICE.search_icons(__icon_query__parent["__icon_query__"])
        )

    results = await asyncio.gather(*async_tasks)

    # Update icons in slide content
    for icon_path in icon_paths:
        icon_dict = get_dict_at_path(slide.content, icon_path)
        if results:
            icon_dict["__icon_url__"] = results.pop(0)[0]
            set_dict_at_path(slide.content, icon_path, icon_dict)
        # If no results available (icon generation failed), skip this icon

    return []  # No image assets generated


async def process_old_and_new_slides_and_fetch_assets(
    image_generation_service: ImageGenerationService,
    old_slide_content: dict,
    new_slide_content: dict,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
) -> List[ImageAsset]:
    """
    Fetch assets for updated slides.

    NOTE: Image generation has been disabled - users add images manually.
    This function only fetches icons now.
    """

    # NOTE: Image generation removed - users add images manually
    # Old code searched for __image_prompt__ but that field no longer exists

    # Finds all old icons
    old_icon_dict_paths = get_dict_paths_with_key(old_slide_content, "__icon_query__")
    old_icon_dicts = [
        get_dict_at_path(old_slide_content, path) for path in old_icon_dict_paths
    ]
    old_icon_queries = [
        old_icon_dict["__icon_query__"] for old_icon_dict in old_icon_dicts
    ]

    # Finds all new icons
    new_icon_dict_paths = get_dict_paths_with_key(new_slide_content, "__icon_query__")
    new_icon_dicts = [
        get_dict_at_path(new_slide_content, path) for path in new_icon_dict_paths
    ]

    # Creates async tasks for fetching new icons
    async_icon_fetch_tasks = []
    new_icons_fetch_status = []

    # Creates async tasks for fetching new icons
    # Use old icon url if query is same
    for new_icon in new_icon_dicts:
        if new_icon["__icon_query__"] in old_icon_queries:
            old_icon_url = old_icon_dicts[
                old_icon_queries.index(new_icon["__icon_query__"])
            ]["__icon_url__"]
            new_icon["__icon_url__"] = old_icon_url
            new_icons_fetch_status.append(False)
            continue

        async_icon_fetch_tasks.append(
            ICON_FINDER_SERVICE.search_icons(new_icon["__icon_query__"])
        )
        new_icons_fetch_status.append(True)

    new_icons = await asyncio.gather(*async_icon_fetch_tasks)

    # Sets new icon urls for assets that were fetched
    icon_index = 0
    for i, should_fetch in enumerate(new_icons_fetch_status):
        if should_fetch:
            new_icon_dicts[i]["__icon_url__"] = new_icons[icon_index][0]
            icon_index += 1

    for i, new_icon_dict in enumerate(new_icon_dicts):
        set_dict_at_path(new_slide_content, new_icon_dict_paths[i], new_icon_dict)

    return []  # No image assets generated


def process_slide_add_placeholder_assets(slide: SlideModel):

    image_paths = get_dict_paths_with_key(slide.content, "__image_prompt__")
    icon_paths = get_dict_paths_with_key(slide.content, "__icon_query__")

    for image_path in image_paths:
        image_dict = get_dict_at_path(slide.content, image_path)
        image_dict["__image_url__"] = "/static/images/placeholder.jpg"
        set_dict_at_path(slide.content, image_path, image_dict)

    for icon_path in icon_paths:
        icon_dict = get_dict_at_path(slide.content, icon_path)
        icon_dict["__icon_url__"] = "/static/icons/placeholder.svg"
        set_dict_at_path(slide.content, icon_path, icon_dict)
