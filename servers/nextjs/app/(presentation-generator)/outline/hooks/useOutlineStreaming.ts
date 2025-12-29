import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { setOutlines } from "@/store/slices/presentationGeneration";
import { jsonrepair } from "jsonrepair";
import { RootState } from "@/store/store";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

export const useOutlineStreaming = (presentationId: string | null) => {
  const dispatch = useDispatch();
  const { outlines } = useSelector((state: RootState) => state.presentationGeneration);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [highestActiveIndex, setHighestActiveIndex] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const prevSlidesRef = useRef<{ content: string }[]>([]);
  const activeIndexRef = useRef<number>(-1);
  const highestIndexRef = useRef<number>(-1);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualCloseRef = useRef(false);

  useEffect(() => {
    if (!presentationId || outlines.length > 0) return;

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

      setIsStreaming(true);
      setIsLoading(true);
      isManualCloseRef.current = false;

      try {
        eventSource = new EventSource(
          `/api/v1/ppt/outlines/stream/${presentationId}`
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
              try {
                const outlinesData: { content: string }[] = data.presentation.outlines.slides;
                dispatch(setOutlines(outlinesData));
                setIsStreaming(false);
                setIsLoading(false);
                setActiveSlideIndex(null);
                setHighestActiveIndex(-1);
                setStatusMessage("");
                prevSlidesRef.current = outlinesData;
                activeIndexRef.current = -1;
                highestIndexRef.current = -1;
                retryCountRef.current = 0;
                closeEventSource();
              } catch (error) {
                console.error("Error parsing outline complete data:", error);
                toast.error("Failed to parse outline data");
                closeEventSource();
              }
              accumulatedChunks = "";
              break;

            case "closing":
              setIsStreaming(false);
              setIsLoading(false);
              setActiveSlideIndex(null);
              setHighestActiveIndex(-1);
              setStatusMessage("");
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
              activeIndexRef.current = -1;
              highestIndexRef.current = -1;
              closeEventSource();
              toast.error('Error in outline streaming', {
                description: data.detail || 'Failed to generate outline. Please try again.',
              });
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

          // Retry logic with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            const delay = calculateRetryDelay(retryCountRef.current - 1);

            console.log(
              `Retrying outline stream (attempt ${retryCountRef.current}/${MAX_RETRIES}) in ${delay}ms...`
            );

            setStatusMessage(
              `Connection lost. Retrying in ${Math.ceil(delay / 1000)}s... (${retryCountRef.current}/${MAX_RETRIES})`
            );

            retryTimeoutRef.current = setTimeout(() => {
              console.log("Attempting to reconnect outline stream...");
              initializeStream();
            }, delay);
          } else {
            // Max retries exceeded
            setIsStreaming(false);
            setIsLoading(false);
            setActiveSlideIndex(null);
            setHighestActiveIndex(-1);
            setStatusMessage("");
            activeIndexRef.current = -1;
            highestIndexRef.current = -1;
            toast.error("Connection failed", {
              description: "Failed to connect to the server. Maximum retry attempts exceeded.",
            });
            // Reset for future attempts
            retryCountRef.current = 0;
          }
        };
      } catch (error) {
        setIsStreaming(false);
        setIsLoading(false);
        setActiveSlideIndex(null);
        setHighestActiveIndex(-1);
        setStatusMessage("");
        activeIndexRef.current = -1;
        highestIndexRef.current = -1;
        toast.error("Failed to initialize connection");
      }
    };

    initializeStream();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      closeEventSource();
      setStatusMessage("");
    };
  }, [presentationId, dispatch, outlines.length]);

  return { isStreaming, isLoading, activeSlideIndex, highestActiveIndex, statusMessage };
};
