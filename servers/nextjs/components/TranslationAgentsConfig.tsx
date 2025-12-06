"use client";
import React, { useState, useEffect } from "react";
import { Info, Zap, Brain, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { LLMConfig } from "@/types/llm_config";
import { toast } from "sonner";

interface TranslationAgentsConfigProps {
  llmConfig: LLMConfig;
  setLlmConfig: React.Dispatch<React.SetStateAction<LLMConfig>>;
}

const BATCH_SIZE_OPTIONS = [
  { value: 10, label: "10 - איכות מקסימלית (איטי יותר)" },
  { value: 15, label: "15 - איכות גבוהה" },
  { value: 20, label: "20 - מאוזן (מומלץ)" },
  { value: 30, label: "30 - מהיר יותר" },
  { value: 50, label: "50 - הכי מהיר (עשוי להפחית איכות)" },
];

export default function TranslationAgentsConfig({
  llmConfig,
  setLlmConfig,
}: TranslationAgentsConfigProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsChecked, setModelsChecked] = useState(false);

  const useAgents = llmConfig.TRANSLATION_USE_AGENTS ?? true;
  const parserUseLLM = llmConfig.TRANSLATION_PARSER_USE_LLM ?? false;
  const parserModel = llmConfig.TRANSLATION_PARSER_MODEL || "";
  const translatorModel = llmConfig.TRANSLATION_MODEL || "";
  const validatorModel = llmConfig.TRANSLATION_VALIDATOR_MODEL || "";
  const batchSize = llmConfig.TRANSLATION_BATCH_SIZE || 20;

  // Fetch models from translation agents custom URL
  const fetchModels = async () => {
    // Use translation-specific URL if set, otherwise fall back to main custom URL
    const customLlmUrl = llmConfig.TRANSLATION_CUSTOM_URL || llmConfig.CUSTOM_LLM_URL;
    const customLlmApiKey = llmConfig.TRANSLATION_CUSTOM_API_KEY || llmConfig.CUSTOM_LLM_API_KEY;

    if (!customLlmUrl) {
      toast.error("אנא הגדר כתובת URL מותאמת אישית תחילה");
      return;
    }

    try {
      setModelsLoading(true);
      // This endpoint proxies the request to your custom URL
      const response = await fetch("/api/v1/ppt/openai/models/available", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: customLlmUrl,  // Your custom OpenAI-compatible URL
          api_key: customLlmApiKey,  // Your custom API key
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data);
        setModelsChecked(true);
        toast.success(`נמצאו ${data.length} מודלים זמינים`);
      } else {
        console.error("Failed to fetch models");
        setAvailableModels([]);
        setModelsChecked(true);
        toast.error("שגיאה בטעינת מודלים - בדוק שה-URL ומפתח ה-API תקינים");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("שגיאה בטעינת מודלים");
      setAvailableModels([]);
      setModelsChecked(true);
    } finally {
      setModelsLoading(false);
    }
  };

  // Reset models when URL or API key changes
  useEffect(() => {
    setAvailableModels([]);
    setModelsChecked(false);
  }, [llmConfig.TRANSLATION_CUSTOM_URL, llmConfig.TRANSLATION_CUSTOM_API_KEY, llmConfig.CUSTOM_LLM_URL, llmConfig.CUSTOM_LLM_API_KEY]);

  return (
    <div className="space-y-6">
      {/* Header with Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">תצורת סוכני תרגום</h3>
          <p className="text-sm text-gray-600 mt-1">
            הגדר מודלים שונים לכל שלב בתהליך התרגום
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useAgents}
            onChange={(e) =>
              setLlmConfig((prev) => ({
                ...prev,
                TRANSLATION_USE_AGENTS: e.target.checked,
              }))
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5146E5]"></div>
          <span className="ms-3 text-sm font-medium text-gray-900">
            {useAgents ? "מופעל" : "מושבת"}
          </span>
        </label>
      </div>

      {!useAgents && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">מערכת רב-סוכנית לא תפעל</p>
              <p className="text-xs text-yellow-700 mt-1">
                התרגום ישתמש במודל בודד במקום בשלושה סוכנים מיוחדים. זה עשוי להפחית איכות ולהגדיל עלויות.
              </p>
            </div>
          </div>
        </div>
      )}

      {useAgents && (
        <div className="space-y-6">
          {/* Translation-Specific URL Configuration */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">כתובת URL  לסוכני תרגום</h4>
            <p className="text-xs text-gray-600 mb-4">
              השאר ריק כדי להשתמש בכתובת הראשית
            </p>

            {/* URL Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
               כתובת  URL 
              </label>
              <input
                type="text"
                placeholder="https://api.your-service.com/v1"
                className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={llmConfig.TRANSLATION_CUSTOM_URL || ""}
                onChange={(e) =>
                  setLlmConfig((prev) => ({
                    ...prev,
                    TRANSLATION_CUSTOM_URL: e.target.value,
                  }))
                }
              />
            </div>

            {/* API Key Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  מפתח API תואם OpenAI (אופציונלי)
              </label>
              <input
                type="password"
                placeholder="sk-..."
                className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={llmConfig.TRANSLATION_CUSTOM_API_KEY || ""}
                onChange={(e) =>
                  setLlmConfig((prev) => ({
                    ...prev,
                    TRANSLATION_CUSTOM_API_KEY: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Fetch Models Button */}
          {(!modelsChecked || (modelsChecked && availableModels.length === 0)) && (
            <div className="mb-4">
              <button
                onClick={fetchModels}
                disabled={modelsLoading || (!llmConfig.TRANSLATION_CUSTOM_URL && !llmConfig.CUSTOM_LLM_URL)}
                className={`w-full py-2.5 px-4 rounded-lg transition-all duration-200 border-2 ${
                  modelsLoading || (!llmConfig.TRANSLATION_CUSTOM_URL && !llmConfig.CUSTOM_LLM_URL)
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500/20"
                }`}
              >
                {modelsLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    טוען מודלים...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    טען מודלים זמינים
                  </div>
                )}
              </button>
              {!llmConfig.TRANSLATION_CUSTOM_URL && !llmConfig.CUSTOM_LLM_URL && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  אנא הגדר כתובת URL 
                </p>
              )}
            </div>
          )}

          {/* Show message if no models found */}
          {modelsChecked && availableModels.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                לא נמצאו מודלים. אנא ודא שכתובת ה-URL ומפתח ה-API שלך תקינים.
              </p>
            </div>
          )}

          {/* Info Box */}
          {modelsChecked && availableModels.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" dir="rtl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">איך זה עובד:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>סוכן 1 (מנתח)</strong>: מזהה טקסט שלא צריך תרגום (קוד, קישורים, וכו')</li>
                    <li>• <strong>סוכן 2 (מתרגם)</strong>: מבצע את התרגום האיכותי</li>
                    <li>• <strong>סוכן 3 (מאמת)</strong>: בודק ומתקן בעיות באורך ומבנה</li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="text-xs">
                      <strong>נמצאו {availableModels.length} מודלים זמינים</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agent 1: Parser */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">סוכן 1: מנתח ומסווג</h4>
                <p className="text-xs text-gray-600">מזהה מה לתרגם ומה לשמור</p>
              </div>
            </div>

            {/* Parser LLM Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parserUseLLM}
                  onChange={(e) =>
                    setLlmConfig((prev) => ({
                      ...prev,
                      TRANSLATION_PARSER_USE_LLM: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#5146E5] border-gray-300 rounded focus:ring-[#5146E5]"
                />
                <span className="text-sm text-gray-700">
1                </span>
              </label>
            </div>

            {parserUseLLM && modelsChecked && availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מודל לניתוח
                </label>
                <select
                  value={parserModel}
                  onChange={(e) =>
                    setLlmConfig((prev) => ({
                      ...prev,
                      TRANSLATION_PARSER_MODEL: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5146E5] focus:border-transparent text-sm"
                  dir="rtl"
                >
                  <option value="">בחר מודל</option>
                  {availableModels.map((model: string) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  מומלץ: מודל מהיר וזול (המערכת מבוססת-כללים עובדת טוב יותר)
                </p>
              </div>
            )}

            {!parserUseLLM && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    משתמש בניתוח מבוסס-כללים (חינם ומהיר)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Agent 2: Translator */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">סוכן 2: מתרגם מומחה</h4>
                <p className="text-xs text-gray-600">גורם העיקרי לאיכות התרגום</p>
              </div>
            </div>

            {modelsChecked && availableModels.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מודל תרגום <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={translatorModel}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        TRANSLATION_MODEL: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5146E5] focus:border-transparent text-sm"
                    dir="rtl"
                  >
                    <option value="">בחר מודל</option>
                    {availableModels.map((model: string) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    זהו המודל החשוב ביותר - בחר את המודל הטוב ביותר שיש לך
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    גודל אצווה (Batch Size)
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        TRANSLATION_BATCH_SIZE: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5146E5] focus:border-transparent text-sm"
                    dir="rtl"
                  >
                    {BATCH_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    אצוות קטנות = איכות טובה יותר אבל איטי יותר
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Agent 3: Validator */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">סוכן 3: מאמת ומשלב</h4>
                <p className="text-xs text-gray-600">בודק איכות ומתקן בעיות</p>
              </div>
            </div>

            {modelsChecked && availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מודל אימות
                </label>
                <select
                  value={validatorModel}
                  onChange={(e) =>
                    setLlmConfig((prev) => ({
                      ...prev,
                      TRANSLATION_VALIDATOR_MODEL: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5146E5] focus:border-transparent text-sm"
                  dir="rtl"
                >
                  <option value="">בחר מודל</option>
                  {availableModels.map((model: string) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  מומלץ: מודל מהיר וזול (האימות הוא פשוט)
                </p>
              </div>
            )}
          </div>

          {/* Configuration Summary */}
          {modelsChecked && availableModels.length > 0 && translatorModel && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">תצורה נבחרת</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">סוכן 1 (מנתח):</span>
                  <span className="font-medium text-gray-900">
                    {parserUseLLM ? parserModel || "לא נבחר" : "מבוסס-כללים (חינם)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">סוכן 2 (מתרגם):</span>
                  <span className="font-medium text-gray-900">{translatorModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">סוכן 3 (מאמת):</span>
                  <span className="font-medium text-gray-900">{validatorModel || "לא נבחר"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">גודל אצווה:</span>
                  <span className="font-medium text-gray-900">{batchSize} אלמנטים</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Settings */}
          {modelsChecked && availableModels.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">המלצות</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span><strong>לאיכות מקסימלית:</strong> השתמש במודל הטוב ביותר שיש לך עבור סוכן 2, עם גודל אצווה 10-15</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span><strong>למאוזן:</strong> מודל בינוני לסוכן 2, גודל אצווה 20, מודל מהיר לסוכנים 1 ו-3</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span><strong>למהיר וזול:</strong> מודל מהיר לכולם, גודל אצווה 30-50, השאר את סוכן 1 כמבוסס-כללים</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
