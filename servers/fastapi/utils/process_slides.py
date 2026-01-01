import asyncio
from typing import List, Optional, Tuple
from models.image_prompt import ImagePrompt
from models.sql.image_asset import ImageAsset
from models.sql.slide import SlideModel
from services.icon_finder_service import ICON_FINDER_SERVICE
from services.image_generation_service import ImageGenerationService
from utils.asset_directory_utils import get_images_directory
from utils.dict_utils import get_dict_at_path, get_dict_paths_with_key, set_dict_at_path
from utils.logger import logger


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
    try:
        async_tasks = []
        icon_paths = get_dict_paths_with_key(slide.content, "__icon_query__")

        # NOTE: Image generation removed - users add images manually
        # Old code searched for __image_prompt__ but that field no longer exists

        # Fetch icons only
        for icon_path in icon_paths:
            try:
                __icon_query__parent = get_dict_at_path(slide.content, icon_path)
                if __icon_query__parent and "__icon_query__" in __icon_query__parent:
                    async_tasks.append(
                        ICON_FINDER_SERVICE.search_icons(__icon_query__parent["__icon_query__"])
                    )
                else:
                    # No valid icon query, append None placeholder
                    async_tasks.append(asyncio.sleep(0, result=[]))
            except Exception as e:
                logger.warning(f"Error getting icon query for path {icon_path}: {str(e)}")
                # Append empty result for this icon
                async_tasks.append(asyncio.sleep(0, result=[]))

        if not async_tasks:
            return []

        # Gather all results with exception handling
        results = await asyncio.gather(*async_tasks, return_exceptions=True)

        # Update icons in slide content
        result_index = 0
        for icon_path in icon_paths:
            try:
                icon_dict = get_dict_at_path(slide.content, icon_path)
                if not icon_dict:
                    logger.warning(f"Could not get icon dict at path {icon_path}")
                    result_index += 1
                    continue

                if result_index < len(results):
                    icon_result = results[result_index]
                    result_index += 1

                    # Check if result is an exception
                    if isinstance(icon_result, Exception):
                        logger.warning(f"Icon search failed for path {icon_path}: {str(icon_result)}")
                        continue

                    # Check if the icon search returned any results
                    if icon_result and isinstance(icon_result, (list, tuple)) and len(icon_result) > 0:
                        icon_dict["__icon_url__"] = icon_result[0]
                        set_dict_at_path(slide.content, icon_path, icon_dict)
                    else:
                        logger.debug(f"No icon found for query at path {icon_path}, keeping placeholder")
                        # If no icon found, keep the placeholder icon

            except Exception as e:
                logger.error(f"Error processing icon at path {icon_path}: {str(e)}", exc_info=True)
                # Continue to next icon instead of failing entire slide

        return []  # No image assets generated

    except Exception as e:
        logger.error(f"Critical error in process_slide_and_fetch_assets: {str(e)}", exc_info=True)
        # Return empty list to prevent cascading failures
        return []


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
    try:
        # NOTE: Image generation removed - users add images manually
        # Old code searched for __image_prompt__ but that field no longer exists

        # Finds all old icons
        old_icon_dict_paths = get_dict_paths_with_key(old_slide_content, "__icon_query__")
        old_icon_dicts = []
        old_icon_queries = []

        for path in old_icon_dict_paths:
            try:
                old_icon_dict = get_dict_at_path(old_slide_content, path)
                if old_icon_dict and "__icon_query__" in old_icon_dict:
                    old_icon_dicts.append(old_icon_dict)
                    old_icon_queries.append(old_icon_dict["__icon_query__"])
            except Exception as e:
                logger.warning(f"Error getting old icon at path {path}: {str(e)}")

        # Finds all new icons
        new_icon_dict_paths = get_dict_paths_with_key(new_slide_content, "__icon_query__")
        new_icon_dicts = []

        for path in new_icon_dict_paths:
            try:
                new_icon_dict = get_dict_at_path(new_slide_content, path)
                if new_icon_dict:
                    new_icon_dicts.append(new_icon_dict)
            except Exception as e:
                logger.warning(f"Error getting new icon at path {path}: {str(e)}")

        # Creates async tasks for fetching new icons
        async_icon_fetch_tasks = []
        new_icons_fetch_status = []

        # Creates async tasks for fetching new icons
        # Use old icon url if query is same
        for new_icon in new_icon_dicts:
            try:
                if not new_icon or "__icon_query__" not in new_icon:
                    new_icons_fetch_status.append(False)
                    continue

                if new_icon["__icon_query__"] in old_icon_queries:
                    try:
                        old_icon_index = old_icon_queries.index(new_icon["__icon_query__"])
                        if old_icon_index < len(old_icon_dicts) and "__icon_url__" in old_icon_dicts[old_icon_index]:
                            old_icon_url = old_icon_dicts[old_icon_index]["__icon_url__"]
                            new_icon["__icon_url__"] = old_icon_url
                            new_icons_fetch_status.append(False)
                            continue
                    except (ValueError, IndexError, KeyError) as e:
                        logger.warning(f"Error reusing old icon: {str(e)}")

                async_icon_fetch_tasks.append(
                    ICON_FINDER_SERVICE.search_icons(new_icon["__icon_query__"])
                )
                new_icons_fetch_status.append(True)
            except Exception as e:
                logger.warning(f"Error processing new icon: {str(e)}")
                new_icons_fetch_status.append(False)

        if not async_icon_fetch_tasks:
            # No new icons to fetch, just update the content
            for i, new_icon_dict in enumerate(new_icon_dicts):
                if i < len(new_icon_dict_paths):
                    try:
                        set_dict_at_path(new_slide_content, new_icon_dict_paths[i], new_icon_dict)
                    except Exception as e:
                        logger.warning(f"Error setting icon dict at path {new_icon_dict_paths[i]}: {str(e)}")
            return []

        new_icons = await asyncio.gather(*async_icon_fetch_tasks, return_exceptions=True)

        # Sets new icon urls for assets that were fetched
        icon_index = 0
        for i, should_fetch in enumerate(new_icons_fetch_status):
            try:
                if should_fetch:
                    # Validate indices
                    if icon_index >= len(new_icons):
                        logger.warning(f"Icon index {icon_index} out of range for results length {len(new_icons)}")
                        icon_index += 1
                        continue

                    if i >= len(new_icon_dicts):
                        logger.warning(f"Dict index {i} out of range for new_icon_dicts length {len(new_icon_dicts)}")
                        icon_index += 1
                        continue

                    icon_result = new_icons[icon_index]

                    # Check if result is an exception
                    if isinstance(icon_result, Exception):
                        logger.warning(f"Icon search failed for icon {i}: {str(icon_result)}")
                    # Check if the icon search returned any results
                    elif icon_result and isinstance(icon_result, (list, tuple)) and len(icon_result) > 0:
                        new_icon_dicts[i]["__icon_url__"] = icon_result[0]
                    else:
                        logger.debug(f"No icon found for icon {i}, keeping placeholder")
                    # If no icon found, keep the placeholder or old icon

                    icon_index += 1
            except Exception as e:
                logger.error(f"Error setting icon URL for icon {i}: {str(e)}", exc_info=True)
                if should_fetch:
                    icon_index += 1

        # Update all icon dicts in the content
        for i, new_icon_dict in enumerate(new_icon_dicts):
            if i < len(new_icon_dict_paths):
                try:
                    set_dict_at_path(new_slide_content, new_icon_dict_paths[i], new_icon_dict)
                except Exception as e:
                    logger.error(f"Error setting icon dict at path {new_icon_dict_paths[i]}: {str(e)}", exc_info=True)

        return []  # No image assets generated

    except Exception as e:
        logger.error(f"Critical error in process_old_and_new_slides_and_fetch_assets: {str(e)}", exc_info=True)
        # Return empty list to prevent cascading failures
        return []


def process_slide_add_placeholder_assets(slide: SlideModel):
    """
    Add placeholder assets to slides.

    NOTE: Image placeholders have been removed - users add images manually.
    This function only adds placeholder icons now.
    """
    try:
        # NOTE: Image placeholder insertion removed - users add images manually
        # Old code added placeholder images at __image_prompt__ paths

        # Only add placeholder icons
        icon_paths = get_dict_paths_with_key(slide.content, "__icon_query__")
        for icon_path in icon_paths:
            try:
                icon_dict = get_dict_at_path(slide.content, icon_path)
                if icon_dict:
                    icon_dict["__icon_url__"] = "/static/icons/placeholder.svg"
                    set_dict_at_path(slide.content, icon_path, icon_dict)
                else:
                    logger.warning(f"Could not get icon dict at path {icon_path} for placeholder")
            except Exception as e:
                logger.error(f"Error adding placeholder icon at path {icon_path}: {str(e)}", exc_info=True)
                # Continue to next icon instead of failing

    except Exception as e:
        logger.error(f"Critical error in process_slide_add_placeholder_assets: {str(e)}", exc_info=True)
        # Don't raise - allow presentation generation to continue even if placeholders fail
