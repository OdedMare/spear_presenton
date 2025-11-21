"use client";

import React from "react";
import { useEditor } from "../../context/EditorContext";

export const PropertiesPanel: React.FC = () => {
  const { presentation, currentSlideIndex, selectedElementIds, updateElement } = useEditor();

  const slide = presentation.slides[currentSlideIndex];
  const selectedElement =
    selectedElementIds.length === 1
      ? slide.elements.find((el) => el.id === selectedElementIds[0])
      : null;

  if (!selectedElement) {
    return (
      <div className="pptx-properties-panel">
        <div className="pptx-properties-section">
          <h3 className="pptx-properties-section-title">Slide Properties</h3>
          <div className="pptx-property-row">
            <span className="pptx-property-label">Background</span>
            <input
              type="color"
              className="pptx-property-input"
              value={slide.background.type === "solid" ? slide.background.color : "#FFFFFF"}
              onChange={(e) => {
                // TODO: Update slide background
              }}
            />
          </div>
          <div className="pptx-property-row">
            <span className="pptx-property-label">Width</span>
            <input
              type="text"
              className="pptx-property-input"
              value={`${presentation.width}px`}
              readOnly
            />
          </div>
          <div className="pptx-property-row">
            <span className="pptx-property-label">Height</span>
            <input
              type="text"
              className="pptx-property-input"
              value={`${presentation.height}px`}
              readOnly
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          Select an element to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className="pptx-properties-panel">
      <div className="pptx-properties-section">
        <h3 className="pptx-properties-section-title">
          {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties
        </h3>

        {/* Position & Size */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">Position & Size</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">X</label>
              <input
                type="number"
                className="pptx-property-input w-full"
                value={Math.round(selectedElement.bbox.x)}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    bbox: { ...selectedElement.bbox, x: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Y</label>
              <input
                type="number"
                className="pptx-property-input w-full"
                value={Math.round(selectedElement.bbox.y)}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    bbox: { ...selectedElement.bbox, y: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Width</label>
              <input
                type="number"
                className="pptx-property-input w-full"
                value={Math.round(selectedElement.bbox.width)}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    bbox: { ...selectedElement.bbox, width: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Height</label>
              <input
                type="number"
                className="pptx-property-input w-full"
                value={Math.round(selectedElement.bbox.height)}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    bbox: { ...selectedElement.bbox, height: parseInt(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="pptx-property-row">
          <span className="pptx-property-label">Rotation</span>
          <input
            type="number"
            className="pptx-property-input"
            value={Math.round(selectedElement.rotation)}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                rotation: parseInt(e.target.value),
              })
            }
          />
        </div>

        {/* Opacity */}
        <div className="pptx-property-row">
          <span className="pptx-property-label">Opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedElement.opacity}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                opacity: parseFloat(e.target.value),
              })
            }
            className="flex-1"
          />
          <span className="text-xs">{Math.round(selectedElement.opacity * 100)}%</span>
        </div>

        {/* Type-specific properties */}
        {selectedElement.type === "text" && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">Text</div>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm"
              rows={4}
              value={selectedElement.content.map((c) => c.text).join("")}
              onChange={(e) => {
                // TODO: Update text content
              }}
            />
          </div>
        )}

        {selectedElement.type === "shape" && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">Fill</div>
            <input
              type="color"
              className="pptx-property-input w-full"
              value={selectedElement.fill?.value || selectedElement.fill?.color || "#0078d4"}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  fill: { type: "solid", value: e.target.value },
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
