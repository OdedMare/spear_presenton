"use client";

import React, { useState, useRef } from "react";
import Header from "../dashboard/components/Header";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { SaveTemplateDialog } from "./components/SaveTemplateDialog";
import { useTemplateBuilder } from "./hooks/useTemplateBuilder";
import { Button } from "@/components/ui/button";
import { Download, Save, Plus } from "lucide-react";

const TemplateBuilderPage = () => {
  const {
    slides,
    currentSlideIndex,
    selectedElement,
    addSlide,
    deleteSlide,
    selectSlide,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    saveTemplate,
    isSaving,
  } = useTemplateBuilder();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentSlide = slides[currentSlideIndex];

  const handleSave = async (name: string, description: string) => {
    const success = await saveTemplate(name, description);
    if (success) {
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Visual Template Builder
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Create custom presentation layouts visually - no PPTX needed!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowSaveDialog(true)}
              disabled={slides.length === 0 || isSaving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Main Editor Layout */}
        <div className="grid grid-cols-[280px_1fr_320px] gap-6 h-[calc(100vh-240px)]">
          {/* Left Sidebar - Toolbar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-y-auto">
            <Toolbar onAddElement={addElement} />

            {/* Slides Panel */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Slides</h3>
                <Button
                  onClick={addSlide}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => selectSlide(index)}
                    className={`
                      relative p-3 rounded border cursor-pointer transition-all
                      ${currentSlideIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="text-sm font-medium">Slide {index + 1}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {slide.elements.length} elements
                    </div>

                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(index);
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-auto">
            <Canvas
              ref={canvasRef}
              slide={currentSlide}
              selectedElement={selectedElement}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
            />
          </div>

          {/* Right Sidebar - Properties */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-y-auto">
            <PropertiesPanel
              selectedElement={selectedElement}
              slide={currentSlide}
              onUpdateElement={updateElement}
              onUpdateSlide={(updates) => {
                // Update slide background
                const updatedSlide = { ...currentSlide, ...updates };
                // This will be handled by the hook
              }}
            />
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <SaveTemplateDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default TemplateBuilderPage;
