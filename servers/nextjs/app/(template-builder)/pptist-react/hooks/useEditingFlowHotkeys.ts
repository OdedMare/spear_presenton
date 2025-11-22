"use client";

import { useEffect } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";

const isInputTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.closest("input,textarea,[contenteditable=true]")) return true;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
};

export const useEditingFlowHotkeys = () => {
  const activeIds = useMainStore((s) => s.activeElementIdList);
  const setActiveIds = useMainStore((s) => s.setActiveElementIdList);
  const disableHotkeys = useMainStore((s) => s.disableHotkeys);
  const editingElementId = useMainStore((s) => s.editingElementId);
  const setEditingElementId = useMainStore((s) => s.setEditingElementId);
  const setDisableHotkeys = useMainStore((s) => s.setDisableHotkeysState);
  const deleteElement = useSlidesStore((s) => s.deleteElement);
  const slides = useSlidesStore((s) => s.slides);
  const slideIndex = useSlidesStore((s) => s.slideIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disableHotkeys && !editingElementId) return;
      if (isInputTarget(e.target) && !editingElementId) return;

      const currentSlide = slides[Math.max(Math.min(slideIndex, slides.length - 1), 0)];

      if (editingElementId) {
        if (e.key === "Escape") {
          setEditingElementId(null);
          setDisableHotkeys(false);
          e.preventDefault();
        }
        return;
      }

      // Delete selection
      if ((e.key === "Delete" || e.key === "Backspace") && activeIds.length) {
        deleteElement(activeIds);
        setActiveIds([]);
        e.preventDefault();
        return;
      }

      // Start typing into selected text on any printable key or Enter
      if (
        activeIds.length === 1 &&
        currentSlide?.elements.find((el) => el.id === activeIds[0])?.type === "text"
      ) {
        const isPrintable =
          e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
        if (isPrintable || e.key === "Enter") {
          setEditingElementId(activeIds[0]);
          setDisableHotkeys(true);
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeIds,
    deleteElement,
    disableHotkeys,
    editingElementId,
    setActiveIds,
    setDisableHotkeys,
    setEditingElementId,
    slideIndex,
    slides,
  ]);
};
