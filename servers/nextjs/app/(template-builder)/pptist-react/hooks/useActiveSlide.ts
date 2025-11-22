"use client";

import { useSlidesStore } from "../store/slides";

export const useActiveSlide = () => {
  const slideIndex = useSlidesStore((s) => s.slideIndex);
  const slides = useSlidesStore((s) => s.slides);
  const currentSlide =
    slides[Math.max(Math.min(slideIndex, slides.length - 1), 0)] || null;
  return { slideIndex, currentSlide, slides };
};

