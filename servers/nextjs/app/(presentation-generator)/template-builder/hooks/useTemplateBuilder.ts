import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { SlideElement, TemplateSlide } from "../types";
import { saveTemplateAPI } from "../services/api";

const DEFAULT_SLIDE_WIDTH = 1280;
const DEFAULT_SLIDE_HEIGHT = 720;

export const useTemplateBuilder = () => {
  const [slides, setSlides] = useState<TemplateSlide[]>([
    {
      id: uuidv4(),
      width_px: DEFAULT_SLIDE_WIDTH,
      height_px: DEFAULT_SLIDE_HEIGHT,
      background: { type: "solid", color: "#FFFFFF" },
      elements: [],
    },
  ]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Slide Management
  const addSlide = () => {
    const newSlide: TemplateSlide = {
      id: uuidv4(),
      width_px: DEFAULT_SLIDE_WIDTH,
      height_px: DEFAULT_SLIDE_HEIGHT,
      background: { type: "solid", color: "#FFFFFF" },
      elements: [],
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
    setSelectedElement(null);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) return; // Keep at least one slide

    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);

    // Adjust current slide index
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
    setSelectedElement(null);
  };

  const selectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setSelectedElement(null);
  };

  // Element Management
  const addElement = (type: SlideElement["type"]) => {
    const currentSlide = slides[currentSlideIndex];

    let newElement: SlideElement;

    switch (type) {
      case "text":
        newElement = {
          id: uuidv4(),
          type: "text",
          bbox: {
            x: 100,
            y: 100,
            width: 400,
            height: 100,
          },
          z: currentSlide.elements.length,
          rotation: 0,
          opacity: 1,
          align: "left",
          runs: [
            {
              text: "Text placeholder",
              font: {
                family: "Arial",
                size: 24,
                weight: 400,
                style: "normal",
                underline: false,
                color: "#000000",
              },
              color: "#000000",
              highlight: null,
              underline: false,
              strike: false,
            },
          ],
          bullets: [],
          fill: { type: "solid", color: "#F3F4F6" },
        };
        break;

      case "shape":
        newElement = {
          id: uuidv4(),
          type: "shape",
          shape: "RECTANGLE",
          bbox: {
            x: 100,
            y: 100,
            width: 200,
            height: 200,
          },
          z: currentSlide.elements.length,
          rotation: 0,
          opacity: 1,
          fill: { type: "solid", color: "#3B82F6" },
          stroke: null,
        };
        break;

      case "image":
        newElement = {
          id: uuidv4(),
          type: "image",
          bbox: {
            x: 100,
            y: 100,
            width: 300,
            height: 200,
          },
          z: currentSlide.elements.length,
          rotation: 0,
          opacity: 1,
          src: "",
          object_fit: "cover",
        };
        break;

      default:
        return;
    }

    const updatedSlide = {
      ...currentSlide,
      elements: [...currentSlide.elements, newElement],
    };

    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    setSlides(newSlides);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    const currentSlide = slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    );

    const updatedSlide = {
      ...currentSlide,
      elements: updatedElements,
    };

    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    setSlides(newSlides);
  };

  const deleteElement = (elementId: string) => {
    const currentSlide = slides[currentSlideIndex];
    const updatedElements = currentSlide.elements.filter((el) => el.id !== elementId);

    const updatedSlide = {
      ...currentSlide,
      elements: updatedElements,
    };

    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    setSlides(newSlides);
    setSelectedElement(null);
  };

  const selectElement = (elementId: string | null) => {
    setSelectedElement(elementId);
  };

  // Save Template
  const saveTemplate = async (name: string, description: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const templateData = {
        name,
        description,
        slides: slides.map((slide) => ({
          id: slide.id,
          index: slides.indexOf(slide),
          width_px: slide.width_px,
          height_px: slide.height_px,
          background: slide.background,
          fonts: extractFontsFromSlide(slide),
          elements: slide.elements,
        })),
        width_px: DEFAULT_SLIDE_WIDTH,
        height_px: DEFAULT_SLIDE_HEIGHT,
        fonts: extractAllFonts(),
      };

      const result = await saveTemplateAPI(templateData);
      return result.success;
    } catch (error) {
      console.error("Failed to save template:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Extract fonts from slide
  const extractFontsFromSlide = (slide: TemplateSlide): string[] => {
    const fonts = new Set<string>();
    slide.elements.forEach((el) => {
      if (el.type === "text" && el.runs) {
        el.runs.forEach((run) => {
          if (run.font?.family) {
            fonts.add(run.font.family);
          }
        });
      }
    });
    return Array.from(fonts);
  };

  // Helper: Extract all fonts from all slides
  const extractAllFonts = (): string[] => {
    const fonts = new Set<string>();
    slides.forEach((slide) => {
      extractFontsFromSlide(slide).forEach((font) => fonts.add(font));
    });
    return Array.from(fonts);
  };

  return {
    slides,
    currentSlideIndex,
    selectedElement,
    addSlide,
    deleteSlide,
    selectSlide,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    saveTemplate,
    isSaving,
  };
};
