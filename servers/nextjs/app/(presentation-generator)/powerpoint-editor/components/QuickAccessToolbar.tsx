"use client";

import React, { useState } from "react";
import { Save, Undo, Redo, ChevronDown, FileText, FolderOpen, Download } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { SaveTemplateDialog } from "./Dialogs/SaveTemplateDialog";
import { TemplateSelector } from "./Dialogs/TemplateSelector";

export const QuickAccessToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, savePresentation, presentation, loadPresentation } = useEditor();
  const [name, setName] = React.useState(presentation.name);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  return (
    <>
      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onClose={() => setShowSaveTemplateDialog(false)}
      />
      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(newPresentation) => {
          loadPresentation(newPresentation);
          setName(newPresentation.name);
        }}
      />

      <div className="flex items-center gap-2 px-4 py-2 bg-[#0078d4]">
        {/* File Menu Dropdown */}
        <div className="relative">
          <button
            className="inline-flex items-center gap-1 px-3 h-8 text-white border border-white/30 rounded hover:bg-white/10"
            onClick={() => setShowFileMenu(!showFileMenu)}
            title="File Menu"
          >
            <FileText size={16} />
            <span className="text-xs">File</span>
            <ChevronDown size={14} />
          </button>

          {showFileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFileMenu(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setShowFileMenu(false);
                    savePresentation();
                  }}
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowSaveTemplateDialog(true);
                  }}
                >
                  <Download size={16} />
                  Save as Template
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setShowFileMenu(false);
                    setShowTemplateSelector(true);
                  }}
                >
                  <FolderOpen size={16} />
                  Open Template
                </button>
              </div>
            </>
          )}
        </div>

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
    </>
  );
};
