"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

/**
 * Hook to detect first-time users and show welcome modal
 * Returns whether to show the modal
 */
export function useFirstTimeUser() {
  const [showModal, setShowModal] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

  useEffect(() => {
    console.log('[FirstTimeUser] Hook running:', {
      requireAuth,
      isAuthenticated,
      envVar: process.env.NEXT_PUBLIC_REQUIRE_AUTH
    });

    // Only check for first-time users if auth is enabled
    if (!requireAuth) {
      console.log('[FirstTimeUser] Auth is disabled, skipping modal');
      return;
    }

    // Check if user is already authenticated
    if (isAuthenticated) {
      console.log('[FirstTimeUser] User already authenticated, skipping modal');
      return;
    }

    // Check localStorage to see if user has visited before
    const isReturningUser = localStorage.getItem("presenton_returning_user");
    console.log('[FirstTimeUser] Checking returning user flag:', isReturningUser);

    // Show modal only for first-time users (no localStorage flag)
    if (!isReturningUser) {
      console.log('[FirstTimeUser] First time user detected, showing modal');
      setShowModal(true);
    } else {
      console.log('[FirstTimeUser] Returning user, not showing modal');
    }
  }, [requireAuth, isAuthenticated]);

  const closeModal = () => {
    setShowModal(false);
  };

  return { showModal, closeModal };
}
