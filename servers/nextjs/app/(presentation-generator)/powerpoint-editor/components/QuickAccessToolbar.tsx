"use client";

import React from "react";
import { Save, Undo, Redo } from "lucide-react";
import { useEditor } from "../context/EditorContext";

export const QuickAccessToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, savePresentation, presentation } = useEditor();
  const [name, setName] = React.useState(presentation.name);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#0078d4]">
      <button
        className="inline-flex items-center justify-center w-8 h-8 text-white border border-white/30 rounded hover:bg-white/10"
        onClick={savePresentation}
        title="Save (Ctrl+S)"
      >
        <Save size={16} />
      </button>
      <button
        className="inline-flex items-center justify-center w-8 h-8 text-white border border-white/30 rounded hover:bg-white/10 disabled:opacity-40"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
      </button>
      <button
        className="inline-flex items-center justify-center w-8 h-8 text-white border border-white/30 rounded hover:bg-white/10 disabled:opacity-40"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
      </button>
      <div className="ml-4">
        <input
          type="text"
          className="bg-transparent border-none outline-none text-white text-sm font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            /* TODO: Update presentation name */
          }}
        />
      </div>
    </div>
  );
};
