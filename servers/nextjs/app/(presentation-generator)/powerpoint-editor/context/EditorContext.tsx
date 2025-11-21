"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Presentation,
  Slide,
  SlideElement,
  TextElement,
  ShapeElement,
  ImageElement,
} from "../types";

interface EditorContextType {
  presentation: Presentation;
  currentSlideIndex: number;
  selectedElementIds: string[];
  clipboard: SlideElement[];
  history: Presentation[];
  historyIndex: number;

  // Slide operations
  addSlide: (index?: number) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  setCurrentSlide: (index: number) => void;

  // Element operations
  addElement: (element: SlideElement) => void;
  updateElement: (id: string, updates: Partial<SlideElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectMultipleElements: (ids: string[]) => void;
  clearSelection: () => void;

  // Clipboard operations
  copy: () => void;
  cut: () => void;
  paste: () => void;

  // Layer operations
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // Alignment operations
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  distributeHorizontally: () => void;
  distributeVertically: () => void;

  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Presentation operations
  updatePresentationSettings: (settings: Partial<Presentation>) => void;
  savePresentation: () => Promise<void>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
};

const createDefaultSlide = (): Slide => ({
  id: uuidv4(),
  elements: [],
  background: { type: "solid", color: "#FFFFFF" },
  notes: "",
  layout: "blank",
});

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [presentation, setPresentation] = useState<Presentation>({
    id: uuidv4(),
    name: "Untitled Presentation",
    width: 1280,
    height: 720,
    slides: [createDefaultSlide()],
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
        heading: "Arial",
        body: "Arial",
      },
    },
    masters: [],
    settings: {
      autoAdvance: false,
      loop: false,
      showProgressBar: true,
      showSlideNumbers: true,
      showNotes: false,
      aspectRatio: "16:9",
    },
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<SlideElement[]>([]);
  const [history, setHistory] = useState<Presentation[]>([presentation]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentSlide = presentation.slides[currentSlideIndex];

  // Add to history
  const addToHistory = useCallback((newPresentation: Presentation) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newPresentation]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Slide operations
  const addSlide = useCallback((index?: number) => {
    const newSlide = createDefaultSlide();
    const insertIndex = index ?? currentSlideIndex + 1;

    setPresentation((prev) => {
      const newPresentation = {
        ...prev,
        slides: [
          ...prev.slides.slice(0, insertIndex),
          newSlide,
          ...prev.slides.slice(insertIndex),
        ],
      };
      addToHistory(newPresentation);
      return newPresentation;
    });

    setCurrentSlideIndex(insertIndex);
    setSelectedElementIds([]);
  }, [currentSlideIndex, addToHistory]);

  const deleteSlide = useCallback((index: number) => {
    if (presentation.slides.length === 1) return;

    setPresentation((prev) => {
      const newPresentation = {
        ...prev,
        slides: prev.slides.filter((_, i) => i !== index),
      };
      addToHistory(newPresentation);
      return newPresentation;
    });

    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
    setSelectedElementIds([]);
  }, [presentation.slides.length, currentSlideIndex, addToHistory]);

  const duplicateSlide = useCallback((index: number) => {
    const slideToDuplicate = presentation.slides[index];
    const newSlide: Slide = {
      ...slideToDuplicate,
      id: uuidv4(),
      elements: slideToDuplicate.elements.map((el) => ({
        ...el,
        id: uuidv4(),
      })),
    };

    setPresentation((prev) => {
      const newPresentation = {
        ...prev,
        slides: [
          ...prev.slides.slice(0, index + 1),
          newSlide,
          ...prev.slides.slice(index + 1),
        ],
      };
      addToHistory(newPresentation);
      return newPresentation;
    });

    setCurrentSlideIndex(index + 1);
  }, [presentation.slides, addToHistory]);

  const moveSlide = useCallback((fromIndex: number, toIndex: number) => {
    setPresentation((prev) => {
      const slides = [...prev.slides];
      const [movedSlide] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, movedSlide);

      const newPresentation = { ...prev, slides };
      addToHistory(newPresentation);
      return newPresentation;
    });

    setCurrentSlideIndex(toIndex);
  }, [addToHistory]);

  const setCurrentSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
    setSelectedElementIds([]);
  }, []);

  // Element operations
  const addElement = useCallback((element: SlideElement) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: [...newSlides[currentSlideIndex].elements, element],
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });

    setSelectedElementIds([element.id]);
  }, [currentSlideIndex, addToHistory]);

  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: newSlides[currentSlideIndex].elements.map((el) =>
          el.id === id ? { ...el, ...updates } as SlideElement : el
        ),
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });
  }, [currentSlideIndex, addToHistory]);

  const deleteElement = useCallback((id: string) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: newSlides[currentSlideIndex].elements.filter((el) => el.id !== id),
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });

    setSelectedElementIds((prev) => prev.filter((elId) => elId !== id));
  }, [currentSlideIndex, addToHistory]);

  const duplicateElement = useCallback((id: string) => {
    const element = currentSlide.elements.find((el) => el.id === id);
    if (!element) return;

    const newElement = {
      ...element,
      id: uuidv4(),
      bbox: {
        ...element.bbox,
        x: element.bbox.x + 20,
        y: element.bbox.y + 20,
      },
    } as SlideElement;

    addElement(newElement);
  }, [currentSlide.elements, addElement]);

  const selectElement = useCallback((id: string, addToSelection = false) => {
    if (addToSelection) {
      setSelectedElementIds((prev) =>
        prev.includes(id) ? prev.filter((elId) => elId !== id) : [...prev, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  }, []);

  const selectMultipleElements = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
  }, []);

  // Clipboard operations
  const copy = useCallback(() => {
    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    setClipboard(selectedElements);
  }, [currentSlide.elements, selectedElementIds]);

  const cut = useCallback(() => {
    copy();
    selectedElementIds.forEach((id) => deleteElement(id));
  }, [copy, selectedElementIds, deleteElement]);

  const paste = useCallback(() => {
    if (clipboard.length === 0) return;

    const newElements = clipboard.map((el) => ({
      ...el,
      id: uuidv4(),
      bbox: {
        ...el.bbox,
        x: el.bbox.x + 20,
        y: el.bbox.y + 20,
      },
    })) as SlideElement[];

    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: [...newSlides[currentSlideIndex].elements, ...newElements],
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });

    setSelectedElementIds(newElements.map((el) => el.id));
  }, [clipboard, currentSlideIndex, addToHistory]);

  // Layer operations
  const bringToFront = useCallback((id: string) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      const elements = [...newSlides[currentSlideIndex].elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1 || index === elements.length - 1) return prev;

      const [element] = elements.splice(index, 1);
      elements.push(element);

      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: elements.map((el, i) => ({ ...el, z: i })),
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });
  }, [currentSlideIndex, addToHistory]);

  const sendToBack = useCallback((id: string) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      const elements = [...newSlides[currentSlideIndex].elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1 || index === 0) return prev;

      const [element] = elements.splice(index, 1);
      elements.unshift(element);

      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: elements.map((el, i) => ({ ...el, z: i })),
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });
  }, [currentSlideIndex, addToHistory]);

  const bringForward = useCallback((id: string) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      const elements = [...newSlides[currentSlideIndex].elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1 || index === elements.length - 1) return prev;

      [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];

      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: elements.map((el, i) => ({ ...el, z: i })),
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });
  }, [currentSlideIndex, addToHistory]);

  const sendBackward = useCallback((id: string) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides];
      const elements = [...newSlides[currentSlideIndex].elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1 || index === 0) return prev;

      [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];

      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: elements.map((el, i) => ({ ...el, z: i })),
      };

      const newPresentation = { ...prev, slides: newSlides };
      addToHistory(newPresentation);
      return newPresentation;
    });
  }, [currentSlideIndex, addToHistory]);

  // Alignment operations
  const alignLeft = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    const minX = Math.min(...selectedElements.map((el) => el.bbox.x));

    selectedElementIds.forEach((id) => {
      updateElement(id, { bbox: { ...currentSlide.elements.find((el) => el.id === id)!.bbox, x: minX } });
    });
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const alignCenter = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    const minX = Math.min(...selectedElements.map((el) => el.bbox.x));
    const maxX = Math.max(...selectedElements.map((el) => el.bbox.x + el.bbox.width));
    const centerX = (minX + maxX) / 2;

    selectedElementIds.forEach((id) => {
      const element = currentSlide.elements.find((el) => el.id === id)!;
      updateElement(id, { bbox: { ...element.bbox, x: centerX - element.bbox.width / 2 } });
    });
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const alignRight = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    const maxX = Math.max(...selectedElements.map((el) => el.bbox.x + el.bbox.width));

    selectedElementIds.forEach((id) => {
      const element = currentSlide.elements.find((el) => el.id === id)!;
      updateElement(id, { bbox: { ...element.bbox, x: maxX - element.bbox.width } });
    });
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const alignTop = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    const minY = Math.min(...selectedElements.map((el) => el.bbox.y));

    selectedElementIds.forEach((id) => {
      updateElement(id, { bbox: { ...currentSlide.elements.find((el) => el.id === id)!.bbox, y: minY } });
    });
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const alignMiddle = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    const minY = Math.min(...selectedElements.map((el) => el.bbox.y));
    const maxY = Math.max(...selectedElements.map((el) => el.bbox.y + el.bbox.height));
    const centerY = (minY + maxY) / 2;

    selectedElementIds.forEach((id) => {
      const element = currentSlide.elements.find((el) => el.id === id)!;
      updateElement(id, { bbox: { ...element.bbox, y: centerY - element.bbox.height / 2 } });
    });
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const alignBottom = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    );
    const maxY = Math.max(...selectedElements.map((el) => el.bbox.y + el.bbox.height));

    selectedElementIds.forEach((id) => {
      const element = currentSlide.elements.find((el) => el.id === id)!;
      updateElement(id, { bbox: { ...element.bbox, y: maxY - element.bbox.height } });
    });
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const distributeHorizontally = useCallback(() => {
    if (selectedElementIds.length < 3) return;

    const selectedElements = currentSlide.elements
      .filter((el) => selectedElementIds.includes(el.id))
      .sort((a, b) => a.bbox.x - b.bbox.x);

    const first = selectedElements[0];
    const last = selectedElements[selectedElements.length - 1];
    const totalSpace = last.bbox.x - (first.bbox.x + first.bbox.width);
    const gap = totalSpace / (selectedElements.length - 1);

    let currentX = first.bbox.x + first.bbox.width;
    for (let i = 1; i < selectedElements.length - 1; i++) {
      currentX += gap;
      updateElement(selectedElements[i].id, { bbox: { ...selectedElements[i].bbox, x: currentX } });
      currentX += selectedElements[i].bbox.width;
    }
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  const distributeVertically = useCallback(() => {
    if (selectedElementIds.length < 3) return;

    const selectedElements = currentSlide.elements
      .filter((el) => selectedElementIds.includes(el.id))
      .sort((a, b) => a.bbox.y - b.bbox.y);

    const first = selectedElements[0];
    const last = selectedElements[selectedElements.length - 1];
    const totalSpace = last.bbox.y - (first.bbox.y + first.bbox.height);
    const gap = totalSpace / (selectedElements.length - 1);

    let currentY = first.bbox.y + first.bbox.height;
    for (let i = 1; i < selectedElements.length - 1; i++) {
      currentY += gap;
      updateElement(selectedElements[i].id, { bbox: { ...selectedElements[i].bbox, y: currentY } });
      currentY += selectedElements[i].bbox.height;
    }
  }, [selectedElementIds, currentSlide.elements, updateElement]);

  // History operations
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setPresentation(history[historyIndex - 1]);
      setSelectedElementIds([]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setPresentation(history[historyIndex + 1]);
      setSelectedElementIds([]);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Presentation operations
  const updatePresentationSettings = useCallback((settings: Partial<Presentation>) => {
    setPresentation((prev) => {
      const newPresentation = { ...prev, ...settings };
      addToHistory(newPresentation);
      return newPresentation;
    });
  }, [addToHistory]);

  const savePresentation = useCallback(async () => {
    // TODO: Implement save to backend
    console.log("Saving presentation:", presentation);
  }, [presentation]);

  const value: EditorContextType = {
    presentation,
    currentSlideIndex,
    selectedElementIds,
    clipboard,
    history,
    historyIndex,

    addSlide,
    deleteSlide,
    duplicateSlide,
    moveSlide,
    setCurrentSlide,

    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
    selectMultipleElements,
    clearSelection,

    copy,
    cut,
    paste,

    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,

    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,

    undo,
    redo,
    canUndo,
    canRedo,

    updatePresentationSettings,
    savePresentation,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
