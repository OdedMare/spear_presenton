"use client";

import clsx from "clsx";
import type { PPTElement } from "../types/pptist";

interface EditableElementProps {
  element: PPTElement;
  scale: number;
  isActive: boolean;
  onSelect: (append: boolean) => void;
}

const baseStyles =
  "absolute outline-none select-none transition-shadow duration-150 focus:outline-none";

const renderContent = (el: PPTElement) => {
  if (el.type === "text") {
    return (
      <div
        className="w-full h-full"
        style={{ color: (el as any).defaultColor || "#1f2937" }}
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
        style={{ opacity: (el as any).opacity ?? 1 }}
      />
    );
  }
  // shape/line fallback
  const fill = (el as any).fill;
  const bg =
    typeof fill === "string"
      ? fill
      : fill?.colors?.[0]?.color || "#e5e7eb";
  return <div className="h-full w-full" style={{ background: bg }} />;
};

export default function EditableElement({
  element,
  scale,
  isActive,
  onSelect,
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
      }}
    >
      {renderContent(element)}
    </div>
  );
}

