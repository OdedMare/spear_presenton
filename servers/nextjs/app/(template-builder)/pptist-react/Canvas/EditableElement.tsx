"use client";

import clsx from "clsx";
import type { PPTElement } from "../types/pptist";

interface EditableElementProps {
  element: PPTElement;
  scale: number;
  isActive: boolean;
  onSelect: (append: boolean) => void;
  onMove?: (id: string, left: number, top: number) => void;
  onMouseDownEx?: (e: React.MouseEvent, el: PPTElement) => void;
}

const baseStyles =
  "absolute outline-none select-none transition-shadow duration-150 focus:outline-none";

const renderContent = (el: PPTElement) => {
  const opacity = (el as any).opacity ?? 1;
  const outline = (el as any).outline as
    | { color?: string; width?: number; style?: string }
    | undefined;
  const shadow = (el as any).shadow as
    | { h: number; v: number; blur: number; color: string }
    | undefined;
  const commonStyle: React.CSSProperties = {
    opacity,
    border:
      outline && outline.width
        ? `${outline.width || 1}px ${outline.style || "solid"} ${outline.color || "#000"}`
        : undefined,
    boxShadow: shadow
      ? `${shadow.h}px ${shadow.v}px ${shadow.blur}px ${shadow.color}`
      : undefined,
  };
  if (el.type === "text") {
    return (
      <div
        className="w-full h-full"
        style={{
          color: (el as any).defaultColor || "#1f2937",
          background: typeof (el as any).fill === "string" ? (el as any).fill : undefined,
          ...commonStyle,
        }}
        dangerouslySetInnerHTML={{ __html: (el as any).content || "" }}
      />
    );
  }
  if (el.type === "image") {
    const src = (el as any).src || (el as any).url || "";
    return (
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        style={commonStyle}
      />
    );
  }
  // shape/line fallback
  const fill = (el as any).fill;
  const bg =
    typeof fill === "string"
      ? fill
      : fill?.colors?.[0]?.color || "#e5e7eb";
  return <div className="h-full w-full" style={{ background: bg, ...commonStyle }} />;
};

export default function EditableElement({
  element,
  scale,
  isActive,
  onSelect,
  onMove,
  onMouseDownEx,
}: EditableElementProps) {
  const style: React.CSSProperties = {
    left: element.left * scale,
    top: element.top * scale,
    width: element.width * scale,
    height: element.height * scale,
    transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
  };

  return (
    <div
      className={clsx(
        baseStyles,
        isActive ? "ring-2 ring-blue-500" : "ring-1 ring-transparent"
      )}
      style={style}
      tabIndex={0}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(e.shiftKey);
        onMouseDownEx?.(e, element);

        // Drag to move element
        if (onMove) {
          const startX = e.pageX;
          const startY = e.pageY;
          const originLeft = element.left;
          const originTop = element.top;
          let dragging = true;

          const onMouseMove = (evt: MouseEvent) => {
            if (!dragging) return;
            const deltaX = (evt.pageX - startX) / scale;
            const deltaY = (evt.pageY - startY) / scale;
            onMove(element.id, originLeft + deltaX, originTop + deltaY);
          };
          const onMouseUp = () => {
            dragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }
      }}
    >
      {renderContent(element)}
    </div>
  );
}
