"use client";

import { useRef } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";

export default function CanvasStage() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasScale = useMainStore((s) => s.canvasScale);
  const viewportSize = useSlidesStore((s) => s.viewportSize);
  const viewportRatio = useSlidesStore((s) => s.viewportRatio);

  const width = viewportSize;
  const height = viewportSize * viewportRatio;

  return (
    <div
      ref={canvasRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#efefef]"
    >
      <div
        className="relative shadow-lg"
        style={{
          width,
          height,
          transform: `scale(${canvasScale})`,
          transformOrigin: "top left",
          background: "#fff",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Canvas coming soon (parity port in progress)
        </div>
      </div>
    </div>
  );
}
