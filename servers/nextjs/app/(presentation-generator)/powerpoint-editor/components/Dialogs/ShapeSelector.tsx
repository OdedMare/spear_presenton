"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { shapeCategories, getShapePath, getShapeName } from "../../utils/shapes";
import { useEditor } from "../../context/EditorContext";
import { ShapeType } from "../../types";

interface ShapeSelectorProps {
  open: boolean;
  onClose: () => void;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({ open, onClose }) => {
  const { addElement } = useEditor();
  const [activeCategory, setActiveCategory] = useState<keyof typeof shapeCategories>("basic");

  if (!open) return null;

  const handleShapeSelect = (shapeType: ShapeType) => {
    addElement({
      id: crypto.randomUUID(),
      type: "shape",
      shapeType,
      bbox: { x: 200, y: 200, width: 200, height: 200 },
      z: 0,
      rotation: 0,
      opacity: 1,
      fill: { type: "solid", value: "#0078d4" },
    });
    onClose();
  };

  const categories = Object.keys(shapeCategories) as Array<keyof typeof shapeCategories>;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Insert Shape</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Shape Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-6 gap-4">
            {shapeCategories[activeCategory].map((shapeType) => (
              <button
                key={shapeType}
                onClick={() => handleShapeSelect(shapeType)}
                className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-lg transition-colors group"
                title={getShapeName(shapeType)}
              >
                <div className="w-16 h-16 flex items-center justify-center mb-2">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    style={{ fill: "#0078d4" }}
                  >
                    <path d={getShapePath(shapeType)} />
                  </svg>
                </div>
                <span className="text-xs text-gray-600 group-hover:text-gray-900 text-center line-clamp-2">
                  {getShapeName(shapeType)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
