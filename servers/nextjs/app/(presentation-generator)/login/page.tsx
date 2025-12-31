"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { loginStart, loginSuccess, loginFailure } from "@/store/slices/auth";
import { login as loginApi } from "../services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
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
      return "שם המשתמש לא יכול להיות ריק";
    }

    const isOaUser = trimmed.startsWith("Oa");
    const isNesharimUser = trimmed.endsWith("d8200.mil");

    if (!isOaUser && !isNesharimUser) {
      return "נא להתחבר עם יוזר ONE-AMAN תקין או יוזר נס הרים תקין";
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
      const errorMessage =
        err instanceof Error ? err.message : "התחברות נכשלה. אנא נסה שנית.";
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
      {/* Header with logo */}
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
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              ברוכים הבאים
            </h1>
            <p className="text-gray-600">
              הכנס את שם המשתמש שלך כדי להמשיך
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700"
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
                  if (validationError) {
                    setValidationError("");
                  }
                }}
                disabled={isLoading}
                autoFocus
                minLength={2}
                maxLength={100}
                required
                className="h-12 text-base"
              />
            </div>

            {(validationError || error) && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">
                  {validationError || error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#5146E5] hover:bg-[#5146E5]/90 text-white font-medium text-base"
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
        </div>
      </div>
    </div>
  );
}
