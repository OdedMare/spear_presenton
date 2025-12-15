"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { loginStart, loginSuccess, loginFailure } from "@/store/slices/auth";
import { login as loginApi } from "../services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      return;
    }

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

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      dispatch(
        loginFailure(
          err instanceof Error ? err.message : "Login failed. Please try again."
        )
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Presenton
          </CardTitle>
          <CardDescription className="text-center">
            Enter your username to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="הכנס את שם המשתמש שלך Oa/nasharim"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? "Logging in..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
