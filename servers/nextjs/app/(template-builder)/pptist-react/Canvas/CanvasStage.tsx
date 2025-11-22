"use client";

import { useRef } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";
import { useContextMenu } from "../hooks/useContextMenu";
import { ContextMenu } from "../components/contextmenu/ContextMenu";
import type { ContextMenuItem } from "../components/contextmenu/types";
import { useViewportSize } from "../hooks/useViewportSize";
import EditableElement from "./EditableElement";
import { SelectionHandles } from "./SelectionHandles";
import { AlignmentLines } from "./AlignmentLines";

export default function CanvasStage() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasScale = useMainStore((s) => s.canvasScale);
  const activeElementIdList = useMainStore((s) => s.activeElementIdList);
  const setActiveElementIdList = useMainStore((s) => s.setActiveElementIdList);
  const setDragStart = useMainStore((s) => s.setDragStart);
  const setIsDraggingElement = useMainStore((s) => s.setIsDraggingElement);
  const setAlignmentLines = useMainStore((s) => s.setAlignmentLines);
  const alignmentLines = useMainStore((s) => s.alignmentLines);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const viewportSize = useSlidesStore((s) => s.viewportSize);
  const viewportRatio = useSlidesStore((s) => s.viewportRatio);
  const slideIndex = useSlidesStore((s) => s.slideIndex);
  const currentSlide = useSlidesStore(
    (s) => s.slides[Math.max(Math.min(s.slideIndex, s.slides.length - 1), 0)]
  );
  const { viewportStyles, dragViewport } = useViewportSize(canvasRef);
  const {
    axis,
    targetEl,
    menus,
    isOpen,
    openContextMenu,
    closeContextMenu,
  } = useContextMenu();

  const width = viewportSize;
  const height = viewportSize * viewportRatio;

  const placeholderMenus: ContextMenuItem[] = [
    { text: "Add Text", handler: () => {} },
    { text: "Add Shape", handler: () => {} },
    { text: "Duplicate Slide", handler: () => {} },
    { divider: true },
    { text: "Delete", handler: () => {} },
  ];

  return (
    <>
      <div
        ref={canvasRef}
        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#efefef]"
        onContextMenu={(e) => openContextMenu(e, placeholderMenus)}
        onMouseDown={(e) => {
          // Click on blank clears selection
          if (e.target === canvasRef.current) {
            setActiveElementIdList([]);
          }
          setIsDraggingElement(false);
          setDragStart(undefined);
        }}
      >
        <div
          className="relative shadow-lg"
          style={{
            width: viewportStyles.width * canvasScale,
            height: viewportStyles.height * canvasScale,
            left: viewportStyles.left,
            top: viewportStyles.top,
            position: "absolute",
          }}
          onMouseDown={(e) => {
            if (e.button === 1 || e.button === 0) {
              dragViewport(e);
            }
          }}
        >
          <div
            className="absolute inset-0 origin-top-left"
            style={{
              width,
              height,
              transform: `scale(${canvasScale})`,
              background: "#fff",
            }}
          >
            <AlignmentLines lines={alignmentLines} scale={canvasScale} />
            {currentSlide?.elements?.map((el, idx) => (
              <EditableElement
                key={el.id || idx}
                element={el}
                scale={canvasScale}
                isActive={activeElementIdList.includes(el.id)}
                onSelect={(append) => {
                  if (append) {
                    setActiveElementIdList([...new Set([...activeElementIdList, el.id])]);
                  } else {
                    setActiveElementIdList([el.id]);
                  }
                }}
                onMove={(id, left, top) => {
                  // Simple snap: align to center of slide
                  const lines: { type: "vertical" | "horizontal"; x?: number; y?: number }[] = [];
                  const cx = left + el.width / 2;
                  const cy = top + el.height / 2;
                  const slideCx = viewportSize / 2;
                  const slideCy = (viewportSize * viewportRatio) / 2;
                  let snappedLeft = left;
                  let snappedTop = top;
                  const snapTol = 4;
                  if (Math.abs(cx - slideCx) <= snapTol) {
                    lines.push({ type: "vertical", x: slideCx });
                    snappedLeft = slideCx - el.width / 2;
                  }
                  if (Math.abs(cy - slideCy) <= snapTol) {
                    lines.push({ type: "horizontal", y: slideCy });
                    snappedTop = slideCy - el.height / 2;
                  }
                  setAlignmentLines(lines);
                  updateElement({ id, props: { left, top }, slideId: currentSlide?.id });
                }}
                onMouseDownEx={(e, el) => {
                  setIsDraggingElement(true);
                  setDragStart({ x: e.pageX, y: e.pageY });
                  if (!activeElementIdList.includes(el.id)) {
                    setActiveElementIdList([el.id]);
                  }
                }}
              />
            ))}
            {currentSlide && activeElementIdList.length === 1 && (
              <SelectionHandles
                element={
                  currentSlide.elements.find(
                    (el) => el.id === activeElementIdList[0]
                  ) as any
                }
                scale={canvasScale}
                onResize={(id, props) => {
                  updateElement({ id, props, slideId: currentSlide?.id });
                }}
              />
            )}
            {!currentSlide && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                Add a slide to start designing
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && axis && (
        <ContextMenu
          axis={axis}
          targetEl={targetEl || undefined}
          menus={menus}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}
