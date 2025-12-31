"use client";

import { LLMConfig } from "@/types/llm_config";
import { Zap, Clock, Info } from "lucide-react";

interface GenerationMethodConfigProps {
  llmConfig: LLMConfig;
  setLlmConfig: (config: LLMConfig) => void;
}

const GENERATION_METHODS = {
  stream: {
    value: "stream" as const,
    label: "סטרימינג (זמן אמת)",
    icon: Zap,
    description: "קבל עדכונים בזמן אמת תוך כדי יצירת התוכן. מהיר יותר אך רגיש לבעיות רשת.",
  },
  jobs: {
    value: "jobs" as const,
    label: "משימות רקע",
    icon: Clock,
    description: "יצירת תוכן ברקע עם מעקב התקדמות. יציב יותר, מתאים לחיבורים איטיים.",
  },
};

export default function GenerationMethodConfig({
  llmConfig,
  setLlmConfig,
}: GenerationMethodConfigProps) {
  const currentMethod = llmConfig.GENERATION_METHOD || "jobs";

  const handleMethodChange = (method: "stream" | "jobs") => {
    setLlmConfig({
      ...llmConfig,
      GENERATION_METHOD: method,
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        שיטת יצירת תוכן
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        בחר כיצד המערכת תייצר מתווה ומצגות
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.values(GENERATION_METHODS).map((method) => {
          const Icon = method.icon;
          const isSelected = currentMethod === method.value;

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => handleMethodChange(method.value)}
              className={`p-4 rounded-xl border-2 text-right transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isSelected ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {method.label}
                    </span>
                    {isSelected && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        פעיל
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>המלצה:</strong> אם אתה נתקל בבעיות חיבור או תוצאות חלקיות, נסה לעבור לשיטת "משימות רקע".
          </p>
        </div>
      </div>
    </div>
  );
}
