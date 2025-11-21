import React, { forwardRef, useState, useRef, useEffect } from "react";
import { TemplateSlide, SlideElement } from "../types";
import { Trash2 } from "lucide-react";

interface CanvasProps {
  slide: TemplateSlide;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
  ({ slide, selectedElement, onSelectElement, onUpdateElement, onDeleteElement }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [dragging, setDragging] = useState<{
      elementId: string;
      startX: number;
      startY: number;
      offsetX: number;
      offsetY: number;
    } | null>(null);

    const [resizing, setResizing] = useState<{
      elementId: string;
      handle: string;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      startPosX: number;
      startPosY: number;
    } | null>(null);

    // Calculate scale to fit canvas
    useEffect(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const scaleX = (container.clientWidth - 40) / slide.width_px;
        const scaleY = (container.clientHeight - 40) / slide.height_px;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    }, [slide.width_px, slide.height_px]);

    const handleMouseDown = (e: React.MouseEvent, element: SlideElement) => {
      if ((e.target as HTMLElement).classList.contains("resize-handle")) {
        return;
      }

      e.stopPropagation();
      onSelectElement(element.id);

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDragging({
        elementId: element.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: element.bbox.x,
        offsetY: element.bbox.y,
      });
    };

    const handleResizeStart = (e: React.MouseEvent, element: SlideElement, handle: string) => {
      e.stopPropagation();
      onSelectElement(element.id);

      setResizing({
        elementId: element.id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: element.bbox.width,
        startHeight: element.bbox.height,
        startPosX: element.bbox.x,
        startPosY: element.bbox.y,
      });
    };

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (dragging) {
          const dx = (e.clientX - dragging.startX) / scale;
          const dy = (e.clientY - dragging.startY) / scale;

          onUpdateElement(dragging.elementId, {
            bbox: {
              ...slide.elements.find((el) => el.id === dragging.elementId)!.bbox,
              x: Math.max(0, Math.min(slide.width_px - 50, dragging.offsetX + dx)),
              y: Math.max(0, Math.min(slide.height_px - 50, dragging.offsetY + dy)),
            },
          });
        }

        if (resizing) {
          const dx = (e.clientX - resizing.startX) / scale;
          const dy = (e.clientY - resizing.startY) / scale;

          let newWidth = resizing.startWidth;
          let newHeight = resizing.startHeight;
          let newX = resizing.startPosX;
          let newY = resizing.startPosY;

          if (resizing.handle.includes("e")) {
            newWidth = Math.max(50, resizing.startWidth + dx);
          }
          if (resizing.handle.includes("w")) {
            newWidth = Math.max(50, resizing.startWidth - dx);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
          }
          if (resizing.handle.includes("s")) {
            newHeight = Math.max(50, resizing.startHeight + dy);
          }
          if (resizing.handle.includes("n")) {
            newHeight = Math.max(50, resizing.startHeight - dy);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
          }

          onUpdateElement(resizing.elementId, {
            bbox: {
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
            },
          });
        }
      };

      const handleMouseUp = () => {
        setDragging(null);
        setResizing(null);
      };

      if (dragging || resizing) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, resizing, scale, slide, onUpdateElement]);

    const renderElement = (element: SlideElement) => {
      const isSelected = selectedElement === element.id;
      const commonStyle: React.CSSProperties = {
        position: "absolute",
        left: element.bbox.x,
        top: element.bbox.y,
        width: element.bbox.width,
        height: element.bbox.height,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
        cursor: "move",
        border: isSelected ? "2px solid #3B82F6" : "1px solid transparent",
        boxSizing: "border-box",
      };

      let content;

      switch (element.type) {
        case "text":
          content = (
            <div
              style={{
                ...commonStyle,
                backgroundColor: element.fill?.color || "transparent",
                padding: "8px",
                overflow: "hidden",
                textAlign: element.align as any,
              }}
              onMouseDown={(e) => handleMouseDown(e, element)}
            >
              {element.runs.map((run, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: run.font.family,
                    fontSize: run.font.size ? `${run.font.size}px` : "16px",
                    fontWeight: run.font.weight,
                    fontStyle: run.font.style,
                    color: run.color || "#000000",
                    textDecoration: run.underline ? "underline" : "none",
                  }}
                >
                  {run.text}
                </span>
              ))}
            </div>
          );
          break;

        case "shape":
          content = (
            <div
              style={{
                ...commonStyle,
                backgroundColor: element.fill?.color || "transparent",
                border: element.stroke
                  ? `${element.stroke.width}px solid ${element.stroke.color}`
                  : "none",
                borderRadius: element.shape === "OVAL" ? "50%" : "0",
              }}
              onMouseDown={(e) => handleMouseDown(e, element)}
            />
          );
          break;

        case "image":
          content = (
            <div
              style={{
                ...commonStyle,
                backgroundColor: "#E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#6B7280",
              }}
              onMouseDown={(e) => handleMouseDown(e, element)}
            >
              {element.src ? (
                <img
                  src={element.src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: element.object_fit as any,
                  }}
                />
              ) : (
                "Image placeholder"
              )}
            </div>
          );
          break;
      }

      return (
        <div key={element.id} style={{ position: "relative" }}>
          {content}

          {/* Resize Handles */}
          {isSelected && (
            <>
              {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map((handle) => (
                <div
                  key={handle}
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, element, handle)}
                  style={{
                    position: "absolute",
                    width: handle.length === 1 ? "8px" : "12px",
                    height: handle.length === 1 ? "8px" : "12px",
                    backgroundColor: "#3B82F6",
                    border: "2px solid white",
                    borderRadius: "50%",
                    cursor:
                      handle === "nw" || handle === "se"
                        ? "nwse-resize"
                        : handle === "ne" || handle === "sw"
                        ? "nesw-resize"
                        : handle === "n" || handle === "s"
                        ? "ns-resize"
                        : "ew-resize",
                    left:
                      handle.includes("w")
                        ? element.bbox.x - 6
                        : handle.includes("e")
                        ? element.bbox.x + element.bbox.width - 6
                        : element.bbox.x + element.bbox.width / 2 - 4,
                    top:
                      handle.includes("n")
                        ? element.bbox.y - 6
                        : handle.includes("s")
                        ? element.bbox.y + element.bbox.height - 6
                        : element.bbox.y + element.bbox.height / 2 - 4,
                    zIndex: 1000,
                  }}
                />
              ))}

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteElement(element.id);
                }}
                style={{
                  position: "absolute",
                  left: element.bbox.x + element.bbox.width - 30,
                  top: element.bbox.y - 30,
                  zIndex: 1000,
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded p-1.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      );
    };

    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div
          ref={ref}
          onClick={() => onSelectElement(null)}
          style={{
            position: "relative",
            width: slide.width_px,
            height: slide.height_px,
            backgroundColor: slide.background?.color || "#FFFFFF",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {slide.elements.map((element) => renderElement(element))}
        </div>
      </div>
    );
  }
);

Canvas.displayName = "Canvas";
