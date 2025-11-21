"use client";

import React, { useState } from "react";
import { useEditor } from "../context/EditorContext";
import { ZoomIn, ZoomOut, Maximize2, StickyNote } from "lucide-react";

interface StatusBarProps {
  onToggleNotes: () => void;
  showNotes: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onToggleNotes, showNotes }) => {
  const { presentation, currentSlideIndex } = useEditor();
  const [zoom, setZoom] = useState(100);

  return (
    <div className="pptx-status-bar">
      <div className="flex items-center gap-4">
        <span className="text-xs">
          Slide {currentSlideIndex + 1} of {presentation.slides.length}
        </span>
        <button
          className="flex items-center gap-1 text-xs hover:underline"
          onClick={onToggleNotes}
        >
          <StickyNote size={14} />
          {showNotes ? "Hide" : "Show"} Notes
        </button>
      </div>

      <div className="pptx-zoom-controls">
        <button
          className="pptx-btn pptx-btn-icon"
          onClick={() => setZoom(Math.max(10, zoom - 10))}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <input
          type="range"
          className="pptx-zoom-slider"
          min="10"
          max="400"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
        />
        <span className="text-xs w-12 text-center">{zoom}%</span>
        <button
          className="pptx-btn pptx-btn-icon"
          onClick={() => setZoom(Math.min(400, zoom + 10))}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          className="pptx-btn pptx-btn-icon"
          onClick={() => setZoom(100)}
          title="Fit to Window"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
};
