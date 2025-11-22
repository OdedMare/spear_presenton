"use client";

import { useEffect } from "react";
import HeaderBar from "./Toolbar/HeaderBar";
import CanvasStage from "./Canvas/CanvasStage";
import ThumbnailStrip from "./Slides/ThumbnailStrip";
import InspectorPanel from "./Inspector/InspectorPanel";
import LayersPanel from "./Layers/LayersPanel";
import "./styles/tailwind-overrides.css";
import { useSlidesStore } from "./store/slides";
import { useMainStore } from "./store/main";
import { useGlobalHotkey } from "./hooks/useGlobalHotkey";

export default function AppShell() {
  const setSlides = useSlidesStore((s) => s.setSlides);
  const setTitle = useSlidesStore((s) => s.setTitle);
  const { setShowRuler } = useMainStore((s) => ({
    setShowRuler: s.setRulerState,
  }));

  useGlobalHotkey();

  // Temporary bootstrap: mimic pptist onMounted fetching mock data
  useEffect(() => {
    setTitle("Untitled Presentation");
    setSlides([]);
    setShowRuler(false);
  }, [setSlides, setTitle, setShowRuler]);

  return (
    <div className="flex h-full w-full flex-col bg-[#f5f5f5]">
      <HeaderBar />
      <div className="flex h-[calc(100%-40px)] min-h-0">
        <div className="w-[160px] flex-shrink-0 border-r border-slate-200 bg-white">
          <ThumbnailStrip />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-[40px] flex-shrink-0 border-b border-slate-200 bg-white">
            <LayersPanel />
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
