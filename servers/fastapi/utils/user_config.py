import os
import json

from models.user_config import UserConfig
from utils.get_env import (
    get_custom_llm_api_key_env,
    get_custom_llm_url_env,
    get_custom_model_env,
    get_custom_template_llm_url_env,
    get_custom_template_llm_api_key_env,
    get_custom_template_model_env,
    get_disable_thinking_env,
    get_llm_provider_env,
    get_openai_api_key_env,
    get_openai_model_env,
    get_pexels_api_key_env,
    get_tool_calls_env,
    get_user_config_path_env,
    get_image_provider_env,
    get_pixabay_api_key_env,
    get_extended_reasoning_env,
    get_web_grounding_env,
    get_force_adaptive_mode_env,
    get_translation_use_agents_env,
    get_translation_parser_use_llm_env,
    get_translation_parser_model_env,
    get_translation_model_env,
    get_translation_batch_size_env,
    get_translation_validator_model_env,
    get_translation_custom_url_env,
    get_translation_custom_api_key_env,
)
from utils.parsers import parse_bool_or_none
from utils.set_env import (
    set_custom_llm_api_key_env,
    set_custom_llm_url_env,
    set_custom_model_env,
    set_custom_template_llm_url_env,
    set_custom_template_llm_api_key_env,
    set_custom_template_model_env,
    set_disable_thinking_env,
    set_extended_reasoning_env,
    set_llm_provider_env,
    set_openai_api_key_env,
    set_openai_model_env,
    set_pexels_api_key_env,
    set_image_provider_env,
    set_pixabay_api_key_env,
    set_tool_calls_env,
    set_web_grounding_env,
    set_force_adaptive_mode_env,
    set_translation_use_agents_env,
    set_translation_parser_use_llm_env,
    set_translation_parser_model_env,
    set_translation_model_env,
    set_translation_batch_size_env,
    set_translation_validator_model_env,
    set_translation_custom_url_env,
    set_translation_custom_api_key_env,
)


def get_user_config():
    user_config_path = get_user_config_path_env()

    existing_config = UserConfig()
    try:
        if os.path.exists(user_config_path):
            with open(user_config_path, "r") as f:
                existing_config = UserConfig(**json.load(f))
    except Exception as e:
        print("Error while loading user config")
        pass

    return UserConfig(
        LLM=existing_config.LLM or get_llm_provider_env(),
        OPENAI_API_KEY=existing_config.OPENAI_API_KEY or get_openai_api_key_env(),
        OPENAI_MODEL=existing_config.OPENAI_MODEL or get_openai_model_env(),
        CUSTOM_LLM_URL=existing_config.CUSTOM_LLM_URL or get_custom_llm_url_env(),
        CUSTOM_LLM_API_KEY=existing_config.CUSTOM_LLM_API_KEY
        or get_custom_llm_api_key_env(),
        CUSTOM_MODEL=existing_config.CUSTOM_MODEL or get_custom_model_env(),
        CUSTOM_TEMPLATE_LLM_URL=existing_config.CUSTOM_TEMPLATE_LLM_URL
        or get_custom_template_llm_url_env(),
        CUSTOM_TEMPLATE_LLM_API_KEY=existing_config.CUSTOM_TEMPLATE_LLM_API_KEY
        or get_custom_template_llm_api_key_env(),
        CUSTOM_TEMPLATE_MODEL=existing_config.CUSTOM_TEMPLATE_MODEL
        or get_custom_template_model_env(),
        IMAGE_PROVIDER=existing_config.IMAGE_PROVIDER or get_image_provider_env(),
        PIXABAY_API_KEY=existing_config.PIXABAY_API_KEY or get_pixabay_api_key_env(),
        PEXELS_API_KEY=existing_config.PEXELS_API_KEY or get_pexels_api_key_env(),
        TOOL_CALLS=(
            existing_config.TOOL_CALLS
            if existing_config.TOOL_CALLS is not None
            else (parse_bool_or_none(get_tool_calls_env()) or False)
        ),
        DISABLE_THINKING=(
            existing_config.DISABLE_THINKING
            if existing_config.DISABLE_THINKING is not None
            else (parse_bool_or_none(get_disable_thinking_env()) or False)
        ),
        EXTENDED_REASONING=(
            existing_config.EXTENDED_REASONING
            if existing_config.EXTENDED_REASONING is not None
            else (parse_bool_or_none(get_extended_reasoning_env()) or False)
        ),
        WEB_GROUNDING=(
            existing_config.WEB_GROUNDING
            if existing_config.WEB_GROUNDING is not None
            else (parse_bool_or_none(get_web_grounding_env()) or False)
        ),
        FORCE_ADAPTIVE_MODE=(
            existing_config.FORCE_ADAPTIVE_MODE
            if existing_config.FORCE_ADAPTIVE_MODE is not None
            else (parse_bool_or_none(get_force_adaptive_mode_env()) or False)
        ),
        TRANSLATION_USE_AGENTS=(
            existing_config.TRANSLATION_USE_AGENTS
            if existing_config.TRANSLATION_USE_AGENTS is not None
            else (parse_bool_or_none(get_translation_use_agents_env()) or True)
        ),
        TRANSLATION_PARSER_USE_LLM=(
            existing_config.TRANSLATION_PARSER_USE_LLM
            if existing_config.TRANSLATION_PARSER_USE_LLM is not None
            else (parse_bool_or_none(get_translation_parser_use_llm_env()) or False)
        ),
        TRANSLATION_PARSER_MODEL=existing_config.TRANSLATION_PARSER_MODEL or get_translation_parser_model_env(),
        TRANSLATION_MODEL=existing_config.TRANSLATION_MODEL or get_translation_model_env(),
        TRANSLATION_BATCH_SIZE=(
            existing_config.TRANSLATION_BATCH_SIZE
            if existing_config.TRANSLATION_BATCH_SIZE is not None
            else (int(get_translation_batch_size_env()) if get_translation_batch_size_env() else 20)
        ),
        TRANSLATION_VALIDATOR_MODEL=existing_config.TRANSLATION_VALIDATOR_MODEL or get_translation_validator_model_env(),
        TRANSLATION_CUSTOM_URL=existing_config.TRANSLATION_CUSTOM_URL or get_translation_custom_url_env(),
        TRANSLATION_CUSTOM_API_KEY=existing_config.TRANSLATION_CUSTOM_API_KEY or get_translation_custom_api_key_env(),
    )


def update_env_with_user_config():
    user_config = get_user_config()
    if user_config.LLM:
        set_llm_provider_env(user_config.LLM)
    if user_config.OPENAI_API_KEY:
        set_openai_api_key_env(user_config.OPENAI_API_KEY)
    if user_config.OPENAI_MODEL:
        set_openai_model_env(user_config.OPENAI_MODEL)
    if user_config.CUSTOM_LLM_URL:
        set_custom_llm_url_env(user_config.CUSTOM_LLM_URL)
    if user_config.CUSTOM_LLM_API_KEY:
        set_custom_llm_api_key_env(user_config.CUSTOM_LLM_API_KEY)
    if user_config.CUSTOM_MODEL:
        set_custom_model_env(user_config.CUSTOM_MODEL)
    if user_config.CUSTOM_TEMPLATE_LLM_URL:
        set_custom_template_llm_url_env(user_config.CUSTOM_TEMPLATE_LLM_URL)
    if user_config.CUSTOM_TEMPLATE_LLM_API_KEY:
        set_custom_template_llm_api_key_env(user_config.CUSTOM_TEMPLATE_LLM_API_KEY)
    if user_config.CUSTOM_TEMPLATE_MODEL:
        set_custom_template_model_env(user_config.CUSTOM_TEMPLATE_MODEL)
    if user_config.IMAGE_PROVIDER:
        set_image_provider_env(user_config.IMAGE_PROVIDER)
    if user_config.PIXABAY_API_KEY:
        set_pixabay_api_key_env(user_config.PIXABAY_API_KEY)
    if user_config.PEXELS_API_KEY:
        set_pexels_api_key_env(user_config.PEXELS_API_KEY)
    if user_config.TOOL_CALLS is not None:
        set_tool_calls_env(str(user_config.TOOL_CALLS))
    if user_config.DISABLE_THINKING is not None:
        set_disable_thinking_env(str(user_config.DISABLE_THINKING))
    if user_config.EXTENDED_REASONING is not None:
        set_extended_reasoning_env(str(user_config.EXTENDED_REASONING))
    if user_config.WEB_GROUNDING is not None:
        set_web_grounding_env(str(user_config.WEB_GROUNDING))
    if user_config.FORCE_ADAPTIVE_MODE is not None:
        set_force_adaptive_mode_env(str(user_config.FORCE_ADAPTIVE_MODE))
    if user_config.TRANSLATION_USE_AGENTS is not None:
        set_translation_use_agents_env(str(user_config.TRANSLATION_USE_AGENTS))
    if user_config.TRANSLATION_PARSER_USE_LLM is not None:
        set_translation_parser_use_llm_env(str(user_config.TRANSLATION_PARSER_USE_LLM))
    if user_config.TRANSLATION_PARSER_MODEL:
        set_translation_parser_model_env(user_config.TRANSLATION_PARSER_MODEL)
    if user_config.TRANSLATION_MODEL:
        set_translation_model_env(user_config.TRANSLATION_MODEL)
    if user_config.TRANSLATION_BATCH_SIZE is not None:
        set_translation_batch_size_env(str(user_config.TRANSLATION_BATCH_SIZE))
    if user_config.TRANSLATION_VALIDATOR_MODEL:
        set_translation_validator_model_env(user_config.TRANSLATION_VALIDATOR_MODEL)
    if user_config.TRANSLATION_CUSTOM_URL:
        set_translation_custom_url_env(user_config.TRANSLATION_CUSTOM_URL)
    if user_config.TRANSLATION_CUSTOM_API_KEY:
        set_translation_custom_api_key_env(user_config.TRANSLATION_CUSTOM_API_KEY)
