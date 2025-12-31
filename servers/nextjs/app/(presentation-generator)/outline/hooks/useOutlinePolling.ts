import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { setOutlines } from "@/store/slices/presentationGeneration";
import { RootState } from "@/store/store";
import { getHeader } from "../../services/api/header";

// ============================================
// POLLING CONFIGURATION
// ============================================
// 1. Initial call triggers outline generation
// 2. Poll status every 2 seconds
// 3. On completion, update Redux store
// 4. Automatic retry on network errors
// 5. Manual retry available on failure
// ============================================

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_RETRIES = 3;

export interface PollingStatus {
  status: "idle" | "generating" | "polling" | "complete" | "error";
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  error?: string;
}

export const useOutlinePolling = (presentationId: string | null) => {
  const dispatch = useDispatch();
  const { outlines } = useSelector((state: RootState) => state.presentationGeneration);

  const [isLoading, setIsLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>({
    status: "idle",
    progress: { current: 0, total: 6, percentage: 0 },
  });
  const [statusMessage, setStatusMessage] = useState<string>("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  // Poll for status
  const pollStatus = useCallback(async () => {
    if (!presentationId || !isActiveRef.current) return;

    try {
      const response = await fetch(`/api/v1/ppt/outlines/status/${presentationId}`, {
        headers: getHeader(),
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[OutlinePolling] Status:", data.status);

      if (data.status === "complete") {
        // Outlines are ready
        cleanup();

        const outlinesData = data.outlines?.slides || [];
        dispatch(setOutlines(outlinesData));

        setPollingStatus({
          status: "complete",
          progress: { current: outlinesData.length, total: outlinesData.length, percentage: 100 },
        });
        setIsLoading(false);
        setStatusMessage("");
        retryCountRef.current = 0;

        console.log("[OutlinePolling] Complete - outlines received:", outlinesData.length);
      } else {
        // Still pending - continue polling
        setPollingStatus({
          status: "polling",
          progress: data.progress || { current: 0, total: 6, percentage: 0 },
        });
        setStatusMessage("בודק התקדמות...");
      }

      // Reset retry count on successful poll
      retryCountRef.current = 0;

    } catch (error) {
      console.error("[OutlinePolling] Poll error:", error);
      retryCountRef.current++;

      if (retryCountRef.current >= MAX_RETRIES) {
        cleanup();
        setPollingStatus({
          status: "error",
          progress: pollingStatus.progress,
          error: "Failed to check status after multiple attempts",
        });
        setIsLoading(false);
        toast.error("שגיאה בבדיקת התקדמות", {
          description: "לא הצלחנו לבדוק את סטטוס היצירה. נסה שוב.",
        });
      }
    }
  }, [presentationId, dispatch, cleanup, pollingStatus.progress]);

  // Start generation
  const startGeneration = useCallback(async () => {
    if (!presentationId) return;

    console.log("[OutlinePolling] Starting generation for:", presentationId);
    isActiveRef.current = true;
    setIsLoading(true);
    setPollingStatus({
      status: "generating",
      progress: { current: 0, total: 6, percentage: 0 },
    });
    setStatusMessage("מתחיל יצירת מתווה...");
    retryCountRef.current = 0;

    try {
      // Call generate endpoint
      const response = await fetch(`/api/v1/ppt/outlines/generate/${presentationId}`, {
        method: "POST",
        headers: getHeader(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[OutlinePolling] Generation response:", data.status);

      if (data.status === "complete") {
        // Outlines generated immediately
        cleanup();

        const outlinesData = data.outlines?.slides || [];
        dispatch(setOutlines(outlinesData));

        setPollingStatus({
          status: "complete",
          progress: { current: outlinesData.length, total: outlinesData.length, percentage: 100 },
        });
        setIsLoading(false);
        setStatusMessage("");

        console.log("[OutlinePolling] Complete - outlines received:", outlinesData.length);
      } else {
        // Start polling for status
        setStatusMessage("מייצר מתווה... אנא המתן");
        setPollingStatus({
          status: "polling",
          progress: { current: 0, total: 6, percentage: 0 },
        });

        // Start polling interval
        pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL);
      }

    } catch (error: any) {
      console.error("[OutlinePolling] Generation error:", error);
      cleanup();
      setPollingStatus({
        status: "error",
        progress: { current: 0, total: 6, percentage: 0 },
        error: error.message || "Failed to generate outlines",
      });
      setIsLoading(false);
      toast.error("שגיאה ביצירת מתווה", {
        description: error.message || "נתקלנו בבעיה. נסה שוב.",
      });
    }
  }, [presentationId, dispatch, cleanup, pollStatus]);

  // Manual retry
  const manualRetry = useCallback(() => {
    retryCountRef.current = 0;
    startGeneration();
  }, [startGeneration]);

  // Effect to auto-start if needed
  useEffect(() => {
    if (!presentationId || outlines.length > 0) {
      // Outlines already exist or no presentation ID
      setIsLoading(false);
      setPollingStatus({
        status: outlines.length > 0 ? "complete" : "idle",
        progress: { current: outlines.length, total: outlines.length || 6, percentage: outlines.length > 0 ? 100 : 0 },
      });
      return;
    }

    // Auto-start generation
    startGeneration();

    return cleanup;
  }, [presentationId, outlines.length, startGeneration, cleanup]);

  return {
    isLoading,
    isStreaming: pollingStatus.status === "generating" || pollingStatus.status === "polling",
    pollingStatus,
    statusMessage,
    manualRetry,
    // For compatibility with streaming hook interface
    activeSlideIndex: null,
    highestActiveIndex: -1,
    retryInfo: {
      retryCount: retryCountRef.current,
      maxRetries: MAX_RETRIES,
      isRetrying: false,
      lastFailedSlideIndex: -1,
    },
  };
};
