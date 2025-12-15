"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { loginStart, loginSuccess, loginFailure } from "@/store/slices/auth";
import { login as loginApi } from "@/app/(presentation-generator)/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface FirstTimeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirstTimeUserModal({ isOpen, onClose }: FirstTimeUserModalProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("נא להזין שם משתמש");
      return;
    }

    setIsLoading(true);
    setError("");
    dispatch(loginStart());

    try {
      const response = await loginApi(username.trim());

      dispatch(
        loginSuccess({
          userId: response.user_id,
          username: response.username,
          sessionToken: response.session_token,
        })
      );

      // Mark as not first time user
      localStorage.setItem("presenton_returning_user", "true");

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "ההתחברות נכשלה. אנא נסה שוב.";
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold text-white text-center">
            ברוכים הבאים ל-Presenton! 🎉
          </h2>
          <p className="text-white/90 text-center mt-2">
            ליצירת מצגות מדהימות עם AI
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700 block"
              >
                הזן את שם המשתמש שלך
              </label>
              <Input
                id="username"
                type="text"
                placeholder="שם משתמש"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                autoFocus
                minLength={2}
                maxLength={100}
                required
                className="text-right"
              />
              {error && (
                <p className="text-sm text-red-600 text-right">{error}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-right">
                מה תוכלו לעשות:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 text-right">
                <li>✨ ליצור מצגות מקצועיות עם AI</li>
                <li>🎨 לערוך ולעצב את המצגות שלכם</li>
                <li>📤 לייצא ל-PDF או PPTX</li>
                <li>🌐 לתרגם מצגות בקלות</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? "מתחבר..." : "התחל עכשיו"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            שם המשתמש משמש לזיהוי בלבד. לא נדרשת סיסמה.
          </p>
        </div>
      </div>
    </div>
  );
}
