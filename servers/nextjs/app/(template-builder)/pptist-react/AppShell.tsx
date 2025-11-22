"use client";

import { useEffect } from "react";
import HeaderBar from "./Toolbar/HeaderBar";
import CanvasStage from "./Canvas/CanvasStage";
import ThumbnailStrip from "./Slides/ThumbnailStrip";
import InspectorPanel from "./Inspector/InspectorPanel";
import CanvasToolbar from "./Toolbar/CanvasToolbar";
import "./styles/tailwind-overrides.css";
import { useSlidesStore } from "./store/slides";
import { useMainStore } from "./store/main";
import { useGlobalHotkey } from "./hooks/useGlobalHotkey";
import { useAlignmentHotkeys } from "./hooks/useAlignmentHotkeys";
import { useEditingFlowHotkeys } from "./hooks/useEditingFlowHotkeys";

export default function AppShell() {
  const setSlides = useSlidesStore((s) => s.setSlides);
  const setTitle = useSlidesStore((s) => s.setTitle);
  const addBlankSlideAfter = useSlidesStore((s) => s.addBlankSlideAfter);
  const slides = useSlidesStore((s) => s.slides);
  const { setShowRuler } = useMainStore((s) => ({
    setShowRuler: s.setRulerState,
  }));

  useGlobalHotkey();
  useAlignmentHotkeys();
  useEditingFlowHotkeys();

  // Temporary bootstrap: mimic pptist onMounted fetching mock data
  useEffect(() => {
    setTitle("Untitled Presentation");
    if (!slides.length) {
      setSlides([]);
      addBlankSlideAfter(-1);
    }
    setShowRuler(false);
  }, [setSlides, setTitle, setShowRuler, addBlankSlideAfter, slides.length]);

  return (
    <div className="flex h-full w-full flex-col bg-[#f5f5f5]">
      <HeaderBar />
      <div className="flex h-[calc(100%-40px)] min-h-0">
        <div className="w-[160px] flex-shrink-0 border-r border-slate-200 bg-white">
          <ThumbnailStrip />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-[56px] flex-shrink-0 border-b border-slate-200 bg-white">
            <CanvasToolbar />
          </div>
          <div className="flex min-h-0 flex-1 bg-[#f7f7f7]">
            <div className="flex min-w-0 flex-1">
              <CanvasStage />
            </div>
            <div className="w-[260px] flex-shrink-0 border-l border-slate-200 bg-white">
              <InspectorPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
