"use client";

import { useEffect } from "react";
import { useSlidesStore } from "../store/slides";
import { useMainStore } from "../store/main";

export const useAlignmentHotkeys = () => {
  const activeIds = useMainStore((s) => s.activeElementIdList);
  const disableHotkeys = useMainStore((s) => s.disableHotkeys);
  const alignElements = useSlidesStore((s) => s.alignElements);
  const distributeElements = useSlidesStore((s) => s.distributeElements);
  const rotateElements = useSlidesStore((s) => s.rotateElements);
  const mirrorElements = useSlidesStore((s) => s.mirrorElements);
  const currentSlideId = useSlidesStore(
    (s) => s.slides[Math.max(Math.min(s.slideIndex, s.slides.length - 1), 0)]?.id
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disableHotkeys) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.closest("input,textarea") || target.isContentEditable)) return;

      const meta = e.metaKey || e.ctrlKey;
      if (!meta || !activeIds.length) return;

      const ids = [...activeIds];
      const key = e.key.toLowerCase();

      if (e.shiftKey && e.key === "ArrowLeft") {
        alignElements("left", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (e.shiftKey && e.key === "ArrowRight") {
        alignElements("right", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (e.shiftKey && e.key === "ArrowUp") {
        alignElements("top", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (e.shiftKey && e.key === "ArrowDown") {
        alignElements("bottom", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (e.shiftKey && key === "c") {
        alignElements("center", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (e.shiftKey && key === "m") {
        alignElements("middle", ids, currentSlideId);
        e.preventDefault();
        return;
      }

      if (e.altKey && key === "h") {
        distributeElements("horizontal", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (e.altKey && key === "v") {
        distributeElements("vertical", ids, currentSlideId);
        e.preventDefault();
        return;
      }

      if (!e.shiftKey && key === "[") {
        rotateElements("left", ids, currentSlideId);
        e.preventDefault();
        return;
      }
      if (!e.shiftKey && key === "]") {
        rotateElements("right", ids, currentSlideId);
        e.preventDefault();
        return;
      }

      if (e.shiftKey && key === "h") {
        mirrorElements("horizontal", ids, currentSlideId);
        e.preventDefault();
      }
      if (e.shiftKey && key === "v") {
        mirrorElements("vertical", ids, currentSlideId);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeIds,
    alignElements,
    currentSlideId,
    distributeElements,
    disableHotkeys,
    mirrorElements,
    rotateElements,
  ]);
};
