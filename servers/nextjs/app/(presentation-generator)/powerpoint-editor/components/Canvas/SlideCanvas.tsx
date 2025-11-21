"use client";

import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useEditor } from "../../context/EditorContext";
import { ElementRenderer } from "./ElementRenderer";

export const SlideCanvas: React.FC = () => {
  const { presentation, currentSlideIndex, clearSelection } = useEditor();
  const [zoom, setZoom] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 });
  const containerRef = useRef<HTMLDivElement>(null);

  const slide = presentation.slides[currentSlideIndex];

  // Calculate zoom to fit
  useEffect(() => {
    const calculateZoom = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const padding = 80;
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;

      const scaleX = availableWidth / presentation.width;
      const scaleY = availableHeight / presentation.height;
      const newZoom = Math.min(scaleX, scaleY, 1);

      setZoom(newZoom);
      setStageSize({
        width: presentation.width * newZoom,
        height: presentation.height * newZoom,
      });
    };

    calculateZoom();
    window.addEventListener("resize", calculateZoom);
    return () => window.removeEventListener("resize", calculateZoom);
  }, [presentation.width, presentation.height]);

  return (
    <div
      ref={containerRef}
      className="pptx-canvas"
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "CANVAS") {
          clearSelection();
        }
      }}
    >
      <div
        className="pptx-canvas-slide"
        style={{
          width: stageSize.width,
          height: stageSize.height,
        }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={zoom}
          scaleY={zoom}
        >
          <Layer>
            {/* Slide background */}
            <Rect
              x={0}
              y={0}
              width={presentation.width}
              height={presentation.height}
              fill={
                slide.background.type === "solid"
                  ? slide.background.color
                  : "#FFFFFF"
              }
            />

            {/* Render elements */}
            {slide.elements
              .sort((a, b) => a.z - b.z)
              .map((element) => (
                <ElementRenderer key={element.id} element={element} zoom={zoom} />
              ))}
          </Layer>
        </Stage>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow text-xs">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
