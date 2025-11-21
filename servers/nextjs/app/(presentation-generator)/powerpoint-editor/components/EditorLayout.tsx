"use client";

import React, { useState, useEffect } from "react";
import { useEditor } from "../context/EditorContext";
import { RibbonMenu } from "./RibbonMenu/RibbonMenu";
import { QuickAccessToolbar } from "./QuickAccessToolbar";
import { SlidesThumbnailPanel } from "./SlidesThumbnailPanel";
import { SlideCanvas } from "./Canvas/SlideCanvas";
import { PropertiesPanel } from "./PropertiesPanel/PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { NotesPanel } from "./NotesPanel";

export const EditorLayout: React.FC = () => {
  const { presentation, currentSlideIndex } = useEditor();
  const [showNotes, setShowNotes] = useState(false);
  const [showProperties, setShowProperties] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // TODO: Save presentation
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        // TODO: Undo
      }

      // Ctrl/Cmd + Shift + Z or Ctrl + Y: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        // TODO: Redo
      }

      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        // TODO: Copy
      }

      // Ctrl/Cmd + X: Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        // TODO: Cut
      }

      // Ctrl/Cmd + V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        // TODO: Paste
      }

      // Delete: Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // TODO: Delete selected elements
      }

      // F5: Start slideshow
      if (e.key === "F5") {
        e.preventDefault();
        // TODO: Start slideshow
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="pptx-editor">
      {/* Quick Access Toolbar + Ribbon */}
      <div className="pptx-editor-header">
        <QuickAccessToolbar />
        <RibbonMenu />
      </div>

      {/* Main Editor Area */}
      <div className="pptx-editor-body">
        {/* Left: Slides Thumbnail Panel */}
        <SlidesThumbnailPanel />

        {/* Center: Canvas */}
        <div className="pptx-editor-canvas-container">
          <SlideCanvas />
          {showNotes && <NotesPanel />}
        </div>

        {/* Right: Properties Panel */}
        {showProperties && <PropertiesPanel />}
      </div>

      {/* Status Bar */}
      <StatusBar
        onToggleNotes={() => setShowNotes(!showNotes)}
        showNotes={showNotes}
      />

      <style jsx>{`
        .pptx-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: #f3f3f3;
          overflow: hidden;
        }

        .pptx-editor-header {
          background: white;
          border-bottom: 1px solid #d1d5db;
          flex-shrink: 0;
        }

        .pptx-editor-body {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .pptx-editor-canvas-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        :global(.pptx-editor *) {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};
