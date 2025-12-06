export interface LLMConfig {
  LLM?: string;

  // OpenAI
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;

  // Google
  GOOGLE_API_KEY?: string;
  GOOGLE_MODEL?: string;

  // Anthropic
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;

  // Ollama
  OLLAMA_URL?: string;
  OLLAMA_MODEL?: string;

  // Custom LLM
  CUSTOM_LLM_URL?: string;
  CUSTOM_LLM_API_KEY?: string;
  CUSTOM_MODEL?: string;
  CUSTOM_TEMPLATE_LLM_URL?: string;
  CUSTOM_TEMPLATE_LLM_API_KEY?: string;
  CUSTOM_TEMPLATE_MODEL?: string;

  // Image providers
  IMAGE_PROVIDER?: string;
  PEXELS_API_KEY?: string;
  PIXABAY_API_KEY?: string;

  // Other Configs
  TOOL_CALLS?: boolean;
  DISABLE_THINKING?: boolean;
  EXTENDED_REASONING?: boolean;
  WEB_GROUNDING?: boolean;

  // Translation Agents Configuration
  TRANSLATION_USE_AGENTS?: boolean;
  TRANSLATION_PARSER_USE_LLM?: boolean;
  TRANSLATION_PARSER_MODEL?: string;
  TRANSLATION_MODEL?: string;
  TRANSLATION_BATCH_SIZE?: number;
  TRANSLATION_VALIDATOR_MODEL?: string;
  TRANSLATION_CUSTOM_URL?: string;
  TRANSLATION_CUSTOM_API_KEY?: string;

  // Only used in UI settings
  USE_CUSTOM_URL?: boolean;
}
