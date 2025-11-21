"use client";

import React from "react";
import { useEditor } from "../context/EditorContext";

export const NotesPanel: React.FC = () => {
  const { presentation, currentSlideIndex } = useEditor();
  const slide = presentation.slides[currentSlideIndex];

  return (
    <div className="pptx-notes-panel">
      <div className="text-xs font-semibold text-gray-600 mb-2">Speaker Notes</div>
      <textarea
        className="pptx-notes-textarea"
        placeholder="Click to add notes..."
        value={slide.notes}
        onChange={(e) => {
          // TODO: Update slide notes
        }}
      />
    </div>
  );
};
