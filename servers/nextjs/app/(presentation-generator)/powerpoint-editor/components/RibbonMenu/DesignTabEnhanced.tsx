"use client";

import React, { useState } from "react";
import { useEditor } from "../../context/EditorContext";
import { Palette, Image, Maximize2 } from "lucide-react";
import { THEME_COLORS, SLIDE_SIZES } from "../../utils/constants";

export const DesignTabEnhanced: React.FC = () => {
  const { presentation, updatePresentationSettings, currentSlideIndex, updateElement } = useEditor();
  const [showBackgroundPane, setShowBackgroundPane] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundType, setBackgroundType] = useState<"solid" | "gradient">("solid");

  const currentSlide = presentation.slides[currentSlideIndex];

  const applyTheme = (themeId: string) => {
    const theme = THEME_COLORS.find((t) => t.id === themeId);
    if (theme) {
      updatePresentationSettings({
        theme: {
          id: theme.id,
          name: theme.name,
          colors: theme.colors,
          fonts: {
            heading: "Arial",
            body: "Arial",
          },
        },
      });
    }
  };

  const applySlideBackground = (color: string) => {
    setBackgroundColor(color);
    // Update current slide background
    const updatedSlides = [...presentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...currentSlide,
      background: { type: "solid", color },
    };
    updatePresentationSettings({ slides: updatedSlides });
  };

  const applyToAllSlides = () => {
    const updatedSlides = presentation.slides.map((slide) => ({
      ...slide,
      background: { type: backgroundType, color: backgroundColor },
    }));
    updatePresentationSettings({ slides: updatedSlides });
  };

  const changeSlideSize = (width: number, height: number) => {
    if (width > 0 && height > 0) {
      updatePresentationSettings({ width, height });
    }
  };

  return (
    <>
      {/* Theme Gallery */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="text-xs font-semibold mb-1">Themes</div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_COLORS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`p-2 border-2 rounded hover:border-blue-500 transition-colors ${
                  presentation.theme.id === theme.id ? "border-blue-600" : "border-gray-200"
                }`}
                title={theme.name}
              >
                <div className="flex gap-1 h-6">
                  <div
                    className="flex-1 rounded"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="flex-1 rounded"
                    style={{ backgroundColor: theme.colors.accent1 }}
                  />
                  <div
                    className="flex-1 rounded"
                    style={{ backgroundColor: theme.colors.accent2 }}
                  />
                  <div
                    className="flex-1 rounded"
                    style={{ backgroundColor: theme.colors.accent3 }}
                  />
                </div>
                <div className="text-xs mt-1 text-center">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Themes</div>
      </div>

      {/* Theme Variants */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="text-xs font-semibold mb-1">Variants</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Light", bg: "#FFFFFF", text: "#000000" },
              { name: "Dark", bg: "#2C2C2C", text: "#FFFFFF" },
              { name: "Blue", bg: "#0078D4", text: "#FFFFFF" },
              { name: "Green", bg: "#107C10", text: "#FFFFFF" },
            ].map((variant) => (
              <button
                key={variant.name}
                className="p-2 border border-gray-200 rounded hover:border-blue-500 transition-colors"
                onClick={() => applySlideBackground(variant.bg)}
                title={variant.name}
              >
                <div
                  className="h-8 rounded flex items-center justify-center text-xs"
                  style={{ backgroundColor: variant.bg, color: variant.text }}
                >
                  {variant.name}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Variants</div>
      </div>

      {/* Customize */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          {/* Slide Size */}
          <div className="relative group">
            <button className="pptx-btn flex items-center gap-2 w-full" title="Slide Size">
              <Maximize2 size={16} />
              <span className="text-sm">Slide Size</span>
            </button>
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-10 min-w-[200px]">
              {SLIDE_SIZES.map((size, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={() => changeSlideSize(size.width, size.height)}
                  disabled={size.width === 0}
                >
                  {size.name}
                  {size.width > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({size.width}×{size.height})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Format Background */}
          <button
            className="pptx-btn flex items-center gap-2"
            onClick={() => setShowBackgroundPane(!showBackgroundPane)}
            title="Format Background"
          >
            <Image size={16} />
            <span className="text-sm">Format Background</span>
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Customize</div>
      </div>

      {/* Background Format Pane */}
      {showBackgroundPane && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Format Background</h3>
              <button
                onClick={() => setShowBackgroundPane(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Fill Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Fill</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="fillType"
                    value="solid"
                    checked={backgroundType === "solid"}
                    onChange={() => setBackgroundType("solid")}
                  />
                  <span className="text-sm">Solid fill</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="fillType"
                    value="gradient"
                    checked={backgroundType === "gradient"}
                    onChange={() => setBackgroundType("gradient")}
                  />
                  <span className="text-sm">Gradient fill</span>
                </label>
              </div>
            </div>

            {/* Color Picker */}
            {backgroundType === "solid" && (
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full h-10 cursor-pointer border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            )}

            {/* Theme Colors */}
            <div>
              <label className="block text-sm font-medium mb-2">Theme Colors</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(presentation.theme.colors).slice(0, 10).map(([key, color]) => (
                  <button
                    key={key}
                    className="w-10 h-10 rounded border border-gray-300 hover:border-blue-500 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                    title={key}
                  />
                ))}
              </div>
            </div>

            {/* Preset Colors */}
            <div>
              <label className="block text-sm font-medium mb-2">Standard Colors</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  "#FFFFFF",
                  "#000000",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FFFF00",
                  "#FF00FF",
                  "#00FFFF",
                  "#C0C0C0",
                  "#808080",
                ].map((color) => (
                  <button
                    key={color}
                    className="w-10 h-10 rounded border border-gray-300 hover:border-blue-500 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Apply Buttons */}
            <div className="pt-4 border-t space-y-2">
              <button
                onClick={() => applySlideBackground(backgroundColor)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply to This Slide
              </button>
              <button
                onClick={applyToAllSlides}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Apply to All Slides
              </button>
              <button
                onClick={() => {
                  setBackgroundColor("#FFFFFF");
                  setBackgroundType("solid");
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Reset Background
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
