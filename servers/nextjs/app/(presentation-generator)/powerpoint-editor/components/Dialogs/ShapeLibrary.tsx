"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { SHAPE_CATEGORIES, SHAPES, getShapesByCategory, ShapeConfig } from "../../configs/shapes";

interface ShapeLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelectShape: (shapeId: string) => void;
}

export const ShapeLibrary: React.FC<ShapeLibraryProps> = ({
  open,
  onClose,
  onSelectShape,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("basic");
  const [searchQuery, setSearchQuery] = useState("");

  if (!open) return null;

  const filteredShapes = searchQuery
    ? SHAPES.filter((shape) =>
        shape.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getShapesByCategory(selectedCategory);

  const handleShapeClick = (shapeId: string) => {
    onSelectShape(shapeId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-2xl w-[720px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-lg font-semibold text-gray-800">Shape Library</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-200 rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shapes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          {!searchQuery && (
            <div className="w-48 border-r bg-gray-50 overflow-y-auto">
              <div className="p-2">
                {SHAPE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shapes Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredShapes.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg">No shapes found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {filteredShapes.map((shape) => (
                  <ShapePreview
                    key={shape.id}
                    shape={shape}
                    onClick={() => handleShapeClick(shape.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredShapes.length} {filteredShapes.length === 1 ? "shape" : "shapes"} available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShapePreviewProps {
  shape: ShapeConfig;
  onClick: () => void;
}

const ShapePreview: React.FC<ShapePreviewProps> = ({ shape, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Shape SVG */}
      <div className="w-full h-full flex items-center justify-center p-4 bg-white">
        <svg
          viewBox={shape.viewBox || "0 0 100 100"}
          className="w-full h-full"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          <path
            d={shape.path}
            fill={shape.fill || "#0078d4"}
            stroke={shape.stroke || "#003f7f"}
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-blue-600 bg-opacity-90 flex items-center justify-center transition-all">
          <div className="text-white text-center px-2">
            <p className="text-xs font-medium leading-tight">{shape.name}</p>
            <p className="text-[10px] mt-1 opacity-90">Click to insert</p>
          </div>
        </div>
      )}
    </div>
  );
};
