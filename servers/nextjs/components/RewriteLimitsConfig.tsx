"use client";
import React from "react";
import { Info, AlertTriangle } from "lucide-react";
import { LLMConfig } from "@/types/llm_config";

interface RewriteLimitsConfigProps {
  llmConfig: LLMConfig;
  setLlmConfig: React.Dispatch<React.SetStateAction<LLMConfig>>;
}

export default function RewriteLimitsConfig({
  llmConfig,
  setLlmConfig,
}: RewriteLimitsConfigProps) {
  const maxSlides = llmConfig.MAX_REWRITE_SLIDES || 50;

  const handleMaxSlidesChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setLlmConfig((prev) => ({
        ...prev,
        MAX_REWRITE_SLIDES: numValue,
      }));
    } else if (value === "") {
      // Allow clearing the input
      setLlmConfig((prev) => ({
        ...prev,
        MAX_REWRITE_SLIDES: undefined,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          הגבלות שכתוב ותרגום
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          הגדר מגבלות למספר השקפים במצגות שניתן להעלות לשכתוב או תרגום
        </p>
      </div>

      {/* Max Slides Setting */}
      <div className="space-y-3">
        <label htmlFor="max-slides" className="block text-sm font-medium text-gray-700">
          מספר שקפים מקסימלי במצגת
        </label>
        <input
          id="max-slides"
          type="number"
          min="1"
          max="500"
          value={maxSlides}
          onChange={(e) => handleMaxSlidesChange(e.target.value)}
          className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          placeholder="50"
        />
        <p className="text-sm text-gray-500 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <span>
            מצגות עם מספר שקפים גבוה יותר יידחו בעת העלאה לתכונת שכתוב/תרגום.
            מומלץ: 30-50 שקפים למודלים קטנים, 50-100 למודלים גדולים.
          </span>
        </p>
      </div>

      {/* Warning for large presentations */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">שים לב:</p>
          <p>
            מצגות גדולות (מעל 50 שקפים) עלולות:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>לקחת זמן רב מאוד לעיבוד</li>
            <li>לקבל תוצאות באיכות נמוכה יותר</li>
            <li>לגרום לשגיאות של timeout או memory</li>
            <li>לצרוך כמות גדולה של tokens (עלות גבוהה)</li>
          </ul>
        </div>
      </div>

      {/* Quick presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          הגדרות מהירות
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleMaxSlidesChange("20")}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              maxSlides === 20
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            20
          </button>
          <button
            onClick={() => handleMaxSlidesChange("30")}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              maxSlides === 30
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            30
          </button>
          <button
            onClick={() => handleMaxSlidesChange("50")}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              maxSlides === 50
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            50
          </button>
          <button
            onClick={() => handleMaxSlidesChange("100")}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              maxSlides === 100
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            100
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          בחר מהגדרה מהירה או הזן ערך מותאם אישית
        </p>
      </div>
    </div>
  );
}
