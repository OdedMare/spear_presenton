import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { UploadedFont, FontData } from "../types";

export const useFontManagement = () => {
  const [UploadedFonts, setUploadedFonts] = useState<UploadedFont[]>([]);
  const [fontsData, setFontsData] = useState<FontData | null>(null);

  // Load uploaded fonts dynamically
  useEffect(() => {
    UploadedFonts.forEach((font) => {
      // Check if font style already exists
      const existingStyle = document.querySelector(
        `style[data-font-url="${font.fontUrl}"]`
      );
      if (!existingStyle) {
        const style = document.createElement("style");
        style.setAttribute("data-font-url", font.fontUrl);

        // Use the actual font name for font-family
        style.textContent = `
          @font-face {
            font-family: '${font.fontName}';
            src: url('${font.fontUrl}') format('truetype');
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
      }
    });
  }, [UploadedFonts]);

  // Load Google Fonts from fontsData
  useEffect(() => {
    if (fontsData?.internally_supported_fonts) {
      fontsData.internally_supported_fonts.forEach((font) => {
        // Check if font link already exists
        const existingFont = document.querySelector(
          `link[href="${font.google_fonts_url}"]`
        );
        // Only add if font doesn't already exist
        if (!existingFont) {
          const link = document.createElement("link");
          link.href = font.google_fonts_url;
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
      });
    }
  }, [fontsData]);

  const uploadFont = useCallback(
    async (fontName: string, file: File): Promise<string | null> => {
      // Check if font is already uploaded
      const existingFont = UploadedFonts.find((f) => f.fontName === fontName);
      if (existingFont) {
        toast.info(`הגופן "${fontName}" כבר הועלה`);
        return existingFont.fontUrl;
      }

      // Validate file type
      const validExtensions = [".ttf", ".otf", ".woff", ".woff2", ".eot"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (!validExtensions.includes(fileExtension)) {
        toast.error(
          "סוג קובץ גופן לא תקין. אנא העלה קבצי .ttf, .otf, .woff, .woff2, או .eot"
        );
        return null;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("גודל קובץ הגופן חייב להיות פחות מ-10MB");
        return null;
      }

      try {
        const formData = new FormData();
        formData.append("font_file", file);

        const response = await fetch("/api/v1/ppt/fonts/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`ההעלאה נכשלה: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          const newFont: UploadedFont = {
            fontName: data.font_name || fontName,
            fontUrl: data.font_url,
            fontPath: data.font_path,
          };

          setUploadedFonts((prev) => [...prev, newFont]);
          toast.success(`הגופן "${fontName}" הועלה בהצלחה`);
          return newFont.fontUrl;
        } else {
          throw new Error(data.message || "ההעלאה נכשלה");
        }
      } catch (error) {
        console.error("Error uploading font:", error);
        toast.error(`נכשל להעלות את הגופן "${fontName}"`, {
          description:
            error instanceof Error
              ? error.message
              : "אירעה שגיאה לא צפויה",
        });
        return null;
      }
    },
    [UploadedFonts]
  );

  const removeFont = useCallback((fontUrl: string) => {
    setUploadedFonts((prev) => prev.filter((font) => font.fontUrl !== fontUrl));

    // Remove the style element for this font
    const styleElement = document.querySelector(
      `style[data-font-url="${fontUrl}"]`
    );
    if (styleElement) {
      styleElement.remove();
    }

    toast.info("הגופן הוסר בהצלחה");
  }, []);

  const getAllUnsupportedFonts = useCallback((): string[] => {
    if (!fontsData?.not_supported_fonts) {
      return [];
    }
    return fontsData.not_supported_fonts;
  }, [fontsData]);

  return {
    UploadedFonts,
    fontsData,
    setFontsData,
    uploadFont,
    removeFont,
    getAllUnsupportedFonts,
  };
}; 