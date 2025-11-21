import React from "react";
import { SlideElement, TemplateSlide } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface PropertiesPanelProps {
  selectedElement: string | null;
  slide: TemplateSlide;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateSlide: (updates: Partial<TemplateSlide>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  slide,
  onUpdateElement,
  onUpdateSlide,
}) => {
  const element = slide.elements.find((el) => el.id === selectedElement);

  if (!element) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Slide Properties</h3>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Background Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={slide.background?.color || "#FFFFFF"}
                onChange={(e) =>
                  onUpdateSlide({
                    background: { type: "solid", color: e.target.value },
                  })
                }
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={slide.background?.color || "#FFFFFF"}
                onChange={(e) =>
                  onUpdateSlide({
                    background: { type: "solid", color: e.target.value },
                  })
                }
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Dimensions</Label>
            <div className="text-sm text-gray-600 mt-1">
              {slide.width_px} × {slide.height_px} px
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Element Properties</h3>
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          {element.type}
        </div>
      </div>

      {/* Position & Size */}
      <div className="space-y-3 pb-4 border-b">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">X Position</Label>
            <Input
              type="number"
              value={Math.round(element.bbox.x)}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  bbox: { ...element.bbox, x: parseInt(e.target.value) || 0 },
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Y Position</Label>
            <Input
              type="number"
              value={Math.round(element.bbox.y)}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  bbox: { ...element.bbox, y: parseInt(e.target.value) || 0 },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={Math.round(element.bbox.width)}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  bbox: {
                    ...element.bbox,
                    width: parseInt(e.target.value) || 50,
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={Math.round(element.bbox.height)}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  bbox: {
                    ...element.bbox,
                    height: parseInt(e.target.value) || 50,
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Fill Color */}
      {(element.type === "shape" || element.type === "text") && (
        <div className="space-y-2 pb-4 border-b">
          <Label className="text-sm">Fill Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={
                element.type === "shape"
                  ? element.fill?.color || "#3B82F6"
                  : element.type === "text"
                  ? element.fill?.color || "#F3F4F6"
                  : "#FFFFFF"
              }
              onChange={(e) => {
                if (element.type === "shape" || element.type === "text") {
                  onUpdateElement(element.id, {
                    fill: { type: "solid", color: e.target.value },
                  } as any);
                }
              }}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={
                element.type === "shape"
                  ? element.fill?.color || "#3B82F6"
                  : element.type === "text"
                  ? element.fill?.color || "#F3F4F6"
                  : "#FFFFFF"
              }
              onChange={(e) => {
                if (element.type === "shape" || element.type === "text") {
                  onUpdateElement(element.id, {
                    fill: { type: "solid", color: e.target.value },
                  } as any);
                }
              }}
              className="flex-1 h-10"
            />
          </div>
        </div>
      )}

      {/* Text Properties */}
      {element.type === "text" && element.runs[0] && (
        <div className="space-y-3 pb-4 border-b">
          <div>
            <Label className="text-xs">Text Content</Label>
            <Input
              type="text"
              value={element.runs[0].text}
              onChange={(e) => {
                const updatedRuns = [...element.runs];
                updatedRuns[0] = { ...updatedRuns[0], text: e.target.value };
                onUpdateElement(element.id, { runs: updatedRuns } as any);
              }}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Font Size</Label>
            <Input
              type="number"
              value={element.runs[0].font.size || 24}
              onChange={(e) => {
                const updatedRuns = [...element.runs];
                updatedRuns[0] = {
                  ...updatedRuns[0],
                  font: {
                    ...updatedRuns[0].font,
                    size: parseInt(e.target.value) || 24,
                  },
                };
                onUpdateElement(element.id, { runs: updatedRuns } as any);
              }}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Text Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={element.runs[0].color || "#000000"}
                onChange={(e) => {
                  const updatedRuns = [...element.runs];
                  updatedRuns[0] = {
                    ...updatedRuns[0],
                    color: e.target.value,
                    font: { ...updatedRuns[0].font, color: e.target.value },
                  };
                  onUpdateElement(element.id, { runs: updatedRuns } as any);
                }}
                className="w-16 h-8 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={element.runs[0].color || "#000000"}
                onChange={(e) => {
                  const updatedRuns = [...element.runs];
                  updatedRuns[0] = {
                    ...updatedRuns[0],
                    color: e.target.value,
                    font: { ...updatedRuns[0].font, color: e.target.value },
                  };
                  onUpdateElement(element.id, { runs: updatedRuns } as any);
                }}
                className="flex-1 h-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Text Align</Label>
            <select
              value={element.align}
              onChange={(e) =>
                onUpdateElement(element.id, { align: e.target.value } as any)
              }
              className="w-full h-8 text-sm mt-1 rounded border border-gray-300 px-2"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>
      )}

      {/* Rotation */}
      <div className="space-y-2 pb-4 border-b">
        <Label className="text-sm">Rotation: {element.rotation}°</Label>
        <Slider
          value={[element.rotation]}
          onValueChange={([value]) =>
            onUpdateElement(element.id, { rotation: value })
          }
          min={-180}
          max={180}
          step={1}
          className="mt-2"
        />
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <Label className="text-sm">
          Opacity: {Math.round(element.opacity * 100)}%
        </Label>
        <Slider
          value={[element.opacity * 100]}
          onValueChange={([value]) =>
            onUpdateElement(element.id, { opacity: value / 100 })
          }
          min={0}
          max={100}
          step={1}
          className="mt-2"
        />
      </div>
    </div>
  );
};
