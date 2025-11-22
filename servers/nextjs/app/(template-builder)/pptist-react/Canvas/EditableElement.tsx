"use client";

import clsx from "clsx";
import type { PPTElement } from "../types/pptist";
import { gradientToCss } from "../utils/gradient";
import { buildHtmlFromPlainText } from "../utils/text";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";

interface EditableElementProps {
  element: PPTElement;
  scale: number;
  isActive: boolean;
  onSelect: (append: boolean) => void;
  onMove?: (id: string, left: number, top: number) => void;
  onMouseDownEx?: (e: React.MouseEvent, el: PPTElement) => void;
}

const baseStyles =
  "absolute outline-none transition-shadow duration-150 focus:outline-none";

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
    const content = (el as any).content || "";
    const dir = /dir=['"]rtl['"]/.test(content) ? "rtl" : undefined;
    const fontSize = (el as any).fontSize ?? 16;
    const lineHeight = (el as any).lineHeight ?? 1.35;
    const letterSpacing = (el as any).letterSpacing ?? 0;
    const textAlign = (el as any).textAlign ?? "left";
    const fontWeight = (el as any).fontWeight ?? ((el as any).textBold ? 700 : 400);
    const fontFamily = (el as any).fontFamily;
    const textHighlight = (el as any).textHighlight;
    const fontStyle = (el as any).textItalic ? "italic" : undefined;
    const textDecoration = [
      (el as any).textUnderline ? "underline" : "",
      (el as any).textStrikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (isEditing) {
      return (
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full h-full outline-none"
          style={{
            color: (el as any).defaultColor || "#1f2937",
            background: typeof (el as any).fill === "string" ? (el as any).fill : undefined,
            fontSize,
            lineHeight,
            letterSpacing,
            textAlign,
            fontWeight,
            fontFamily,
            fontStyle,
            textDecoration: textDecoration || undefined,
            backgroundColor: textHighlight || undefined,
            ...commonStyle,
          }}
          dir={dir as any}
          onBlur={() => {
            setEditingElementId(null);
            setDisableHotkeys(false);
          }}
          onInput={(e) => {
            const plain = (e.currentTarget.innerText || "").replace(/\u00a0/g, " ");
            const nextHtml = buildHtmlFromPlainText(plain, {
              fontSize,
              lineHeight,
              letterSpacing,
              textAlign,
              textBold: !!(el as any).textBold,
              textItalic: !!(el as any).textItalic,
              textUnderline: !!(el as any).textUnderline,
              textStrikethrough: !!(el as any).textStrikethrough,
              textHighlight,
              bulletList: !!(el as any).bulletList,
              orderedList: !!(el as any).orderedList,
              textLink: (el as any).textLink,
            });
            updateElement({
              id: el.id,
              slideId: slides[slideIndex]?.id,
              props: { text: plain, content: nextHtml },
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const slide = slides[Math.max(Math.min(slideIndex, slides.length - 1), 0)];
              const textEls = (slide?.elements || []).filter((item) => item.type === "text");
              const idx = textEls.findIndex((item) => item.id === el.id);
              if (textEls.length) {
                const next =
                  e.shiftKey && idx > 0
                    ? textEls[idx - 1]
                    : !e.shiftKey && idx >= 0
                    ? textEls[(idx + 1) % textEls.length]
                    : textEls[0];
                if (next) {
                  setActiveElementIdList([next.id]);
                  setEditingElementId(next.id);
                  setTimeout(() => editableRef.current?.focus(), 0);
                }
              }
            }
          }}
        />
      );
    }

    return (
      <div
        className="w-full h-full"
        style={{
          color: (el as any).defaultColor || "#1f2937",
          background: typeof (el as any).fill === "string" ? (el as any).fill : undefined,
          fontSize,
          lineHeight,
          letterSpacing,
          textAlign,
          fontWeight,
          fontFamily,
          fontStyle,
          textDecoration: textDecoration || undefined,
          backgroundColor: textHighlight || undefined,
          ...commonStyle,
        }}
        dir={dir as any}
        dangerouslySetInnerHTML={{ __html: (el as any).content || "" }}
        onDoubleClick={() => {
          setActiveElementIdList([el.id]);
          setEditingElementId(el.id);
          setDisableHotkeys(true);
        }}
      />
    );
  }
  if (el.type === "image") {
    const src = (el as any).src || (el as any).url || "";
    const crop = (el as any).imageCrop || {};
    const inset = `${crop.top || 0}% ${crop.right || 0}% ${crop.bottom || 0}% ${crop.left || 0}%`;
    const clipPath = crop ? `inset(${inset})` : undefined;
    return (
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        style={{ ...commonStyle, clipPath }}
      />
    );
  }
  // shape/line fallback
  const fill = (el as any).fill;
  const bg = typeof fill === "string" ? fill : fill?.colors?.[0]?.color || "#e5e7eb";
  const gradientBg = typeof fill === "object" && fill?.colors ? gradientToCss(fill) : undefined;
  const preset = (el as any).shapePreset || "rectangle";
  const cornerRadius = (el as any).cornerRadius ?? (preset === "round-rect" ? 12 : 0);

  const presetClipPaths: Record<string, string> = {
    diamond: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
    "arrow-right":
      "polygon(0 20%, 65% 20%, 65% 0, 100% 50%, 65% 100%, 65% 80%, 0 80%)",
    "arrow-left":
      "polygon(100% 20%, 35% 20%, 35% 0, 0 50%, 35% 100%, 35% 80%, 100% 80%)",
    "arrow-up":
      "polygon(20% 100%, 20% 35%, 0 35%, 50% 0, 100% 35%, 80% 35%, 80% 100%)",
    "arrow-down":
      "polygon(20% 0%, 20% 65%, 0 65%, 50% 100%, 100% 65%, 80% 65%, 80% 0%)",
    parallelogram: "polygon(20% 0, 100% 0, 80% 100%, 0 100%)",
    star:
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    cloud:
      "polygon(22% 60%, 0% 55%, 10% 30%, 28% 32%, 30% 20%, 50% 14%, 62% 24%, 72% 18%, 88% 28%, 98% 46%, 92% 60%, 78% 66%, 68% 76%, 50% 80%, 32% 76%)",
    hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    trapezoid: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)",
    chevron: "polygon(0 20%, 50% 50%, 100% 20%, 100% 80%, 50% 50%, 0 80%)",
    "callout-rect": "polygon(0 0, 100% 0, 100% 75%, 60% 75%, 50% 100%, 50% 75%, 0 75%)",
  };

  const shapeStyles: React.CSSProperties = {};
  if (preset === "round-rect") {
    shapeStyles.borderRadius = `${cornerRadius}px`;
  } else if (preset === "ellipse") {
    shapeStyles.borderRadius = "9999px";
  } else if (presetClipPaths[preset]) {
    shapeStyles.clipPath = presetClipPaths[preset];
  } else {
    shapeStyles.borderRadius = cornerRadius ? `${cornerRadius}px` : undefined;
  }
  return (
    <div
      className="h-full w-full"
      style={{ background: gradientBg || bg, ...shapeStyles, ...commonStyle }}
    />
  );
};

export default function EditableElement({
  element,
  scale,
  isActive,
  onSelect,
  onMove,
  onMouseDownEx,
}: EditableElementProps) {
  const editingElementId = useMainStore((s) => s.editingElementId);
  const setEditingElementId = useMainStore((s) => s.setEditingElementId);
  const setDisableHotkeys = useMainStore((s) => s.setDisableHotkeysState);
  const setActiveElementIdList = useMainStore((s) => s.setActiveElementIdList);
  const slides = useSlidesStore((s) => s.slides);
  const slideIndex = useSlidesStore((s) => s.slideIndex);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const isEditing = editingElementId === element.id && element.type === "text";
  const editableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.innerHTML = (element as any).content || "";
      setTimeout(() => {
        editableRef.current?.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        if (editableRef.current.firstChild) {
          range.selectNodeContents(editableRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [element, isEditing]);

  const transforms: string[] = [];
  if ((element as any).flipH) transforms.push("scaleX(-1)");
  if ((element as any).flipV) transforms.push("scaleY(-1)");
  if (element.rotate) transforms.push(`rotate(${element.rotate}deg)`);
  const style: React.CSSProperties = {
    left: element.left * scale,
    top: element.top * scale,
    width: element.width * scale,
    height: element.height * scale,
    transform: transforms.length ? transforms.join(" ") : undefined,
    transformOrigin: "center",
  };

  return (
    <div
      className={clsx(
        baseStyles,
        isActive ? "ring-2 ring-blue-500" : "ring-1 ring-transparent",
        isEditing ? "select-text" : "select-none",
      )}
      style={style}
      tabIndex={0}
      onMouseDown={(e) => {
        e.stopPropagation();
        // avoid dragging while editing text
        if (isEditing) return;

        onSelect(e.shiftKey);
        onMouseDownEx?.(e, element);

        // Drag to move element (skip if editing)
        if (onMove && !isEditing) {
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
