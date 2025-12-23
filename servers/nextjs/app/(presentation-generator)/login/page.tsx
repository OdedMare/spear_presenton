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

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    logger.info("Login page view", { event_type: "login_page_view" });
    // Redirect if already authenticated
    if (isAuthenticated) {
      logger.info("Already authenticated, redirecting to dashboard", {
        event_type: "login_redirect",
        reason: "already_authenticated",
      });
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      logger.warn("Login submit blocked: empty username", {
        event_type: "login_submit_blocked",
        reason: "empty_username",
      });
      return;
    }

    logger.info(`Login attempt for user: ${trimmedUsername}`, {
      event_type: "login_submit_start",
      username: trimmedUsername,
      username_length: trimmedUsername.length,
    });
    dispatch(loginStart());
    const requestStart = Date.now();

    try {
      logger.info("Login request sent", {
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

      logger.info(`Login successful: ${response.username}`, {
        event_type: "login_request_success",
        user_id: response.user_id,
        username: response.username,
        duration_ms: durationMs,
      });
      // Redirect to dashboard
      logger.info("Login redirect to dashboard", {
        event_type: "login_redirect",
        reason: "login_success",
      });
      router.push("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "התחברות נכשלה. אנא נסה שנית.";
      const durationMs = Date.now() - requestStart;
      logger.error(`Login failed for ${trimmedUsername}: ${errorMessage}`, {
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
                  placeholder="חיבור עם יוזר נס הרים או וואןאמן"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  minLength={2}
                  maxLength={100}
                  required
                  className="h-12 text-base font-inter"
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800 font-inter">{error}</p>
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
