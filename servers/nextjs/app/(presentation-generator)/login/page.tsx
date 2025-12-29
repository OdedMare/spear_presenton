"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { loginStart, loginSuccess, loginFailure } from "@/store/slices/auth";
import { login as loginApi } from "../services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Sparkles } from "lucide-react";
import { logger } from "@/utils/logger";

type ClientLogLevel = "debug" | "info" | "warn" | "error";

const logClientEvent = (
  level: ClientLogLevel,
  message: string,
  extra: Record<string, any> = {}
) => {
  switch (level) {
    case "debug":
      logger.debug(message, extra);
      break;
    case "warn":
      logger.warn(message, extra);
      break;
    case "error":
      logger.error(message, extra);
      break;
    default:
      logger.info(message, extra);
      break;
  }

  const payload = {
    level,
    message,
    event_type:
      typeof extra.event_type === "string" ? extra.event_type : undefined,
    extra,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    timestamp: new Date().toISOString(),
  };

  void fetch("/api/client-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    logClientEvent("info", "Login page view", {
      event_type: "login_page_view",
    });
  }, []);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      logClientEvent("info", "Already authenticated, redirecting to dashboard", {
        event_type: "login_redirect",
        reason: "already_authenticated",
      });
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validateUsername = (username: string): string | null => {
    const trimmed = username.trim();

    if (!trimmed) {
      return "שם המשתמש לא יכול להיות רק";
    }

    const isOaUser = trimmed.startsWith("Oa");
    const isNesharimUser = trimmed.endsWith("d8200.mil");

    if (!isOaUser && !isNesharimUser) {
      return "נא להתחבר עם יוזר oa תקין או יוזר נס הרים תקין";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    // Client-side validation
    const validationErr = validateUsername(trimmedUsername);
    if (validationErr) {
      setValidationError(validationErr);
      logClientEvent("warn", "Login submit blocked: validation failed", {
        event_type: "login_submit_blocked",
        reason: "validation_failed",
        validation_error: validationErr,
      });
      return;
    }

    // Clear validation error on successful validation
    setValidationError("");

    logClientEvent("info", `Login attempt for user: ${trimmedUsername}`, {
      event_type: "login_submit_start",
      username: trimmedUsername,
      username_length: trimmedUsername.length,
    });
    dispatch(loginStart());
    const requestStart = Date.now();

    try {
      logClientEvent("info", "Login request sent", {
        event_type: "login_request_sent",
        username: trimmedUsername,
      });
      const response = await loginApi(trimmedUsername);
      const durationMs = Date.now() - requestStart;

      dispatch(
        loginSuccess({
          userId: response.user_id,
          username: response.username,
          sessionToken: response.session_token,
        })
      );

      logClientEvent("info", `Login successful: ${response.username}`, {
        event_type: "login_request_success",
        user_id: response.user_id,
        username: response.username,
        duration_ms: durationMs,
      });
      // Redirect to dashboard
      logClientEvent("info", "Login redirect to dashboard", {
        event_type: "login_redirect",
        reason: "login_success",
      });
      router.push("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "התחברות נכשלה. אנא נסה שנית.";
      const durationMs = Date.now() - requestStart;
      logClientEvent("error", `Login failed for ${trimmedUsername}: ${errorMessage}`, {
        event_type: "login_request_failed",
        username: trimmedUsername,
        duration_ms: durationMs,
        error_message: errorMessage,
      });
      dispatch(
        loginFailure(
          errorMessage
        )
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9E8F8]">
      {/* Header with logo - matching app style */}
      <div className="bg-[#5146E5] w-full shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-4">
            <img
              src="/logo-white.png"
              alt="Presenton logo"
              className="h-16"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Welcome card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="bg-[#5146E5] bg-opacity-10 rounded-full p-3">
                  <Sparkles className="w-8 h-8 text-[#5146E5]" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 font-roboto">
                ברוכים הבאים
              </h1>
              <p className="text-gray-600 font-inter">
                הכנס את שם המשתמש שלך כדי להמשיך
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 font-inter"
                >
                  שם משתמש
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="לדוגמה: ugda91_odedm@d8200.mil או Oa212696678"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Clear validation error when user types
                    if (validationError) {
                      setValidationError("");
                    }
                  }}
                  disabled={isLoading}
                  autoFocus
                  minLength={2}
                  maxLength={100}
                  required
                  className="h-12 text-base font-inter"
                />
              </div>

              {(validationError || error) && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800 font-inter">
                    {validationError || error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-[#5146E5] hover:bg-[#5146E5]/90 text-white font-medium text-base font-inter"
                disabled={isLoading || !username.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    מתחבר...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    התחבר
                  </span>
                )}
              </Button>
            </form>

            {/* Footer info */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center font-inter" dir="rtl">
                פלטפורמה ליצירת מצגות בעזרת בינה מלאכותית
              </p>
            </div>
          </div>

          {/* Additional info below card */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-inter" dir="rtl">
              אין צורך בסיסמה - רק שם משתמש
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
