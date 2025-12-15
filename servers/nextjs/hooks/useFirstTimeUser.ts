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
    // Only check for first-time users if auth is enabled
    if (!requireAuth) {
      return;
    }

    // Check if user is already authenticated
    if (isAuthenticated) {
      return;
    }

    // Check localStorage to see if user has visited before
    const isReturningUser = localStorage.getItem("presenton_returning_user");

    // Show modal only for first-time users (no localStorage flag)
    if (!isReturningUser) {
      setShowModal(true);
    }
  }, [requireAuth, isAuthenticated]);

  const closeModal = () => {
    setShowModal(false);
  };

  return { showModal, closeModal };
}
