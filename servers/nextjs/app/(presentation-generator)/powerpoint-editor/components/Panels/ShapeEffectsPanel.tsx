"use client";

import React, { useState } from "react";
import { ShapeElement } from "../../types";

interface ShapeEffectsPanelProps {
  selectedShape: ShapeElement | null;
  onUpdate: (updates: Partial<ShapeElement>) => void;
}

export const ShapeEffectsPanel: React.FC<ShapeEffectsPanelProps> = ({
  selectedShape,
  onUpdate,
}) => {
  const [fillType, setFillType] = useState<"solid" | "gradient" | "none">("solid");
  const [fillColor, setFillColor] = useState(selectedShape?.fill?.value || "#0078d4");
  const [outlineColor, setOutlineColor] = useState(selectedShape?.border?.color || "#003f7f");
  const [outlineWidth, setOutlineWidth] = useState(selectedShape?.border?.width || 2);
  const [opacity, setOpacity] = useState((selectedShape?.opacity || 1) * 100);

  // Shadow controls
  const [shadowEnabled, setShadowEnabled] = useState(!!selectedShape?.shadow);
  const [shadowOffsetX, setShadowOffsetX] = useState(selectedShape?.shadow?.offsetX || 4);
  const [shadowOffsetY, setShadowOffsetY] = useState(selectedShape?.shadow?.offsetY || 4);
  const [shadowBlur, setShadowBlur] = useState(selectedShape?.shadow?.blur || 8);
  const [shadowColor, setShadowColor] = useState(selectedShape?.shadow?.color || "rgba(0,0,0,0.3)");

  if (!selectedShape) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Select a shape to edit its properties</p>
      </div>
    );
  }

  const handleFillChange = (color: string) => {
    setFillColor(color);
    onUpdate({
      fill: { type: "solid", value: color },
    });
  };

  const handleOutlineChange = (color: string, width: number) => {
    setOutlineColor(color);
    setOutlineWidth(width);
    onUpdate({
      border: { width, color, style: "solid" },
    });
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    onUpdate({ opacity: value / 100 });
  };

  const handleShadowToggle = (enabled: boolean) => {
    setShadowEnabled(enabled);
    if (enabled) {
      onUpdate({
        shadow: {
          offsetX: shadowOffsetX,
          offsetY: shadowOffsetY,
          blur: shadowBlur,
          color: shadowColor,
        },
      });
    } else {
      onUpdate({ shadow: undefined });
    }
  };

  const handleShadowChange = (offsetX: number, offsetY: number, blur: number, color: string) => {
    setShadowOffsetX(offsetX);
    setShadowOffsetY(offsetY);
    setShadowBlur(blur);
    setShadowColor(color);

    if (shadowEnabled) {
      onUpdate({
        shadow: { offsetX, offsetY, blur, color },
      });
    }
  };

  return (
    <div className="w-full space-y-6 p-4">
      {/* Fill Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Fill</h3>

        {/* Fill Type Selector */}
        <div className="space-y-2 mb-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="fillType"
              value="solid"
              checked={fillType === "solid"}
              onChange={() => setFillType("solid")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Solid fill</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="fillType"
              value="gradient"
              checked={fillType === "gradient"}
              onChange={() => setFillType("gradient")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Gradient fill</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="fillType"
              value="none"
              checked={fillType === "none"}
              onChange={() => setFillType("none")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">No fill</span>
          </label>
        </div>

        {/* Color Picker (only for solid) */}
        {fillType === "solid" && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => handleFillChange(e.target.value)}
                className="w-12 h-10 cursor-pointer border border-gray-300 rounded"
              />
              <input
                type="text"
                value={fillColor}
                onChange={(e) => handleFillChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Outline Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Outline</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={outlineColor}
                onChange={(e) => handleOutlineChange(e.target.value, outlineWidth)}
                className="w-12 h-10 cursor-pointer border border-gray-300 rounded"
              />
              <input
                type="text"
                value={outlineColor}
                onChange={(e) => handleOutlineChange(e.target.value, outlineWidth)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Width: {outlineWidth}px
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={outlineWidth}
              onChange={(e) => handleOutlineChange(outlineColor, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Shadow Section */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <h3 className="text-sm font-semibold text-gray-800">Shadow</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shadowEnabled}
              onChange={(e) => handleShadowToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">Enable</span>
          </label>
        </div>

        {shadowEnabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Offset X: {shadowOffsetX}px
              </label>
              <input
                type="range"
                min="-20"
                max="20"
                value={shadowOffsetX}
                onChange={(e) => handleShadowChange(Number(e.target.value), shadowOffsetY, shadowBlur, shadowColor)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Offset Y: {shadowOffsetY}px
              </label>
              <input
                type="range"
                min="-20"
                max="20"
                value={shadowOffsetY}
                onChange={(e) => handleShadowChange(shadowOffsetX, Number(e.target.value), shadowBlur, shadowColor)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Blur: {shadowBlur}px
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={shadowBlur}
                onChange={(e) => handleShadowChange(shadowOffsetX, shadowOffsetY, Number(e.target.value), shadowColor)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={shadowColor}
                onChange={(e) => handleShadowChange(shadowOffsetX, shadowOffsetY, shadowBlur, e.target.value)}
                className="w-full h-10 cursor-pointer border border-gray-300 rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Opacity Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Opacity</h3>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            {opacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
