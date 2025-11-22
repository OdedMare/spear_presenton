"use client";

import { useCallback } from "react";
import type { PPTElement } from "../types/pptist";

type Handle =
  | "lt"
  | "t"
  | "rt"
  | "l"
  | "r"
  | "lb"
  | "b"
  | "rb"
  | "rotate";

interface SelectionHandlesProps {
  element: PPTElement;
  scale: number;
  onResize: (id: string, props: Partial<PPTElement>) => void;
}

const handlePositions: Record<Handle, { x: number; y: number; cursor: string }> = {
  lt: { x: 0, y: 0, cursor: "nwse-resize" },
  t: { x: 0.5, y: 0, cursor: "ns-resize" },
  rt: { x: 1, y: 0, cursor: "nesw-resize" },
  l: { x: 0, y: 0.5, cursor: "ew-resize" },
  r: { x: 1, y: 0.5, cursor: "ew-resize" },
  lb: { x: 0, y: 1, cursor: "nesw-resize" },
  b: { x: 0.5, y: 1, cursor: "ns-resize" },
  rb: { x: 1, y: 1, cursor: "nwse-resize" },
  rotate: { x: 0.5, y: -0.2, cursor: "grab" },
};

export function SelectionHandles({ element, scale, onResize }: SelectionHandlesProps) {
  const { left, top, width, height, rotate = 0 } = element;
  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: left * scale,
    top: top * scale,
    width: width * scale,
    height: height * scale,
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    transformOrigin: "top left",
    pointerEvents: "none",
  };

  const startResize = useCallback(
    (handle: Handle, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.pageX;
      const startY = e.pageY;
      const start = { left, top, width, height, rotate };

      const onMouseMove = (evt: MouseEvent) => {
        const dx = (evt.pageX - startX) / scale;
        const dy = (evt.pageY - startY) / scale;
        let newLeft = start.left;
        let newTop = start.top;
        let newWidth = start.width;
        let newHeight = start.height;
        let newRotate = start.rotate;

        if (handle === "rotate") {
          const cx = start.left + start.width / 2;
          const cy = start.top + start.height / 2;
          const angle = (Math.atan2(evt.pageY / scale - cy, evt.pageX / scale - cx) * 180) / Math.PI;
          newRotate = angle;
        } else {
          if (handle.includes("l")) {
            newLeft = start.left + dx;
            newWidth = start.width - dx;
          }
          if (handle.includes("r")) {
            newWidth = start.width + dx;
          }
          if (handle.includes("t")) {
            newTop = start.top + dy;
            newHeight = start.height - dy;
          }
          if (handle.includes("b")) {
            newHeight = start.height + dy;
          }
          newWidth = Math.max(4, newWidth);
          newHeight = Math.max(4, newHeight);
        }

        onResize(element.id, {
          left: newLeft,
          top: newTop,
          width: newWidth,
          height: newHeight,
          rotate: newRotate,
        });
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [element.id, left, top, width, height, rotate, scale, onResize]
  );

  return (
    <div style={boxStyle} className="pointer-events-none ring-2 ring-blue-500">
      {(Object.keys(handlePositions) as Handle[]).map((key) => {
        const h = handlePositions[key];
        const size = key === "rotate" ? 14 : 8;
        const style: React.CSSProperties = {
          position: "absolute",
          width: size,
          height: size,
          left: h.x * width * scale - size / 2,
          top: h.y * height * scale - size / 2,
          borderRadius: key === "rotate" ? "9999px" : "2px",
          background: key === "rotate" ? "#0ea5e9" : "#fff",
          border: key === "rotate" ? "2px solid #0ea5e9" : "1px solid #0ea5e9",
          cursor: h.cursor,
          pointerEvents: "auto",
        };
        return (
          <div
            key={key}
            style={style}
            onMouseDown={(e) => startResize(key, e)}
            title={key === "rotate" ? "Rotate" : "Resize"}
          />
        );
      })}
    </div>
  );
}

