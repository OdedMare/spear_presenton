"use client";

import { useSlidesStore } from "../store/slides";

export default function ThumbnailStrip() {
  const slides = useSlidesStore((s) => s.slides);
  const slideIndex = useSlidesStore((s) => s.slideIndex);
  const setSlideIndex = useSlidesStore((s) => s.updateSlideIndex);

  return (
    <div className="h-full overflow-y-auto p-2">
      {slides.length === 0 && (
        <div className="rounded border border-dashed border-slate-200 p-3 text-center text-xs text-slate-500">
          暂无幻灯片
        </div>
      )}
      {slides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`mb-2 cursor-pointer rounded border p-2 text-xs ${
            idx === slideIndex
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => setSlideIndex(idx)}
        >
          <div className="line-clamp-2 text-slate-700">
            {slide.type || "Slide"} #{idx + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

