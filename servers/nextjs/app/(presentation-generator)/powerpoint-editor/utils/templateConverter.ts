/**
 * Template Converter Utilities
 * Converts between PowerPoint Editor format and Template Builder format
 */

import { Presentation, Slide, SlideElement, TextElement, ShapeElement, ImageElement } from "../types";

// Template Builder types (from template-builder)
interface TemplateBuilderSlide {
  id: string;
  width_px: number;
  height_px: number;
  background: TemplateBuilderFill | null;
  elements: TemplateBuilderElement[];
}

interface TemplateBuilderElement {
  id: string;
  type: "text" | "shape" | "image";
  bbox: { x: number; y: number; width: number; height: number };
  z: number;
  rotation: number;
  opacity: number;
  [key: string]: any;
}

interface TemplateBuilderFill {
  type: "solid" | "gradient" | "theme";
  color?: string;
  stops?: Array<{ offset: number; color: string }>;
  angle?: number;
}

interface TemplateBuilderTemplate {
  id: string;
  name: string;
  description?: string;
  slides: TemplateBuilderSlide[];
  width_px: number;
  height_px: number;
  fonts?: string[];
}

/**
 * Convert Template Builder template to PowerPoint Editor presentation
 */
export function templateBuilderToPresentation(template: TemplateBuilderTemplate): Presentation {
  return {
    id: template.id,
    name: template.name,
    width: template.width_px,
    height: template.height_px,
    slides: template.slides.map((slide) => convertSlide(slide)),
    theme: {
      id: "default",
      name: "Default",
      colors: {
        primary: "#0078d4",
        secondary: "#2b88d8",
        accent1: "#c43e1c",
        accent2: "#e67c73",
        accent3: "#f4b400",
        accent4: "#0f9d58",
        accent5: "#ab47bc",
        accent6: "#00acc1",
        background1: "#FFFFFF",
        background2: "#F3F2F1",
        text1: "#000000",
        text2: "#323130",
        hyperlink: "#0078d4",
        followedHyperlink: "#004578",
      },
      fonts: {
        heading: template.fonts?.[0] || "Arial",
        body: template.fonts?.[1] || "Arial",
      },
    },
    masters: [],
    settings: {
      autoAdvance: false,
      loop: false,
      showProgressBar: true,
      showSlideNumbers: true,
      showNotes: false,
      aspectRatio: template.width_px === 1280 && template.height_px === 720 ? "16:9" : "4:3",
    },
  };
}

function convertSlide(templateSlide: TemplateBuilderSlide): Slide {
  return {
    id: templateSlide.id,
    elements: templateSlide.elements.map((el) => convertElement(el)),
    background: templateSlide.background
      ? {
          type: templateSlide.background.type === "theme" ? "solid" : templateSlide.background.type as "solid" | "gradient",
          color: templateSlide.background.color || "#FFFFFF",
        }
      : { type: "solid", color: "#FFFFFF" },
    notes: "",
    layout: "blank",
  };
}

function convertElement(templateElement: TemplateBuilderElement): SlideElement {
  const baseElement = {
    id: templateElement.id,
    bbox: templateElement.bbox,
    z: templateElement.z,
    rotation: templateElement.rotation,
    opacity: templateElement.opacity,
  };

  if (templateElement.type === "text") {
    const textEl = templateElement as any;
    return {
      ...baseElement,
      type: "text",
      content: textEl.runs || [
        {
          text: textEl.text || "Text",
          style: {
            fontFamily: textEl.font_family || "Arial",
            fontSize: textEl.font_size || 18,
            fontWeight: textEl.bold ? 700 : 400,
            fontStyle: textEl.italic ? "italic" : "normal",
            color: textEl.color || "#000000",
          },
        },
      ],
      paragraphStyle: {
        align: textEl.align || "left",
        lineHeight: 1.2,
        spaceBefore: 0,
        spaceAfter: 0,
        indent: 0,
      },
      verticalAlign: textEl.vertical_align || "top",
      textDirection: "horizontal",
      autofit: "none",
      padding: 8,
    } as TextElement;
  }

  if (templateElement.type === "shape") {
    const shapeEl = templateElement as any;
    return {
      ...baseElement,
      type: "shape",
      shapeType: convertShapeType(shapeEl.shape),
      fill: shapeEl.fill
        ? { type: shapeEl.fill.type, value: shapeEl.fill.color || "#0078d4" }
        : { type: "solid", value: "#0078d4" },
      border: shapeEl.stroke
        ? {
            width: shapeEl.stroke.width || 1,
            color: shapeEl.stroke.color || "#000000",
            style: "solid",
          }
        : undefined,
    } as ShapeElement;
  }

  if (templateElement.type === "image") {
    const imageEl = templateElement as any;
    return {
      ...baseElement,
      type: "image",
      src: imageEl.src || "",
      objectFit: imageEl.object_fit || "contain",
    } as ImageElement;
  }

  // Fallback
  return baseElement as SlideElement;
}

function convertShapeType(templateShape: string): string {
  const shapeMap: Record<string, string> = {
    RECTANGLE: "rectangle",
    OVAL: "ellipse",
    ROUNDED_RECTANGLE: "rounded-rectangle",
    TRIANGLE: "triangle",
    PENTAGON: "pentagon",
    HEXAGON: "hexagon",
    OCTAGON: "octagon",
  };
  return shapeMap[templateShape] || "rectangle";
}

/**
 * Convert PowerPoint Editor presentation to Template Builder template
 */
export function presentationToTemplateBuilder(presentation: Presentation): TemplateBuilderTemplate {
  return {
    id: presentation.id,
    name: presentation.name,
    description: `Converted from PowerPoint Editor`,
    width_px: presentation.width,
    height_px: presentation.height,
    slides: presentation.slides.map((slide) => convertSlideToTemplate(slide, presentation.width, presentation.height)),
    fonts: extractFonts(presentation),
  };
}

function convertSlideToTemplate(slide: Slide, width: number, height: number): TemplateBuilderSlide {
  return {
    id: slide.id,
    width_px: width,
    height_px: height,
    background: slide.background.type === "solid"
      ? { type: "solid", color: slide.background.color }
      : null,
    elements: slide.elements
      .map((el) => convertElementToTemplate(el))
      .filter((el): el is TemplateBuilderElement => el !== null),
  };
}

function convertElementToTemplate(element: SlideElement): TemplateBuilderElement | null {
  // Template Builder only supports text, shape, and image - skip other types
  if (element.type !== "text" && element.type !== "shape" && element.type !== "image") {
    return null;
  }

  const baseElement = {
    id: element.id,
    type: element.type as "text" | "shape" | "image",
    bbox: element.bbox,
    z: element.z,
    rotation: element.rotation,
    opacity: element.opacity,
  };

  if (element.type === "text") {
    const textEl = element as TextElement;
    return {
      ...baseElement,
      type: "text" as const,
      align: textEl.paragraphStyle?.align || "left",
      runs: textEl.content.map((run) => ({
        text: run.text,
        style: {
          fontFamily: run.style.fontFamily,
          fontSize: run.style.fontSize,
          fontWeight: run.style.fontWeight,
          fontStyle: run.style.fontStyle,
          color: run.style.color,
        },
      })),
    };
  }

  if (element.type === "shape") {
    const shapeEl = element as ShapeElement;
    return {
      ...baseElement,
      type: "shape" as const,
      shape: convertShapeTypeToTemplate(shapeEl.shapeType),
      fill: shapeEl.fill
        ? { type: shapeEl.fill.type, color: shapeEl.fill.value }
        : null,
      stroke: shapeEl.border
        ? {
            width: shapeEl.border.width,
            color: shapeEl.border.color,
            style: shapeEl.border.style,
          }
        : null,
    };
  }

  if (element.type === "image") {
    const imageEl = element as ImageElement;
    return {
      ...baseElement,
      type: "image" as const,
      src: imageEl.src,
      object_fit: imageEl.objectFit || "contain",
    };
  }

  return baseElement;
}

function convertShapeTypeToTemplate(shapeType: string): string {
  const shapeMap: Record<string, string> = {
    rectangle: "RECTANGLE",
    ellipse: "OVAL",
    "rounded-rectangle": "ROUNDED_RECTANGLE",
    triangle: "TRIANGLE",
    pentagon: "PENTAGON",
    hexagon: "HEXAGON",
    octagon: "OCTAGON",
  };
  return shapeMap[shapeType] || "RECTANGLE";
}

function extractFonts(presentation: Presentation): string[] {
  const fonts = new Set<string>();

  // Add theme fonts
  if (presentation.theme?.fonts?.heading) fonts.add(presentation.theme.fonts.heading);
  if (presentation.theme?.fonts?.body) fonts.add(presentation.theme.fonts.body);

  // Extract fonts from text elements
  presentation.slides.forEach((slide) => {
    slide.elements.forEach((element) => {
      if (element.type === "text") {
        const textEl = element as TextElement;
        textEl.content.forEach((run) => {
          if (run.style.fontFamily) fonts.add(run.style.fontFamily);
        });
      }
    });
  });

  return Array.from(fonts);
}

/**
 * Save presentation as template
 */
export async function saveAsTemplate(
  presentation: Presentation,
  templateName: string,
  description?: string
): Promise<void> {
  const template = presentationToTemplateBuilder(presentation);
  template.name = templateName;
  template.description = description;

  const response = await fetch("/api/v1/ppt/template/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    throw new Error("Failed to save template");
  }
}

/**
 * Load template as presentation
 */
export async function loadTemplate(templateId: string): Promise<Presentation> {
  const response = await fetch(`/api/v1/ppt/template/${templateId}`);

  if (!response.ok) {
    throw new Error("Failed to load template");
  }

  const template: TemplateBuilderTemplate = await response.json();
  return templateBuilderToPresentation(template);
}

/**
 * List all available templates
 */
export async function listTemplates(): Promise<Array<{ id: string; name: string; description?: string }>> {
  const response = await fetch("/api/v1/ppt/template/list");

  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }

  return response.json();
}
