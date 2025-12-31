from typing import Optional
from pydantic import BaseModel


class UserConfig(BaseModel):
    LLM: Optional[str] = None

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: Optional[str] = None

    # Google
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_MODEL: Optional[str] = None

    # Anthropic
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: Optional[str] = None

    # Ollama
    OLLAMA_URL: Optional[str] = None
    OLLAMA_MODEL: Optional[str] = None

    # Custom LLM
    CUSTOM_LLM_URL: Optional[str] = None
    CUSTOM_LLM_API_KEY: Optional[str] = None
    CUSTOM_MODEL: Optional[str] = None
    CUSTOM_TEMPLATE_LLM_URL: Optional[str] = None
    CUSTOM_TEMPLATE_LLM_API_KEY: Optional[str] = None
    CUSTOM_TEMPLATE_MODEL: Optional[str] = None

    # Image Provider
    IMAGE_PROVIDER: Optional[str] = None
    PEXELS_API_KEY: Optional[str] = None
    PIXABAY_API_KEY: Optional[str] = None

    # Reasoning
    TOOL_CALLS: Optional[bool] = None
    DISABLE_THINKING: Optional[bool] = None
    EXTENDED_REASONING: Optional[bool] = None

    # Web Search
    WEB_GROUNDING: Optional[bool] = None

    # Model Capabilities
    FORCE_ADAPTIVE_MODE: Optional[bool] = None

    # Translation Agents Configuration
    TRANSLATION_USE_AGENTS: Optional[bool] = None
    TRANSLATION_PARSER_USE_LLM: Optional[bool] = None
    TRANSLATION_PARSER_MODEL: Optional[str] = None
    TRANSLATION_MODEL: Optional[str] = None
    TRANSLATION_BATCH_SIZE: Optional[int] = None
    TRANSLATION_VALIDATOR_MODEL: Optional[str] = None
    TRANSLATION_CUSTOM_URL: Optional[str] = None
    TRANSLATION_CUSTOM_API_KEY: Optional[str] = None

    # Elasticsearch Logging Configuration
    ELASTICSEARCH_URL: Optional[str] = None
    ELASTICSEARCH_USER: Optional[str] = None
    ELASTICSEARCH_PASSWORD: Optional[str] = None
    ELASTICSEARCH_INDEX_PREFIX: Optional[str] = None
    LOG_LEVEL: Optional[str] = None
    DISABLE_SSL_VERIFY: Optional[bool] = None

    # Generation Method Configuration
    # "stream" = SSE real-time streaming
    # "jobs" = Background job with polling
    GENERATION_METHOD: Optional[str] = "jobs"  # Default to jobs (more reliable)
