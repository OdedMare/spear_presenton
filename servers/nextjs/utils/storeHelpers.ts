import { setLLMConfig } from "@/store/slices/userConfig";
import { store } from "@/store/store";
import { LLMConfig } from "@/types/llm_config";

export const handleSaveLLMConfig = async (llmConfig: LLMConfig) => {
  if (!hasValidLLMConfig(llmConfig)) {
    throw new Error("Provided configuration is not valid");
  }
  await fetch("/api/user-config", {
    method: "POST",
    body: JSON.stringify(llmConfig),
  });

  store.dispatch(setLLMConfig(llmConfig));
};

export const hasValidLLMConfig = (llmConfig: LLMConfig) => {
  if (!llmConfig.LLM) return false;
  if (!llmConfig.IMAGE_PROVIDER) return false;

  const isOpenAIConfigValid =
    llmConfig.OPENAI_MODEL !== "" &&
    llmConfig.OPENAI_MODEL !== null &&
    llmConfig.OPENAI_MODEL !== undefined &&
    llmConfig.OPENAI_API_KEY !== "" &&
    llmConfig.OPENAI_API_KEY !== null &&
    llmConfig.OPENAI_API_KEY !== undefined;

  const isCustomConfigValid =
    llmConfig.CUSTOM_LLM_URL !== "" &&
    llmConfig.CUSTOM_LLM_URL !== null &&
    llmConfig.CUSTOM_LLM_URL !== undefined &&
    llmConfig.CUSTOM_MODEL !== "" &&
    llmConfig.CUSTOM_MODEL !== null &&
    llmConfig.CUSTOM_MODEL !== undefined;

  const isImageConfigValid = () => {
    switch (llmConfig.IMAGE_PROVIDER) {
      case "pexels":
        return llmConfig.PEXELS_API_KEY && llmConfig.PEXELS_API_KEY !== "";
      case "pixabay":
        return llmConfig.PIXABAY_API_KEY && llmConfig.PIXABAY_API_KEY !== "";
      case "dall-e-3":
        return llmConfig.OPENAI_API_KEY && llmConfig.OPENAI_API_KEY !== "";
      case "gemini_flash":
        return llmConfig.GOOGLE_API_KEY && llmConfig.GOOGLE_API_KEY !== "";
      default:
        return false;
    }
  };

  const isLLMConfigValid =
    llmConfig.LLM === "custom"
      ? isCustomConfigValid
      : llmConfig.LLM === "openai"
        ? isOpenAIConfigValid
        : false;

  return isLLMConfigValid && isImageConfigValid();
};
