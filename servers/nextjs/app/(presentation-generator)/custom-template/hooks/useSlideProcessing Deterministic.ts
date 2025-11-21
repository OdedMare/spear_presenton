import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";
import { ProcessedSlide, FontData } from "../types";

// Feature flag to enable deterministic pipeline
const USE_DETERMINISTIC_PIPELINE = process.env.NEXT_PUBLIC_USE_DETERMINISTIC_PIPELINE === 'true';

export const useSlideProcessingDeterministic = (
  selectedFile: File | null,
  slides: ProcessedSlide[],
  setSlides: React.Dispatch<React.SetStateAction<ProcessedSlide[]>>,
  setFontsData: React.Dispatch<React.SetStateAction<FontData | null>>
) => {
  const [isProcessingPptx, setIsProcessingPptx] = useState(false);

  // Process individual slide to HTML using deterministic renderer
  const processSlideToHtml = useCallback(
    async (slide: any, index: number) => {
      console.log(
        `Starting to process slide ${slide.slide_number} at index ${index} (deterministic)`
      );

      // Update slide to processing state
      setSlides((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, processing: true, error: undefined } : s
        )
      );

      try {
        // NEW: Use deterministic layout renderer instead of VLM
        const htmlResponse = await fetch("/api/v1/ppt/layout/render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slide: slide.layout_json,
          }),
        });

        const htmlData = await ApiResponseHandler.handleResponse(
          htmlResponse,
          `Failed to render slide ${slide.slide_number} to HTML`
        );

        console.log(`Successfully processed slide ${slide.slide_number}`);

        // Update slide with success
        setSlides((prev) => {
          const newSlides = prev.map((s, i) =>
            i === index
              ? {
                  ...s,
                  processing: false,
                  processed: true,
                  html: htmlData.html,
                }
              : s
          );

          // Process next slide if available
          const nextIndex = index + 1;
          if (
            nextIndex < newSlides.length &&
            !newSlides[nextIndex].processed &&
            !newSlides[nextIndex].processing
          ) {
            console.log(
              `Scheduling next slide ${nextIndex + 1} for processing`
            );
            setTimeout(() => {
              const nextSlide = newSlides[nextIndex];
              processSlideToHtml(nextSlide, nextIndex);
            }, 100); // Faster - no VLM delay needed
          }

          return newSlides;
        });
      } catch (error) {
        console.error(`Error processing slide ${slide.slide_number}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to render to HTML";

        // Update slide with error
        setSlides((prev) => {
          const newSlides = prev.map((s, i) =>
            i === index
              ? {
                  ...s,
                  processing: false,
                  processed: false,
                  error: errorMessage,
                }
              : s
          );

          // Continue with next slide even if this one failed
          const nextIndex = index + 1;
          if (
            nextIndex < newSlides.length &&
            !newSlides[nextIndex].processed &&
            !newSlides[nextIndex].processing
          ) {
            console.log(`Scheduling next slide ${nextIndex + 1} after error`);
            setTimeout(() => {
              const nextSlide = newSlides[nextIndex];
              processSlideToHtml(nextSlide, nextIndex);
            }, 100);
          }

          return newSlides;
        });
      }
    },
    []
  );

  // Process PPTX file to extract layout JSON
  const processFile = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please select a PPTX file first");
      return;
    }

    try {
      setIsProcessingPptx(true);

      const formData = new FormData();
      const fileName = selectedFile.name.toLowerCase();
      const isPptx = fileName.endsWith(".pptx");

      if (!isPptx) {
        throw new Error("Deterministic pipeline currently only supports PPTX files");
      }

      // NEW: Use layout/process endpoint for deterministic extraction
      formData.append("pptx_file", selectedFile);
      const layoutResponse = await fetch("/api/v1/ppt/layout/process", {
        method: "POST",
        body: formData,
      });

      const slidesResponseData = await ApiResponseHandler.handleResponse(
        layoutResponse,
        "Failed to process PPTX file"
      );

      if (!slidesResponseData.success || !slidesResponseData.slides?.length) {
        throw new Error("No slides found in the uploaded file");
      }

      // Extract fonts data
      if (slidesResponseData.fonts) {
        setFontsData(slidesResponseData.fonts);
      }

      // Initialize slides with layout JSON (no screenshots needed!)
      const initialSlides: ProcessedSlide[] = slidesResponseData.slides.map(
        (slide: any) => ({
          slide_number: slide.index,
          layout_json: slide, // NEW: Store full layout JSON
          screenshot_url: null, // Not needed anymore
          xml_content: null, // Already in layout JSON
          normalized_fonts: slide.fonts ?? [],
          processing: false,
          processed: false,
        })
      );

      setSlides(initialSlides);

      const hasUnsupported =
        Array.isArray(slidesResponseData.fonts?.not_supported_fonts) &&
        slidesResponseData.fonts.not_supported_fonts.length > 0;

      toast.success(
        `Layout Extraction Complete`,
        {
          description: hasUnsupported
            ? `Please upload the unsupported fonts, then click Extract Template`
            : `All fonts supported! Starting HTML generation...`
        }
      );

      // Auto-start HTML rendering if all fonts are supported
      if (!hasUnsupported && initialSlides.length > 0) {
        const firstSlide = initialSlides[0];
        setTimeout(() => processSlideToHtml(firstSlide, 0), 300);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Processing failed", {
        description: errorMessage,
      });
    } finally {
      setIsProcessingPptx(false);
    }
  }, [selectedFile, processSlideToHtml, setSlides, setFontsData]);

  // Retry failed slide
  const retrySlide = useCallback(
    (index: number) => {
      const slide = slides[index];
      if (slide) {
        processSlideToHtml(slide, index);
      }
    },
    [slides, processSlideToHtml]
  );

  return {
    isProcessingPptx,
    processFile,
    processSlideToHtml,
    retrySlide,
  };
};
