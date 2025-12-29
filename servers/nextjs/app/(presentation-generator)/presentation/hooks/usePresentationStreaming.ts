import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  clearPresentationData,
  setPresentationData,
  setStreaming,
} from "@/store/slices/presentationGeneration";
import { jsonrepair } from "jsonrepair";
import { toast } from "sonner";
import { MixpanelEvent, trackEvent } from "@/utils/mixpanel";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

export const usePresentationStreaming = (
  presentationId: string,
  stream: string | null,
  setLoading: (loading: boolean) => void,
  setError: (error: boolean) => void,
  fetchUserSlides: () => void
) => {
  const dispatch = useDispatch();
  const previousSlidesLength = useRef(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualCloseRef = useRef(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let accumulatedChunks = "";

    const calculateRetryDelay = (retryCount: number): number => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 10s (max)
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
        MAX_RETRY_DELAY
      );
      return delay;
    };

    const closeEventSource = () => {
      if (eventSource) {
        isManualCloseRef.current = true;
        eventSource.close();
        eventSource = null;
      }
    };

    const initializeStream = async () => {
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      dispatch(setStreaming(true));

      // Only clear presentation data on first attempt
      if (retryCountRef.current === 0) {
        dispatch(clearPresentationData());
        trackEvent(MixpanelEvent.Presentation_Stream_API_Call);
      }

      isManualCloseRef.current = false;

      try {
        eventSource = new EventSource(
          `/api/v1/ppt/presentation/stream/${presentationId}`
        );

        eventSource.addEventListener("response", (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "chunk":
              // Reset retry count on successful data reception
              retryCountRef.current = 0;

              accumulatedChunks += data.chunk;
              try {
                const repairedJson = jsonrepair(accumulatedChunks);
                const partialData = JSON.parse(repairedJson);

                if (partialData.slides) {
                  if (
                    partialData.slides.length !== previousSlidesLength.current &&
                    partialData.slides.length > 0
                  ) {
                    dispatch(
                      setPresentationData({
                        ...partialData,
                        slides: partialData.slides,
                      })
                    );
                    previousSlidesLength.current = partialData.slides.length;
                    setLoading(false);
                  }
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
              try {
                dispatch(setPresentationData(data.presentation));
                dispatch(setStreaming(false));
                setLoading(false);
                setStatusMessage("");
                closeEventSource();

                // Remove stream parameter from URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("stream");
                window.history.replaceState({}, "", newUrl.toString());

                // Reset retry count
                retryCountRef.current = 0;
              } catch (error) {
                console.error("Error parsing complete data:", error);
                closeEventSource();
                toast.error("Failed to process presentation data");
              }
              accumulatedChunks = "";
              break;

            case "closing":
              dispatch(setPresentationData(data.presentation));
              setLoading(false);
              dispatch(setStreaming(false));
              setStatusMessage("");
              closeEventSource();

              // Remove stream parameter from URL
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("stream");
              window.history.replaceState({}, "", newUrl.toString());

              // Reset retry count
              retryCountRef.current = 0;
              break;

            case "error":
              closeEventSource();
              setStatusMessage("");

              // Build error message with suggestion if available
              let errorDescription = data.detail || "Failed to generate presentation. Please try again.";
              if (data.suggested_action) {
                errorDescription += `\n\n💡 Suggestion: ${data.suggested_action}`;
              }

              toast.error(data.error_code ? `Error: ${data.error_code}` : "Error in presentation streaming", {
                description: errorDescription,
                duration: 10000, // Show longer for errors with suggestions
              });
              setLoading(false);
              dispatch(setStreaming(false));
              setError(true);

              // Don't retry on server-sent errors
              retryCountRef.current = MAX_RETRIES;
              break;
          }
        });

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);

          const wasManualClose = isManualCloseRef.current;
          closeEventSource();

          // Don't retry if this was a manual close (cleanup)
          if (wasManualClose) {
            return;
          }

          // Determine error type
          let errorMessage = "Connection error";
          let errorDescription = "Failed to connect to the server.";

          if (eventSource?.readyState === EventSource.CLOSED) {
            // Check if it might be an auth issue by trying to detect 401/403
            errorDescription =
              "Stream connection was closed. This may be due to session timeout or network issues.";
          }

          // Retry logic with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            const delay = calculateRetryDelay(retryCountRef.current - 1);

            console.log(
              `Retrying stream connection (attempt ${retryCountRef.current}/${MAX_RETRIES}) in ${delay}ms...`
            );

            setStatusMessage(
              `Connection lost. Retrying in ${Math.ceil(delay / 1000)}s... (${retryCountRef.current}/${MAX_RETRIES})`
            );

            retryTimeoutRef.current = setTimeout(() => {
              console.log("Attempting to reconnect...");
              initializeStream();
            }, delay);
          } else {
            // Max retries exceeded
            setStatusMessage("");
            toast.error(errorMessage, {
              description: `${errorDescription} Maximum retry attempts exceeded.`,
            });
            setLoading(false);
            dispatch(setStreaming(false));
            setError(true);

            // Reset for future attempts
            retryCountRef.current = 0;
          }
        };
      } catch (error) {
        console.error("Failed to initialize stream:", error);
        setStatusMessage("");
        toast.error("Failed to initialize connection");
        setLoading(false);
        dispatch(setStreaming(false));
        setError(true);
      }
    };

    if (stream) {
      initializeStream();
    } else {
      fetchUserSlides();
    }

    return () => {
      // Cleanup
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      closeEventSource();
      setStatusMessage("");
    };
  }, [presentationId, stream, dispatch, setLoading, setError, fetchUserSlides]);

  return { statusMessage };
};
