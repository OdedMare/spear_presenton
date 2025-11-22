"use client";

import { useMemo, useState } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";
import { useActiveSlide } from "../hooks/useActiveSlide";
import type { PPTElement, Slide } from "../types/pptist";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] uppercase tracking-wide text-slate-500">{children}</div>
);

export default function InspectorPanel() {
  const activeIds = useMainStore((s) => s.activeElementIdList);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const updateSlide = useSlidesStore((s) => s.updateSlide);
  const { currentSlide } = useActiveSlide();

  const [localBg, setLocalBg] = useState(
    currentSlide?.background?.color || "#ffffff"
  );

  const activeElement: PPTElement | null = useMemo(() => {
    if (!currentSlide?.elements?.length || !activeIds.length) return null;
    return currentSlide.elements.find((el) => el.id === activeIds[0]) || null;
  }, [activeIds, currentSlide]);

  const updateColor = (key: "defaultColor" | "fill", value: string) => {
    if (!activeElement) return;
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { [key]: value },
    });
  };

  const updateFontSize = (value: number) => {
    if (!activeElement) return;
    const content = (activeElement as any).content || "";
    const updated = content.replace(
      /font-size:\s*\d+px/gi,
      `font-size: ${value}px`
    );
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { content: updated },
    });
  };

  const handleBackgroundChange = (color: string) => {
    if (!currentSlide) return;
    setLocalBg(color);
    const bg = currentSlide.background || { type: "solid" };
    const newBg = { ...bg, type: "solid", color };
    updateSlide({ background: newBg } as Partial<Slide>, currentSlide.id);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-sm text-slate-800 gap-3">
      <div>
        <Label>Slide background</Label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={localBg}
            onChange={(e) => handleBackgroundChange(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-slate-200 bg-white"
          />
          <span className="text-xs text-slate-600">{localBg}</span>
        </div>
      </div>

      {!activeElement && (
        <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-slate-500 text-xs">
          Select an element to edit its properties
        </div>
      )}

      {activeElement && (
        <div className="space-y-3">
          <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
            <Label>Selected element</Label>
            <div className="mt-1 text-xs text-slate-600">
              ID: {activeElement.id} • Type: {activeElement.type}
            </div>
          </div>

          {(activeElement.type === "text" || activeElement.type === "shape") && (
            <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-3">
              <Label>Colors</Label>
              {activeElement.type === "text" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-16">Text</span>
                  <input
                    type="color"
                    value={(activeElement as any).defaultColor || "#000000"}
                    onChange={(e) => updateColor("defaultColor", e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-slate-200 bg-white"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Fill</span>
                <input
                  type="color"
                  value={
                    typeof (activeElement as any).fill === "string"
                      ? ((activeElement as any).fill as string)
                      : "#e5e7eb"
                  }
                  onChange={(e) => updateColor("fill", e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-slate-200 bg-white"
                />
              </div>
            </div>
          )}

          {activeElement.type === "text" && (
            <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-3">
              <Label>Typography</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Font size</span>
                <input
                  type="number"
                  min={8}
                  max={200}
                  defaultValue={16}
                  onBlur={(e) => updateFontSize(Number(e.target.value || 16))}
                  className="h-8 w-20 rounded border border-slate-200 px-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
