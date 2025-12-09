import os


def set_temp_directory_env(value):
    os.environ["TEMP_DIRECTORY"] = value


def set_user_config_path_env(value):
    os.environ["USER_CONFIG_PATH"] = value


def set_llm_provider_env(value):
    os.environ["LLM"] = value


def set_custom_llm_url_env(value):
    os.environ["CUSTOM_LLM_URL"] = value


def set_openai_api_key_env(value):
    os.environ["OPENAI_API_KEY"] = value


def set_openai_model_env(value):
    os.environ["OPENAI_MODEL"] = value


def set_custom_llm_api_key_env(value):
    os.environ["CUSTOM_LLM_API_KEY"] = value


def set_custom_model_env(value):
    os.environ["CUSTOM_MODEL"] = value

def set_custom_template_llm_url_env(value):
    os.environ["CUSTOM_TEMPLATE_LLM_URL"] = value

def set_custom_template_llm_api_key_env(value):
    os.environ["CUSTOM_TEMPLATE_LLM_API_KEY"] = value

def set_custom_template_model_env(value):
    os.environ["CUSTOM_TEMPLATE_MODEL"] = value

def set_pexels_api_key_env(value):
    os.environ["PEXELS_API_KEY"] = value


def set_image_provider_env(value):
    os.environ["IMAGE_PROVIDER"] = value


def set_pixabay_api_key_env(value):
    os.environ["PIXABAY_API_KEY"] = value


def set_tool_calls_env(value):
    os.environ["TOOL_CALLS"] = value


def set_disable_thinking_env(value):
    os.environ["DISABLE_THINKING"] = value


def set_extended_reasoning_env(value):
    os.environ["EXTENDED_REASONING"] = value


def set_web_grounding_env(value):
    os.environ["WEB_GROUNDING"] = value


def set_force_adaptive_mode_env(value):
    os.environ["FORCE_ADAPTIVE_MODE"] = value


def set_translation_use_agents_env(value):
    os.environ["TRANSLATION_USE_AGENTS"] = value


def set_translation_parser_use_llm_env(value):
    os.environ["TRANSLATION_PARSER_USE_LLM"] = value


def set_translation_parser_model_env(value):
    os.environ["TRANSLATION_PARSER_MODEL"] = value


def set_translation_model_env(value):
    os.environ["TRANSLATION_MODEL"] = value


def set_translation_batch_size_env(value):
    os.environ["TRANSLATION_BATCH_SIZE"] = value


def set_translation_validator_model_env(value):
    os.environ["TRANSLATION_VALIDATOR_MODEL"] = value


def set_translation_custom_url_env(value):
    os.environ["TRANSLATION_CUSTOM_URL"] = value


def set_translation_custom_api_key_env(value):
    os.environ["TRANSLATION_CUSTOM_API_KEY"] = value
