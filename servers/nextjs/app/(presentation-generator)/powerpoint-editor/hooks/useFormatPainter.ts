import { useState, useCallback } from "react";
import { TextElement, ShapeElement, SlideElement } from "../types";

interface CopiedFormat {
  type: "text" | "shape";
  textStyle?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number | string;
    fontStyle: "normal" | "italic";
    color: string;
    underline?: boolean;
  };
  paragraphStyle?: {
    align: "left" | "center" | "right" | "justify";
    lineHeight: number;
    indent: number;
    spaceBefore: number;
    spaceAfter: number;
    bullet?: any;
  };
  shapeStyle?: {
    fill?: any;
    border?: any;
    shadow?: any;
    opacity?: number;
  };
}

export const useFormatPainter = () => {
  const [copiedFormat, setCopiedFormat] = useState<CopiedFormat | null>(null);
  const [isPainterActive, setIsPainterActive] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);

  const copyFormat = useCallback((element: SlideElement) => {
    if (element.type === "text") {
      const textElement = element as TextElement;
      const firstRun = textElement.content[0];

      setCopiedFormat({
        type: "text",
        textStyle: {
          fontFamily: firstRun.style.fontFamily,
          fontSize: firstRun.style.fontSize,
          fontWeight: firstRun.style.fontWeight,
          fontStyle: firstRun.style.fontStyle,
          color: firstRun.style.color,
          underline: firstRun.style.underline,
        },
        paragraphStyle: {
          align: textElement.paragraphStyle.align,
          lineHeight: textElement.paragraphStyle.lineHeight,
          indent: textElement.paragraphStyle.indent || 0,
          spaceBefore: textElement.paragraphStyle.spaceBefore || 0,
          spaceAfter: textElement.paragraphStyle.spaceAfter || 0,
          bullet: textElement.paragraphStyle.bullet,
        },
      });
      setIsPainterActive(true);
    } else if (element.type === "shape") {
      const shapeElement = element as ShapeElement;

      setCopiedFormat({
        type: "shape",
        shapeStyle: {
          fill: shapeElement.fill,
          border: shapeElement.border,
          shadow: shapeElement.shadow,
          opacity: shapeElement.opacity,
        },
      });
      setIsPainterActive(true);
    }
  }, []);

  const applyFormat = useCallback(() => {
    if (!copiedFormat) return null;

    // Return the formatting to be applied
    const formatting = {
      type: copiedFormat.type,
      textStyle: copiedFormat.textStyle,
      paragraphStyle: copiedFormat.paragraphStyle,
      shapeStyle: copiedFormat.shapeStyle,
    };

    // If not persistent mode, clear after one use
    if (!isPersistent) {
      clearFormat();
    }

    return formatting;
  }, [copiedFormat, isPersistent]);

  const clearFormat = useCallback(() => {
    setCopiedFormat(null);
    setIsPainterActive(false);
    setIsPersistent(false);
  }, []);

  const togglePersistent = useCallback(() => {
    setIsPersistent((prev) => !prev);
  }, []);

  return {
    copiedFormat,
    isPainterActive,
    isPersistent,
    copyFormat,
    applyFormat,
    clearFormat,
    togglePersistent,
  };
};
