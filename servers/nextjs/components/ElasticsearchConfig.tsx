"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Database } from "lucide-react";
import { LLMConfig } from "@/types/llm_config";

interface ElasticsearchConfigProps {
  llmConfig: LLMConfig;
  setLlmConfig: (config: LLMConfig) => void;
}

export default function ElasticsearchConfig({
  llmConfig,
  setLlmConfig,
}: ElasticsearchConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof LLMConfig, value: string | boolean) => {
    setLlmConfig({
      ...llmConfig,
      [field]: value,
    });
  };

  return (
    <div>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-gray-700" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              הגדרות Elasticsearch
            </h3>
            <p className="text-sm text-gray-600">
              הגדר לוגים מרוכזים עם Elasticsearch
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Elasticsearch URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elasticsearch URL
            </label>
            <input
              type="text"
              placeholder="http://elasticsearch:9200"
              className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={llmConfig.ELASTICSEARCH_URL || ""}
              onChange={(e) =>
                handleInputChange("ELASTICSEARCH_URL", e.target.value)
              }
            />
            <p className="mt-2 text-sm text-gray-500">
              כתובת ה-Elasticsearch שלך. השאר ריק כדי להשבית לוגים ל-Elasticsearch.
            </p>
          </div>

          {/* Elasticsearch User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם משתמש (אופציונלי)
            </label>
            <input
              type="text"
              placeholder="elastic"
              className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={llmConfig.ELASTICSEARCH_USER || ""}
              onChange={(e) =>
                handleInputChange("ELASTICSEARCH_USER", e.target.value)
              }
            />
            <p className="mt-2 text-sm text-gray-500">
              נדרש רק אם ה-Elasticsearch שלך מוגן באימות.
            </p>
          </div>

          {/* Elasticsearch Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה (אופציונלי)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={llmConfig.ELASTICSEARCH_PASSWORD || ""}
              onChange={(e) =>
                handleInputChange("ELASTICSEARCH_PASSWORD", e.target.value)
              }
            />
            <p className="mt-2 text-sm text-gray-500">
              נדרש רק אם ה-Elasticsearch שלך מוגן באימות.
            </p>
          </div>

          {/* Elasticsearch Index Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קידומת אינדקס
            </label>
            <input
              type="text"
              placeholder="presenton-logs"
              className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={llmConfig.ELASTICSEARCH_INDEX_PREFIX || "presenton-logs"}
              onChange={(e) =>
                handleInputChange("ELASTICSEARCH_INDEX_PREFIX", e.target.value)
              }
            />
            <p className="mt-2 text-sm text-gray-500">
              הלוגים יישמרו באינדקסים בשם: {"{prefix}"}-YYYY.MM.DD
            </p>
          </div>

          {/* Log Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              רמת לוג
            </label>
            <select
              className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={llmConfig.LOG_LEVEL || "INFO"}
              onChange={(e) => handleInputChange("LOG_LEVEL", e.target.value)}
            >
              <option value="DEBUG">DEBUG (מפורט מאוד)</option>
              <option value="INFO">INFO (רגיל)</option>
              <option value="WARNING">WARNING (אזהרות בלבד)</option>
              <option value="ERROR">ERROR (שגיאות בלבד)</option>
              <option value="CRITICAL">CRITICAL (קריטי בלבד)</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              בחר את רמת הפירוט של הלוגים.
            </p>
          </div>

          {/* Disable SSL Verify */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="disable_ssl_verify"
              checked={llmConfig.DISABLE_SSL_VERIFY || false}
              onChange={(e) =>
                handleInputChange("DISABLE_SSL_VERIFY", e.target.checked)
              }
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label
                htmlFor="disable_ssl_verify"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                השבת אימות SSL
              </label>
              <p className="text-sm text-gray-500 mt-1">
                הפעל רק אם אתה משתמש בתעודות SSL חתומות עצמית.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              מידע נוסף
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• הלוגים נשמרים באינדקסים יומיים ל-Elasticsearch</li>
              <li>• תומך באימות Basic Authentication</li>
              <li>• תומך ב-SSL/TLS</li>
              <li>• במקרה של כשלון, הלוגים ימשיכו רק לקונסול</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
