import { useState, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";
import { ProcessedSlide, UploadedFont, FontData } from "../types";

export const useLayoutSaving = (
  slides: ProcessedSlide[],
  UploadedFonts: UploadedFont[],
  fontsData: FontData | null,
  refetch: () => void,
  setSlides: React.Dispatch<React.SetStateAction<ProcessedSlide[]>>
) => {
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openSaveModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeSaveModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const convertSlideToReact = async (slide: ProcessedSlide, presentationId: string, FontUrls: string[]) => {
    const maxRetries = 3;
    let retryCount = 0;

    console.log("Converting slide to React (DETERMINISTIC - no VLM)", {
      slideNumber: slide.slide_number,
      hasHtml: !!slide.html,
      fonts: FontUrls,
    })

    while (retryCount < maxRetries) {
      try {
        // ALWAYS use deterministic HTML-to-React converter (no VLM, no screenshots)
        const response = await fetch("/api/v1/ppt/template/html-to-react", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html: slide.html,
            fonts: FontUrls,
            component_name: `Slide${slide.slide_number}Layout`,
          }),
        });

        const data = await ApiResponseHandler.handleResponse(
          response,
          `נכשל להמיר שקופית ${slide.slide_number} ל-React`
        );

        console.log(`✅ Successfully converted slide ${slide.slide_number} to React (deterministic)`);

        return {
          presentation: presentationId,
          layout_id: `${slide.slide_number}`,
          layout_name: `Slide${slide.slide_number}`,
          layout_code: data.react_component || data.component_code,
          fonts: FontUrls,
        };
      } catch (error) {
        retryCount++;
        console.error(`Error converting slide ${slide.slide_number} (attempt ${retryCount}):`, error);

        if (retryCount < maxRetries) {
          const waitTime = 5 * 1000; // 5 seconds between retries (fast - no VLM delays!)
          toast.error(`נכשל להמיר שקופית ${slide.slide_number}. מנסה שוב...`, {
            description: `ניסיון ${retryCount}/${maxRetries}. שגיאה: ${error instanceof Error ? error.message : "אירעה שגיאה לא צפויה"}`,
          });

          await delay(waitTime);

          toast.info(`מנסה שוב להמיר שקופית ${slide.slide_number}...`);
        } else {
          throw new Error(`נכשל להמיר שקופית ${slide.slide_number} אחרי ${maxRetries} ניסיונות: ${error instanceof Error ? error.message : "אירעה שגיאה לא צפויה"}`);
        }
      }
    }
  };

  const saveLayout = useCallback(async (layoutName: string, description: string): Promise<string | null> => {
    if (!slides.length) {
      toast.error("אין שקופיות לשמירה");
      return null;
    }

    setIsSavingLayout(true);

    try {
      // Convert each slide HTML to React component
      const reactComponents: any[] = [];
      const presentationId = uuidv4();

      // Collect uploaded font URLs and Google Fonts CSS URLs
      const uploadedFontUrls = UploadedFonts.map((font) => font.fontUrl);
      const googleFontCssUrls = fontsData?.internally_supported_fonts?.map(f => f.google_fonts_url).filter(Boolean) || [];
      const FontUrls = Array.from(new Set([...(uploadedFontUrls || []), ...googleFontCssUrls]));

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];

        if (!slide.html) {
          toast.error(`שקופית ${slide.slide_number} אין לה תוכן HTML`);
          continue;
        }

        // Mark current slide as converting to React
        setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, convertingToReact: true } : s));

        try {
          const reactComponent = await convertSlideToReact(slide, presentationId, FontUrls);
          reactComponents.push(reactComponent);

          // Update progress
          toast.success(
            `שקופית ${slide.slide_number} הומרה לקומפוננטת React`
          );
        } catch (error) {
          console.error(`Error converting slide ${slide.slide_number}:`, error);
          toast.error(`נכשל להמיר שקופית ${slide.slide_number} אחרי כל הניסיונות`, {
            description:
              error instanceof Error
                ? error.message
                : "אירעה שגיאה לא צפויה",
          });
          // Continue with other slides even if one fails
        } finally {
          // Clear converting flag for this slide
          setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, convertingToReact: false } : s));
        }
      }

      if (reactComponents.length === 0) {
        toast.error("אף שקופית לא הומרה בהצלחה");
        return null;
      }

      // First create/update the template metadata
      await fetch("/api/v1/ppt/template-management/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: presentationId, name: layoutName, description }),
      });

      const saveResponse = await fetch(
        "/api/v1/ppt/template-management/save-templates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            layouts: reactComponents,
          }),
        }
      );

      const data = await ApiResponseHandler.handleResponse(
        saveResponse,
        "נכשל לשמור קומפוננטות מבנה"
      );

      if (!data.success) {
        toast.error("נכשל לשמור קומפוננטות מבנה");
        return null;
      }

      toast.success("המבנה נשמר בהצלחה");

      // Mark all slides as saved (remove modified flag)
      slides.forEach((slide) => {
        slide.modified = false;
      });

      toast.success(`המבנה "${layoutName}" נשמר בהצלחה`);
      refetch();
      closeSaveModal();
      return presentationId;
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("נכשל לשמור מבנה", {
        description:
          error instanceof Error
            ? error.message
            : "אירעה שגיאה לא צפויה",
      });
      return null;
    } finally {
      setIsSavingLayout(false);
    }
  }, [slides, UploadedFonts, fontsData, refetch, closeSaveModal, setSlides]);

  return {
    isSavingLayout,
    isModalOpen,
    openSaveModal,
    closeSaveModal,
    saveLayout,
  };
}; 