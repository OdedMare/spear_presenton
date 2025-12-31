import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  clearPresentationData,
  setPresentationData,
  setStreaming,
} from "@/store/slices/presentationGeneration";
import { getHeader } from "../../services/api/header";
import { MixpanelEvent, trackEvent } from "@/utils/mixpanel";

// ============================================
// JOB-BASED POLLING FOR PRESENTATION GENERATION
// ============================================
// 1. POST /presentation/job/{id} - Start a background job
// 2. GET /presentation/job/{job_id}/status - Poll job status
// 3. Job status: pending -> processing -> completed/failed
// 4. On completion, update Redux store with presentation data
// 5. Manual retry available on failure
//
// SMART POLLING STRATEGY:
// - Start fast (500ms) to catch quick jobs
// - Slow down exponentially up to 3s for long jobs
// - Speed up when progress > 80% (near completion)
// ============================================

const POLL_CONFIG = {
  initialInterval: 500,      // Start fast
  maxInterval: 3000,         // Max 3 seconds
  minInterval: 300,          // Min 300ms when near completion
  backoffMultiplier: 1.3,    // Slow down factor
  speedUpThreshold: 80,      // Speed up when progress > 80%
  maxRetries: 5,
};

export interface PresentationPollingStatus {
  status: "idle" | "pending" | "processing" | "complete" | "error";
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  error?: string;
}

interface PresentationJob {
  id: string;
  presentation_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
  progress_current: number;
  progress_total: number;
  progress_percentage: number;
  error?: { message: string };
  result?: any; // Full presentation data with slides
}

export const usePresentationPolling = (
  presentationId: string,
  shouldStart: boolean, // Whether to start polling (replaces stream parameter)
  setLoading: (loading: boolean) => void,
  setError: (error: boolean) => void,
  fetchUserSlides: () => void
) => {
  const dispatch = useDispatch();

  const [pollingStatus, setPollingStatus] = useState<PresentationPollingStatus>({
    status: "idle",
    progress: { current: 0, total: 0, percentage: 0 },
  });
  const [statusMessage, setStatusMessage] = useState<string>("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(false);
  const currentIntervalRef = useRef(POLL_CONFIG.initialInterval);
  const lastProgressRef = useRef(0);

  // Track previous values to prevent unnecessary state updates
  const lastStatusMessageRef = useRef<string>("");
  const lastPollingStatusRef = useRef<PresentationPollingStatus>({
    status: "idle",
    progress: { current: 0, total: 0, percentage: 0 },
  });

  // Update status message only if changed
  const updateStatusMessage = useCallback((message: string) => {
    if (message !== lastStatusMessageRef.current) {
      lastStatusMessageRef.current = message;
      setStatusMessage(message);
    }
  }, []);

  // Update polling status only if changed
  const updatePollingStatus = useCallback((newStatus: PresentationPollingStatus) => {
    const prev = lastPollingStatusRef.current;
    if (
      prev.status !== newStatus.status ||
      prev.progress.current !== newStatus.progress.current ||
      prev.progress.total !== newStatus.progress.total ||
      prev.progress.percentage !== newStatus.progress.percentage ||
      prev.error !== newStatus.error
    ) {
      lastPollingStatusRef.current = newStatus;
      setPollingStatus(newStatus);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isActiveRef.current = false;
    jobIdRef.current = null;
    currentIntervalRef.current = POLL_CONFIG.initialInterval;
    lastProgressRef.current = 0;
  }, []);

  // Calculate next poll interval based on progress
  const calculateNextInterval = useCallback((progress: number): number => {
    // Speed up near completion
    if (progress >= POLL_CONFIG.speedUpThreshold) {
      return POLL_CONFIG.minInterval;
    }

    // If progress changed, keep current interval
    if (progress > lastProgressRef.current) {
      lastProgressRef.current = progress;
      return currentIntervalRef.current;
    }

    // No progress - slow down with backoff
    const newInterval = Math.min(
      currentIntervalRef.current * POLL_CONFIG.backoffMultiplier,
      POLL_CONFIG.maxInterval
    );
    currentIntervalRef.current = newInterval;
    return newInterval;
  }, []);

  // Schedule next poll with adaptive interval
  const scheduleNextPoll = useCallback((pollFn: () => Promise<void>, progress: number) => {
    if (!isActiveRef.current) return;

    const interval = calculateNextInterval(progress);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setTimeout(async () => {
      await pollFn();
    }, interval) as unknown as NodeJS.Timeout;
  }, [calculateNextInterval]);

  // Poll for job status
  const pollJobStatus = useCallback(async () => {
    if (!jobIdRef.current || !isActiveRef.current) return;

    try {
      const response = await fetch(`/api/v1/ppt/presentation/job/${jobIdRef.current}/status`, {
        headers: getHeader(),
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const job: PresentationJob = await response.json();
      console.log("[PresentationPolling] Job status:", job.status, "Progress:", job.progress_percentage + "%");

      // Update status message from backend (only if changed)
      if (job.message) {
        updateStatusMessage(job.message);
      }

      // Update progress (only if changed)
      updatePollingStatus({
        status: job.status === "completed" ? "complete" :
                job.status === "failed" ? "error" :
                job.status as PresentationPollingStatus["status"],
        progress: {
          current: job.progress_current,
          total: job.progress_total,
          percentage: job.progress_percentage,
        },
        error: job.error?.message,
      });

      if (job.status === "completed") {
        // Job completed - extract presentation data
        cleanup();

        if (job.result) {
          dispatch(setPresentationData(job.result));
        }

        dispatch(setStreaming(false));
        setLoading(false);
        updateStatusMessage("");
        retryCountRef.current = 0;

        // Remove stream parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("stream");
        window.history.replaceState({}, "", newUrl.toString());

        console.log("[PresentationPolling] Complete - slides received:", job.result?.slides?.length || 0);
        toast.success("🎉 המצגת מוכנה! אפשר להתחיל להרשים.");

      } else if (job.status === "failed") {
        // Job failed
        cleanup();
        dispatch(setStreaming(false));
        setLoading(false);
        setError(true);

        // Build error message with suggestion if available
        let errorDescription = job.error?.message || job.message || "נתקלנו בבעיה. נסה שוב.";

        toast.error("😔 משהו השתבש", {
          description: errorDescription,
          duration: 10000,
        });
      } else {
        // Still pending/processing - schedule next poll with smart interval
        scheduleNextPoll(pollJobStatus, job.progress_percentage);
      }

      // Reset retry count on successful poll
      retryCountRef.current = 0;

    } catch (error) {
      console.error("[PresentationPolling] Poll error:", error);
      retryCountRef.current++;

      if (retryCountRef.current >= POLL_CONFIG.maxRetries) {
        cleanup();
        updatePollingStatus({
          status: "error",
          progress: lastPollingStatusRef.current.progress,
          error: "Failed to check status after multiple attempts",
        });
        dispatch(setStreaming(false));
        setLoading(false);
        setError(true);
        toast.error("🔌 בעיית חיבור", {
          description: "לא הצלחנו לבדוק את סטטוס היצירה. נסה שוב.",
        });
      } else {
        // Retry with backoff
        scheduleNextPoll(pollJobStatus, lastPollingStatusRef.current.progress.percentage);
      }
    }
  }, [dispatch, cleanup, setLoading, setError, updateStatusMessage, updatePollingStatus, scheduleNextPoll]);

  // Start job
  const startGeneration = useCallback(async () => {
    if (!presentationId) return;

    console.log("[PresentationPolling] Starting job for:", presentationId);
    isActiveRef.current = true;
    dispatch(setStreaming(true));
    dispatch(clearPresentationData());

    // Reset refs for new job
    lastStatusMessageRef.current = "🚀 מתחילים לבשל את המצגת שלך...";
    lastPollingStatusRef.current = {
      status: "pending",
      progress: { current: 0, total: 0, percentage: 0 },
    };
    setPollingStatus(lastPollingStatusRef.current);
    setStatusMessage(lastStatusMessageRef.current);

    retryCountRef.current = 0;
    currentIntervalRef.current = POLL_CONFIG.initialInterval;
    lastProgressRef.current = 0;

    trackEvent(MixpanelEvent.Presentation_Stream_API_Call);

    try {
      // Start background job
      const response = await fetch(`/api/v1/ppt/presentation/job/${presentationId}`, {
        method: "POST",
        headers: getHeader(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to start job: ${response.status}`);
      }

      const job: PresentationJob = await response.json();
      console.log("[PresentationPolling] Job created:", job.id, "Status:", job.status);

      jobIdRef.current = job.id;

      // Update initial status
      updateStatusMessage(job.message || "ממתין בתור כמו שקף מנומס...");
      updatePollingStatus({
        status: job.status === "completed" ? "complete" :
                job.status === "failed" ? "error" :
                job.status as PresentationPollingStatus["status"],
        progress: {
          current: job.progress_current,
          total: job.progress_total,
          percentage: job.progress_percentage,
        },
      });

      if (job.status === "completed") {
        // Already completed
        cleanup();

        if (job.result) {
          dispatch(setPresentationData(job.result));
        }

        dispatch(setStreaming(false));
        setLoading(false);
        updateStatusMessage("");

        // Remove stream parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("stream");
        window.history.replaceState({}, "", newUrl.toString());

        console.log("[PresentationPolling] Already complete - slides received:", job.result?.slides?.length || 0);
      } else if (job.status === "failed") {
        // Already failed
        cleanup();
        dispatch(setStreaming(false));
        setLoading(false);
        setError(true);
        toast.error("שגיאה ביצירת מצגת", {
          description: job.error?.message || job.message || "נתקלנו בבעיה. נסה שוב.",
        });
      } else {
        // Start polling for status with smart interval
        scheduleNextPoll(pollJobStatus, 0);
      }

    } catch (error: any) {
      console.error("[PresentationPolling] Job start error:", error);
      cleanup();
      updatePollingStatus({
        status: "error",
        progress: { current: 0, total: 0, percentage: 0 },
        error: error.message || "Failed to start presentation generation",
      });
      dispatch(setStreaming(false));
      setLoading(false);
      setError(true);
      toast.error("שגיאה בהתחלת יצירת מצגת", {
        description: error.message || "נתקלנו בבעיה. נסה שוב.",
      });
    }
  }, [presentationId, dispatch, cleanup, setLoading, setError, updateStatusMessage, updatePollingStatus, pollJobStatus, scheduleNextPoll]);

  // Effect to auto-start if needed
  useEffect(() => {
    if (!shouldStart) {
      // Not starting - fetch existing slides instead
      fetchUserSlides();
      return;
    }

    // Start job
    startGeneration();

    return cleanup;
  }, [presentationId, shouldStart, startGeneration, cleanup, fetchUserSlides]);

  return { statusMessage, pollingStatus };
};
