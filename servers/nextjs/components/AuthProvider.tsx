"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  loginSuccess,
  logout,
  setAuthLoading,
} from "@/store/slices/auth";
import { validateSession } from "@/app/(presentation-generator)/services/api/auth";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, sessionToken } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const checkAuth = async () => {
      // Check if authentication is required
      const authRequired =
        process.env.NEXT_PUBLIC_REQUIRE_AUTH?.toLowerCase() === "true";

      if (!authRequired) {
        dispatch(setAuthLoading(false));
        return;
      }

      // Try to restore session from localStorage
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("sessionToken")
          : null;

      if (storedToken) {
        try {
          const response = await validateSession(storedToken);

          if (response.valid && response.user_id && response.username) {
            dispatch(
              loginSuccess({
                userId: response.user_id,
                username: response.username,
                sessionToken: storedToken,
              })
            );
          } else {
            // Invalid session, clear it
            dispatch(logout());
            if (!PUBLIC_ROUTES.includes(pathname)) {
              router.push("/login");
            }
          }
        } catch (error) {
          console.error("Session validation failed:", error);
          dispatch(logout());
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push("/login");
          }
        }
      } else {
        // No stored token
        dispatch(setAuthLoading(false));
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push("/login");
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Redirect logic based on authentication state
    const authRequired =
      process.env.NEXT_PUBLIC_REQUIRE_AUTH?.toLowerCase() === "true";

    if (!authRequired || isLoading) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    } else if (isAuthenticated && isPublicRoute) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state while checking auth
  if (
    process.env.NEXT_PUBLIC_REQUIRE_AUTH?.toLowerCase() === "true" &&
    isLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
