"use client";

import React from "react";
import { SLIDE_LAYOUTS } from "../../utils/constants";
import { X } from "lucide-react";

interface SlideLayoutPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectLayout: (layoutId: string) => void;
}

export const SlideLayoutPicker: React.FC<SlideLayoutPickerProps> = ({
  open,
  onClose,
  onSelectLayout,
}) => {
  if (!open) return null;

  const handleLayoutClick = (layoutId: string) => {
    onSelectLayout(layoutId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Select Slide Layout</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Layout Grid */}
        <div className="p-6 overflow-y-auto max-h-[500px]">
          <div className="grid grid-cols-3 gap-4">
            {SLIDE_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                onClick={() => handleLayoutClick(layout.id)}
                className="group relative border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
              >
                {/* Layout Preview */}
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded flex items-center justify-center mb-3 relative overflow-hidden">
                  {/* Different layout visuals based on type */}
                  {layout.id === "blank" && (
                    <div className="w-full h-full bg-white" />
                  )}
                  {layout.id === "title" && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                      <div className="w-3/4 h-3 bg-gray-300 rounded" />
                      <div className="w-1/2 h-2 bg-gray-200 rounded" />
                    </div>
                  )}
                  {layout.id === "title-content" && (
                    <div className="w-full h-full flex flex-col gap-2 p-3">
                      <div className="w-3/4 h-2 bg-gray-300 rounded" />
                      <div className="flex-1 bg-gray-200 rounded" />
                    </div>
                  )}
                  {layout.id === "section-header" && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                      <div className="w-2/3 h-4 bg-blue-300 rounded" />
                      <div className="w-1/2 h-2 bg-gray-200 rounded" />
                    </div>
                  )}
                  {layout.id === "two-content" && (
                    <div className="w-full h-full flex flex-col gap-2 p-3">
                      <div className="w-3/4 h-2 bg-gray-300 rounded" />
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1 bg-gray-200 rounded" />
                        <div className="flex-1 bg-gray-200 rounded" />
                      </div>
                    </div>
                  )}
                  {layout.id === "comparison" && (
                    <div className="w-full h-full flex gap-2 p-3">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="w-full h-2 bg-blue-300 rounded" />
                        <div className="flex-1 bg-gray-200 rounded" />
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="w-full h-2 bg-green-300 rounded" />
                        <div className="flex-1 bg-gray-200 rounded" />
                      </div>
                    </div>
                  )}
                  {layout.id === "title-only" && (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <div className="w-3/4 h-3 bg-gray-300 rounded" />
                    </div>
                  )}
                  {layout.id === "content-caption" && (
                    <div className="w-full h-full flex gap-2 p-3">
                      <div className="flex-1 bg-gray-200 rounded" />
                      <div className="w-1/3 flex flex-col gap-1">
                        <div className="w-full h-2 bg-gray-300 rounded" />
                        <div className="w-full h-1 bg-gray-200 rounded" />
                        <div className="w-3/4 h-1 bg-gray-200 rounded" />
                      </div>
                    </div>
                  )}
                  {layout.id === "picture-caption" && (
                    <div className="w-full h-full flex flex-col gap-2 p-3">
                      <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded" />
                      <div className="w-full h-2 bg-gray-300 rounded" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 px-3 py-1 rounded">
                      Use Layout
                    </span>
                  </div>
                </div>

                {/* Layout Name */}
                <p className="text-sm font-medium text-gray-700 text-center group-hover:text-blue-600 transition-colors">
                  {layout.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {SLIDE_LAYOUTS.length} layouts available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
