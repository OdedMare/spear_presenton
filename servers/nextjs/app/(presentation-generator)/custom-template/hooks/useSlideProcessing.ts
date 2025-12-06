import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";
import { ProcessedSlide, FontData } from "../types";

export const useSlideProcessing = (
  selectedFile: File | null,
  slides: ProcessedSlide[],
  setSlides: React.Dispatch<React.SetStateAction<ProcessedSlide[]>>,
  setFontsData: React.Dispatch<React.SetStateAction<FontData | null>>
) => {
  const [isProcessingPptx, setIsProcessingPptx] = useState(false);

  // Process individual slide to HTML using DETERMINISTIC renderer (no VLM, no screenshots)
  const processSlideToHtml = useCallback(
    async (slide: any, index: number) => {
      console.log(
        `Starting DETERMINISTIC processing for slide ${slide.slide_number} at index ${index}`
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
          `נכשל לעבד שקופית ${slide.slide_number} ל-HTML`
        );

        console.log(`✅ Successfully processed slide ${slide.slide_number} deterministically`);

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
            }, 100); // Fast processing - no VLM delay needed!
          }

          return newSlides;
        });
      } catch (error) {
        console.error(`Error processing slide ${slide.slide_number}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "נכשל לעבד ל-HTML";

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

  // Process PPTX file to extract layout JSON (NO SCREENSHOTS, NO OCR, NO VLM)
  const processFile = useCallback(async () => {
    if (!selectedFile) {
      toast.error("אנא בחר קובץ PPTX או POTX תחילה");
      return;
    }

    try {
      setIsProcessingPptx(true);

      const formData = new FormData();
      const fileName = selectedFile.name.toLowerCase();
      const isPowerpoint = fileName.endsWith(".pptx") || fileName.endsWith(".potx");

      if (!isPowerpoint) {
        throw new Error("Only PPTX/POTX files are supported in deterministic mode");
      }

      // NEW: Use layout/process endpoint for deterministic extraction (NO SCREENSHOTS!)
      formData.append("pptx_file", selectedFile);
      const layoutResponse = await fetch("/api/v1/ppt/layout/process", {
        method: "POST",
        body: formData,
      });

      const slidesResponseData = await ApiResponseHandler.handleResponse(
        layoutResponse,
        "נכשל לעבד קובץ PPTX"
      );

      if (!slidesResponseData.success || !slidesResponseData.slides?.length) {
        throw new Error("לא נמצאו שקופיות בקובץ שהועלה");
      }

      // Extract fonts data
      if (slidesResponseData.fonts) {
        setFontsData(slidesResponseData.fonts);
      }

      // Initialize slides with layout JSON (NO screenshots, NO xml - it's all in layout_json!)
      const initialSlides: ProcessedSlide[] = slidesResponseData.slides.map(
        (slide: any) => ({
          slide_number: slide.index,
          layout_json: slide, // NEW: Store full layout JSON with positions, colors, etc.
          screenshot_url: null, // NOT NEEDED - deterministic rendering!
          xml_content: null, // NOT NEEDED - already in layout JSON!
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
        `🚀 חילוץ מבנה הושלם!`,
        {
          description: hasUnsupported
            ? `אנא העלה גופנים לא נתמכים, ואז לחץ על חלץ תבנית`
            : `כל הגופנים נתמכים! מתחיל יצירת HTML...`
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
        error instanceof Error ? error.message : "אירעה שגיאה לא צפויה";
      toast.error("העיבוד נכשל", {
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
