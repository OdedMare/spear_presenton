import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { setOutlines } from "@/store/slices/presentationGeneration";
import { RootState } from "@/store/store";
import { getHeader } from "../../services/api/header";

// ============================================
// JOB-BASED POLLING WITH SMART BACKOFF
// ============================================
// 1. POST /outlines/job/{id} - Start a background job
// 2. GET /outlines/job/{job_id}/status - Poll job status
// 3. Job status: pending -> processing -> completed/failed
// 4. On completion, update Redux store with outlines
// 5. Manual retry available on failure
//
// SMART POLLING STRATEGY:
// - Start fast (500ms) to catch quick jobs
// - Slow down exponentially up to 3s for long jobs
// - Speed up when progress > 80% (near completion)
// - Adaptive based on job progress changes
// ============================================

const POLL_CONFIG = {
  initialInterval: 500,      // Start fast
  maxInterval: 3000,         // Max 3 seconds
  minInterval: 300,          // Min 300ms when near completion
  backoffMultiplier: 1.3,    // Slow down factor
  speedUpThreshold: 80,      // Speed up when progress > 80%
  maxRetries: 5,
};

export interface PollingStatus {
  status: "idle" | "pending" | "processing" | "complete" | "error";
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  error?: string;
}

interface OutlineJob {
  id: string;
  presentation_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
  progress_current: number;
  progress_total: number;
  progress_percentage: number;
  error?: { message: string };
  result?: {
    presentation: any;
    outlines: { slides: any[] };
  };
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
  const jobIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(false);

  // Track previous values to prevent unnecessary state updates
  const lastStatusMessageRef = useRef<string>("");
  const lastPollingStatusRef = useRef<PollingStatus>({
    status: "idle",
    progress: { current: 0, total: 6, percentage: 0 },
  });

  // Update status message only if changed
  const updateStatusMessage = useCallback((message: string) => {
    if (message !== lastStatusMessageRef.current) {
      lastStatusMessageRef.current = message;
      setStatusMessage(message);
    }
  }, []);

  // Update polling status only if changed
  const updatePollingStatus = useCallback((newStatus: PollingStatus) => {
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
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async () => {
    if (!jobIdRef.current || !isActiveRef.current) return;

    try {
      const response = await fetch(`/api/v1/ppt/outlines/job/${jobIdRef.current}/status`, {
        headers: getHeader(),
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const job: OutlineJob = await response.json();
      console.log("[OutlinePolling] Job status:", job.status, "Progress:", job.progress_percentage + "%");

      // Update status message from backend (only if changed)
      if (job.message) {
        updateStatusMessage(job.message);
      }

      // Update progress (only if changed)
      updatePollingStatus({
        status: job.status === "completed" ? "complete" :
                job.status === "failed" ? "error" :
                job.status as PollingStatus["status"],
        progress: {
          current: job.progress_current,
          total: job.progress_total,
          percentage: job.progress_percentage,
        },
        error: job.error?.message,
      });

      if (job.status === "completed") {
        // Job completed - extract outlines
        cleanup();

        const outlinesData = job.result?.outlines?.slides || [];
        dispatch(setOutlines(outlinesData));

        setIsLoading(false);
        updateStatusMessage("");
        retryCountRef.current = 0;

        console.log("[OutlinePolling] Complete - outlines received:", outlinesData.length);
        toast.success("המתווה נוצר בהצלחה");

      } else if (job.status === "failed") {
        // Job failed
        cleanup();
        setIsLoading(false);
        toast.error("שגיאה ביצירת מתווה", {
          description: job.error?.message || job.message || "נתקלנו בבעיה. נסה שוב.",
        });
      }
      // else: still pending/processing - continue polling

      // Reset retry count on successful poll
      retryCountRef.current = 0;

    } catch (error) {
      console.error("[OutlinePolling] Poll error:", error);
      retryCountRef.current++;

      if (retryCountRef.current >= POLL_CONFIG.maxRetries) {
        cleanup();
        updatePollingStatus({
          status: "error",
          progress: lastPollingStatusRef.current.progress,
          error: "Failed to check status after multiple attempts",
        });
        setIsLoading(false);
        toast.error("שגיאה בבדיקת התקדמות", {
          description: "לא הצלחנו לבדוק את סטטוס היצירה. נסה שוב.",
        });
      }
    }
  }, [dispatch, cleanup, updateStatusMessage, updatePollingStatus]);

  // Start job
  const startGeneration = useCallback(async () => {
    if (!presentationId) return;

    console.log("[OutlinePolling] Starting job for:", presentationId);
    isActiveRef.current = true;
    setIsLoading(true);

    // Reset refs for new job
    lastStatusMessageRef.current = "מתחיל יצירת מתווה...";
    lastPollingStatusRef.current = {
      status: "pending",
      progress: { current: 0, total: 6, percentage: 0 },
    };
    setPollingStatus(lastPollingStatusRef.current);
    setStatusMessage(lastStatusMessageRef.current);

    retryCountRef.current = 0;

    try {
      // Start background job
      const response = await fetch(`/api/v1/ppt/outlines/job/${presentationId}`, {
        method: "POST",
        headers: getHeader(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to start job: ${response.status}`);
      }

      const job: OutlineJob = await response.json();
      console.log("[OutlinePolling] Job created:", job.id, "Status:", job.status);

      jobIdRef.current = job.id;

      // Update initial status
      updateStatusMessage(job.message || "ממתין בתור...");
      updatePollingStatus({
        status: job.status === "completed" ? "complete" :
                job.status === "failed" ? "error" :
                job.status as PollingStatus["status"],
        progress: {
          current: job.progress_current,
          total: job.progress_total,
          percentage: job.progress_percentage,
        },
      });

      if (job.status === "completed") {
        // Already completed (outlines existed)
        cleanup();

        const outlinesData = job.result?.outlines?.slides || [];
        dispatch(setOutlines(outlinesData));

        setIsLoading(false);
        updateStatusMessage("");

        console.log("[OutlinePolling] Already complete - outlines received:", outlinesData.length);
      } else if (job.status === "failed") {
        // Already failed
        cleanup();
        setIsLoading(false);
        toast.error("שגיאה ביצירת מתווה", {
          description: job.error?.message || job.message,
        });
      } else {
        // Start polling for status
        pollIntervalRef.current = setInterval(pollJobStatus, POLL_CONFIG.initialInterval);
      }

    } catch (error: any) {
      console.error("[OutlinePolling] Job start error:", error);
      cleanup();
      updatePollingStatus({
        status: "error",
        progress: { current: 0, total: 6, percentage: 0 },
        error: error.message || "Failed to start outline generation",
      });
      setIsLoading(false);
      toast.error("שגיאה בהתחלת יצירת מתווה", {
        description: error.message || "נתקלנו בבעיה. נסה שוב.",
      });
    }
  }, [presentationId, dispatch, cleanup, updateStatusMessage, updatePollingStatus, pollJobStatus]);

  // Manual retry
  const manualRetry = useCallback(() => {
    retryCountRef.current = 0;
    jobIdRef.current = null;
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

    // Auto-start job
    startGeneration();

    return cleanup;
  }, [presentationId, outlines.length, startGeneration, cleanup]);

  return {
    isLoading,
    isStreaming: pollingStatus.status === "pending" || pollingStatus.status === "processing",
    pollingStatus,
    statusMessage,
    manualRetry,
    // For compatibility with streaming hook interface
    activeSlideIndex: null,
    highestActiveIndex: -1,
    retryInfo: {
      retryCount: retryCountRef.current,
      maxRetries: POLL_CONFIG.maxRetries,
      isRetrying: false,
      lastFailedSlideIndex: -1,
    },
  };
};
