import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { setOutlines } from "@/store/slices/presentationGeneration";
import { jsonrepair } from "jsonrepair";
import { RootState } from "@/store/store";

// ============================================
// RETRY RULES & CONFIGURATION
// ============================================
// 1. Automatic retries: Up to 3 attempts with exponential backoff (1s, 2s, 4s)
// 2. Manual retry: Available after automatic retries are exhausted
// 3. Retry from failure: Resumes from slide N (where connection was lost)
// 4. No retry on server errors: If backend explicitly sends error, don't auto-retry
// 5. Reset on success: Any successful data reception resets the retry counter
// ============================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

export interface RetryInfo {
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  lastFailedSlideIndex: number;
}

export const useOutlineStreaming = (presentationId: string | null) => {
  const dispatch = useDispatch();
  const { outlines } = useSelector((state: RootState) => state.presentationGeneration);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [highestActiveIndex, setHighestActiveIndex] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [retryInfo, setRetryInfo] = useState<RetryInfo>({
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    isRetrying: false,
    lastFailedSlideIndex: -1,
  });

  const prevSlidesRef = useRef<{ content: string }[]>([]);
  const activeIndexRef = useRef<number>(-1);
  const highestIndexRef = useRef<number>(-1);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualCloseRef = useRef(false);
  const isCompleteRef = useRef(false); // Track if we received complete event
  const eventSourceRef = useRef<EventSource | null>(null);
  const initializeStreamRef = useRef<(() => void) | null>(null);

  // Close event source helper
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      isManualCloseRef.current = true;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Calculate retry delay with exponential backoff
  const calculateRetryDelay = useCallback((retryCount: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 10s (max)
    return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  }, []);

  // Manual retry function - can be called from UI
  const manualRetry = useCallback(() => {
    if (!presentationId) return;

    // Reset retry count for manual retry
    retryCountRef.current = 0;
    setRetryInfo(prev => ({
      ...prev,
      retryCount: 0,
      isRetrying: true,
    }));

    // Trigger re-initialization
    if (initializeStreamRef.current) {
      initializeStreamRef.current();
    }
  }, [presentationId]);

  useEffect(() => {
    if (!presentationId || outlines.length > 0) {
      // If outlines already exist, ensure streaming is off
      setIsStreaming(false);
      setIsLoading(false);
      return;
    }

    let accumulatedChunks = "";

    const initializeStream = () => {
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      setIsStreaming(true);
      setIsLoading(true);
      isManualCloseRef.current = false;
      isCompleteRef.current = false; // Reset complete flag for new stream

      try {
        eventSourceRef.current = new EventSource(
          `/api/v1/ppt/outlines/stream/${presentationId}`
        );

        eventSourceRef.current.addEventListener("response", (event: MessageEvent) => {
          console.log("[OutlineStream] Received event:", event.data.substring(0, 100));
          const data = JSON.parse(event.data);
          console.log("[OutlineStream] Parsed event type:", data.type);

          switch (data.type) {
            case "chunk":
              // Reset retry count on successful data reception
              retryCountRef.current = 0;
              setRetryInfo(prev => ({ ...prev, retryCount: 0, isRetrying: false }));

              accumulatedChunks += data.chunk;
              try {
                const repairedJson = jsonrepair(accumulatedChunks);
                const partialData = JSON.parse(repairedJson);

                if (partialData.slides) {
                  const nextSlides: { content: string }[] = partialData.slides || [];
                  // Determine which slide index changed to minimize live parsing
                  try {
                    const prev = prevSlidesRef.current || [];
                    let changedIndex: number | null = null;
                    const maxLen = Math.max(prev.length, nextSlides.length);
                    for (let i = 0; i < maxLen; i++) {
                      const prevContent = prev[i]?.content;
                      const nextContent = nextSlides[i]?.content;
                      if (nextContent !== prevContent) {
                        changedIndex = i;
                      }
                    }
                    // Keep active index stable if no change detected; and ensure non-decreasing
                    const prevActive = activeIndexRef.current;
                    let nextActive = changedIndex ?? prevActive;
                    if (nextActive < prevActive) {
                      nextActive = prevActive;
                    }
                    activeIndexRef.current = nextActive;
                    setActiveSlideIndex(nextActive);

                    if (nextActive > highestIndexRef.current) {
                      highestIndexRef.current = nextActive;
                      setHighestActiveIndex(nextActive);
                    }
                  } catch { }

                  prevSlidesRef.current = nextSlides;
                  dispatch(setOutlines(nextSlides));
                  setIsLoading(false);
                }
              } catch (error) {
                // JSON isn't complete yet, continue accumulating
              }
              break;

            case "status":
              // Handle status updates from backend
              if (data.status) {
                setStatusMessage(data.status);
              }
              break;

            case "complete":
              // Mark as complete BEFORE doing anything else
              isCompleteRef.current = true;
              console.log("[OutlineStream] Complete event received");

              try {
                const outlinesData: { content: string }[] = data.presentation.outlines.slides;
                dispatch(setOutlines(outlinesData));
                prevSlidesRef.current = outlinesData;
                console.log("[OutlineStream] Outlines set:", outlinesData.length);
              } catch (error) {
                console.error("Error parsing outline complete data:", error);
                toast.error("Failed to parse outline data");
              }
              // Reset state after complete
              setIsStreaming(false);
              setIsLoading(false);
              setActiveSlideIndex(null);
              setHighestActiveIndex(-1);
              setStatusMessage("");
              setRetryInfo({ retryCount: 0, maxRetries: MAX_RETRIES, isRetrying: false, lastFailedSlideIndex: -1 });
              activeIndexRef.current = -1;
              highestIndexRef.current = -1;
              retryCountRef.current = 0;
              accumulatedChunks = "";
              closeEventSource();
              console.log("[OutlineStream] Stream closed after complete");
              break;

            case "closing":
              console.log("[OutlineStream] Closing event received");
              setIsStreaming(false);
              setIsLoading(false);
              setActiveSlideIndex(null);
              setHighestActiveIndex(-1);
              setStatusMessage("");
              setRetryInfo({ retryCount: 0, maxRetries: MAX_RETRIES, isRetrying: false, lastFailedSlideIndex: -1 });
              activeIndexRef.current = -1;
              highestIndexRef.current = -1;
              retryCountRef.current = 0;
              closeEventSource();
              break;

            case "error":
              setIsStreaming(false);
              setIsLoading(false);
              setActiveSlideIndex(null);
              setHighestActiveIndex(-1);
              setStatusMessage("");
              // Track failed slide index for potential manual retry
              setRetryInfo({
                retryCount: MAX_RETRIES,
                maxRetries: MAX_RETRIES,
                isRetrying: false,
                lastFailedSlideIndex: highestIndexRef.current,
              });
              activeIndexRef.current = -1;
              highestIndexRef.current = -1;
              closeEventSource();

              // Build error message with suggestion if available
              let errorDescription = data.detail || 'Failed to generate outline. Please try again.';
              if (data.suggested_action) {
                errorDescription += `\n\n💡 Suggestion: ${data.suggested_action}`;
              }

              toast.error(data.error_code ? `Error: ${data.error_code}` : 'Error in outline streaming', {
                description: errorDescription,
                duration: 10000, // Show longer for errors with suggestions
              });
              // Don't retry on server-sent errors
              retryCountRef.current = MAX_RETRIES;
              break;
          }
        });

        eventSourceRef.current.onerror = () => {
          console.error("[OutlineStream] EventSource error occurred");

          const wasManualClose = isManualCloseRef.current;
          const wasComplete = isCompleteRef.current;
          const currentSlideIndex = highestIndexRef.current;
          closeEventSource();

          // Don't retry if stream completed successfully
          if (wasComplete) {
            console.log("[OutlineStream] Ignoring error - stream already completed");
            return;
          }

          // Don't retry if this was a manual close (cleanup)
          if (wasManualClose) {
            console.log("[OutlineStream] Ignoring error - manual close");
            return;
          }

          // Retry logic with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            const delay = calculateRetryDelay(retryCountRef.current - 1);

            console.log(
              `[OutlineStream] Retrying (attempt ${retryCountRef.current}/${MAX_RETRIES}) in ${delay}ms...`
            );

            setStatusMessage(
              `החיבור נותק. מנסה שוב בעוד ${Math.ceil(delay / 1000)} שניות... (${retryCountRef.current}/${MAX_RETRIES})`
            );

            setRetryInfo({
              retryCount: retryCountRef.current,
              maxRetries: MAX_RETRIES,
              isRetrying: true,
              lastFailedSlideIndex: currentSlideIndex,
            });

            retryTimeoutRef.current = setTimeout(() => {
              console.log("[OutlineStream] Attempting to reconnect...");
              initializeStream();
            }, delay);
          } else {
            // Max retries exceeded - allow manual retry
            setIsStreaming(false);
            setIsLoading(false);
            setActiveSlideIndex(null);
            setHighestActiveIndex(-1);
            setStatusMessage("");
            setRetryInfo({
              retryCount: MAX_RETRIES,
              maxRetries: MAX_RETRIES,
              isRetrying: false,
              lastFailedSlideIndex: currentSlideIndex,
            });
            activeIndexRef.current = -1;
            highestIndexRef.current = -1;
            toast.error("החיבור נכשל", {
              description: "לא הצלחנו להתחבר לשרת. ניתן לנסות שוב באופן ידני.",
            });
          }
        };
      } catch (error) {
        setIsStreaming(false);
        setIsLoading(false);
        setActiveSlideIndex(null);
        setHighestActiveIndex(-1);
        setStatusMessage("");
        setRetryInfo({
          retryCount: MAX_RETRIES,
          maxRetries: MAX_RETRIES,
          isRetrying: false,
          lastFailedSlideIndex: -1,
        });
        activeIndexRef.current = -1;
        highestIndexRef.current = -1;
        toast.error("שגיאה באתחול החיבור");
      }
    };

    // Store reference for manual retry
    initializeStreamRef.current = initializeStream;

    initializeStream();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      closeEventSource();
      setStatusMessage("");
    };
  }, [presentationId, dispatch, outlines.length, closeEventSource, calculateRetryDelay]);

  return {
    isStreaming,
    isLoading,
    activeSlideIndex,
    highestActiveIndex,
    statusMessage,
    retryInfo,
    manualRetry,
  };
};
