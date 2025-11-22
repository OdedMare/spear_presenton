"use client";

import { useSlidesStore } from "../store/slides";
import { Plus, Copy, Trash2 } from "lucide-react";

export default function ThumbnailStrip() {
  const slides = useSlidesStore((s) => s.slides);
  const slideIndex = useSlidesStore((s) => s.slideIndex);
  const setSlideIndex = useSlidesStore((s) => s.updateSlideIndex);
  const addBlankSlideAfter = useSlidesStore((s) => s.addBlankSlideAfter);
  const duplicateSlide = useSlidesStore((s) => s.duplicateSlide);
  const deleteSlide = useSlidesStore((s) => s.deleteSlide);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-2">
        <button
          className="flex items-center gap-1 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
          onClick={() => addBlankSlideAfter(slideIndex)}
        >
          <Plus className="h-4 w-4" /> New
        </button>
        <button
          className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          onClick={() => duplicateSlide(slideIndex)}
          disabled={!slides.length}
        >
          <Copy className="h-4 w-4" /> Duplicate
        </button>
        <button
          className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          onClick={() => {
            if (!slides.length) return;
            deleteSlide(slides[slideIndex]?.id || "");
          }}
          disabled={!slides.length}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {slides.length === 0 && (
          <div className="rounded border border-dashed border-slate-200 p-3 text-center text-xs text-slate-500">
            No slides yet
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
    </div>
  );
}
