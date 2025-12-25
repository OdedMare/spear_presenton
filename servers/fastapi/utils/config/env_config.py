import os


def get_can_change_keys_env():
    return os.getenv("CAN_CHANGE_KEYS")


def get_database_url_env():
    return os.getenv("DATABASE_URL")


def get_app_data_directory_env():
    """
    Return a valid app data directory path string.
    Priority:
    1) APP_DATA_DIRECTORY env var if set and non-empty
    2) /tmp/app_data if it exists (Docker/OpenShift deployment)
    3) <repo_root>/app_data when running locally
    """
    app_data_dir = os.getenv("APP_DATA_DIRECTORY")
    if app_data_dir and app_data_dir.strip():
        return app_data_dir

    # Use Docker/OpenShift volume mount if present
    if os.path.isdir("/tmp/app_data") or os.getenv("KUBERNETES_SERVICE_HOST"):
        return "/tmp/app_data"

    # Fall back to repo-local app_data directory
    repo_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..")
    )
    return os.path.join(repo_root, "app_data")


def get_temp_directory_env():
    return os.getenv("TEMP_DIRECTORY")


def get_user_config_path_env():
    return os.getenv("USER_CONFIG_PATH")


def get_llm_provider_env():
    return os.getenv("LLM")





def get_custom_llm_url_env():
    return os.getenv("CUSTOM_LLM_URL")


def get_openai_api_key_env():
    return os.getenv("OPENAI_API_KEY")


def get_openai_model_env():
    return os.getenv("OPENAI_MODEL")


def get_google_api_key_env():
    return os.getenv("GOOGLE_API_KEY")


def get_google_model_env():
    return os.getenv("GOOGLE_MODEL")


def get_anthropic_api_key_env():
    return os.getenv("ANTHROPIC_API_KEY")


def get_anthropic_model_env():
    return os.getenv("ANTHROPIC_MODEL")


def get_ollama_url_env():
    return os.getenv("OLLAMA_URL")


def get_ollama_model_env():
    return os.getenv("OLLAMA_MODEL")


def get_custom_llm_api_key_env():
    return os.getenv("CUSTOM_LLM_API_KEY")


def get_custom_model_env():
    return os.getenv("CUSTOM_MODEL")

def get_custom_template_llm_url_env():
    return os.getenv("CUSTOM_TEMPLATE_LLM_URL")

def get_custom_template_llm_api_key_env():
    return os.getenv("CUSTOM_TEMPLATE_LLM_API_KEY")

def get_custom_template_model_env():
    return os.getenv("CUSTOM_TEMPLATE_MODEL")

def get_pexels_api_key_env():
    return os.getenv("PEXELS_API_KEY")


def get_image_provider_env():
    return os.getenv("IMAGE_PROVIDER")


def get_pixabay_api_key_env():
    return os.getenv("PIXABAY_API_KEY")


def get_tool_calls_env():
    return os.getenv("TOOL_CALLS")


def get_disable_thinking_env():
    return os.getenv("DISABLE_THINKING")


def get_extended_reasoning_env():
    return os.getenv("EXTENDED_REASONING")


def get_web_grounding_env():
    return os.getenv("WEB_GROUNDING")


def get_force_adaptive_mode_env():
    return os.getenv("FORCE_ADAPTIVE_MODE")


def get_translation_use_agents_env():
    return os.getenv("TRANSLATION_USE_AGENTS")


def get_translation_parser_use_llm_env():
    return os.getenv("TRANSLATION_PARSER_USE_LLM")


def get_translation_parser_model_env():
    return os.getenv("TRANSLATION_PARSER_MODEL")


def get_translation_model_env():
    return os.getenv("TRANSLATION_MODEL")


def get_translation_batch_size_env():
    return os.getenv("TRANSLATION_BATCH_SIZE")


def get_translation_validator_model_env():
    return os.getenv("TRANSLATION_VALIDATOR_MODEL")


def get_translation_custom_url_env():
    return os.getenv("TRANSLATION_CUSTOM_URL")


def get_translation_custom_api_key_env():
    return os.getenv("TRANSLATION_CUSTOM_API_KEY")


# Elasticsearch Logging Configuration
def get_elasticsearch_url_env():
    return os.getenv("ELASTICSEARCH_URL")


def get_elasticsearch_user_env():
    return os.getenv("ELASTICSEARCH_USER")


def get_elasticsearch_password_env():
    return os.getenv("ELASTICSEARCH_PASSWORD")


def get_elasticsearch_index_prefix_env():
    return os.getenv("ELASTICSEARCH_INDEX_PREFIX")


def get_log_level_env():
    return os.getenv("LOG_LEVEL")


def get_disable_ssl_verify_env():
    return os.getenv("DISABLE_SSL_VERIFY")
