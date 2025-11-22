"use client";

import { useEffect, useRef } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";
import { useContextMenu } from "../hooks/useContextMenu";
import { ContextMenu } from "../components/contextmenu/ContextMenu";
import type { ContextMenuItem } from "../components/contextmenu/types";
import { useViewportSize } from "../hooks/useViewportSize";
import EditableElement from "./EditableElement";
import { SelectionHandles } from "./SelectionHandles";
import { AlignmentLines } from "./AlignmentLines";
import { GridOverlay } from "./GridOverlay";
import type { PPTElement } from "../types/pptist";

export default function CanvasStage() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasScale = useMainStore((s) => s.canvasScale);
  const activeElementIdList = useMainStore((s) => s.activeElementIdList);
  const setActiveElementIdList = useMainStore((s) => s.setActiveElementIdList);
  const setDragStart = useMainStore((s) => s.setDragStart);
  const setIsDraggingElement = useMainStore((s) => s.setIsDraggingElement);
  const setAlignmentLines = useMainStore((s) => s.setAlignmentLines);
  const alignmentLines = useMainStore((s) => s.alignmentLines);
  const snapToGrid = useMainStore((s) => s.snapToGrid);
  const gridSize = useMainStore((s) => s.gridLineSize);
  const guides = useMainStore((s) => s.guides);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const slides = useSlidesStore((s) => s.slides);
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
  const dragSnapshotRef = useRef<{ id: string; left: number; top: number }[]>([]);

  const width = viewportSize;
  const height = viewportSize * viewportRatio;
  const guideLines = [
    ...guides.vertical.map((x) => ({ type: "vertical" as const, x })),
    ...guides.horizontal.map((y) => ({ type: "horizontal" as const, y })),
  ];

  useEffect(() => {
    const onMouseUp = () => {
      setIsDraggingElement(false);
      setAlignmentLines([]);
      setDragStart(undefined);
      dragSnapshotRef.current = [];
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [setIsDraggingElement, setAlignmentLines, setDragStart]);

  const computeSnap = (
    moving: PPTElement,
    proposedLeft: number,
    proposedTop: number
  ): {
    left: number;
    top: number;
    lines: { type: "vertical" | "horizontal"; x?: number; y?: number }[];
  } => {
    const lines: { type: "vertical" | "horizontal"; x?: number; y?: number }[] = [];
    const snapTol = 4;
    const slideCx = viewportSize / 2;
    const slideCy = (viewportSize * viewportRatio) / 2;
    let snappedLeft = proposedLeft;
    let snappedTop = proposedTop;

    // snap to slide center
    const cx = proposedLeft + moving.width / 2;
    const cy = proposedTop + moving.height / 2;
    if (Math.abs(cx - slideCx) <= snapTol) {
      lines.push({ type: "vertical", x: slideCx });
      snappedLeft = slideCx - moving.width / 2;
    }
    if (Math.abs(cy - slideCy) <= snapTol) {
      lines.push({ type: "horizontal", y: slideCy });
      snappedTop = slideCy - moving.height / 2;
    }

    // snap to manual guides
    guides.vertical.forEach((x) => {
      if (Math.abs(proposedLeft - x) <= snapTol) {
        lines.push({ type: "vertical", x });
        snappedLeft = x;
      }
      if (Math.abs(cx - x) <= snapTol) {
        lines.push({ type: "vertical", x });
        snappedLeft = x - moving.width / 2;
      }
    });
    guides.horizontal.forEach((y) => {
      if (Math.abs(proposedTop - y) <= snapTol) {
        lines.push({ type: "horizontal", y });
        snappedTop = y;
      }
      if (Math.abs(cy - y) <= snapTol) {
        lines.push({ type: "horizontal", y });
        snappedTop = y - moving.height / 2;
      }
    });

    // snap to grid
    if (snapToGrid && gridSize > 0) {
      const gridX = Math.round(proposedLeft / gridSize) * gridSize;
      const gridY = Math.round(proposedTop / gridSize) * gridSize;
      if (Math.abs(gridX - proposedLeft) <= snapTol) {
        lines.push({ type: "vertical", x: gridX });
        snappedLeft = gridX;
      }
      if (Math.abs(gridY - proposedTop) <= snapTol) {
        lines.push({ type: "horizontal", y: gridY });
        snappedTop = gridY;
      }
    }

    // snap to other elements edges/centers
    const others =
      currentSlide?.elements.filter((el) => el.id !== moving.id) || [];
    for (const other of others) {
      const otherCx = other.left + other.width / 2;
      const otherCy = other.top + other.height / 2;
      // horizontal snap (centers)
      if (Math.abs(cy - otherCy) <= snapTol) {
        lines.push({ type: "horizontal", y: otherCy });
        snappedTop = otherCy - moving.height / 2;
      }
      // vertical snap (centers)
      if (Math.abs(cx - otherCx) <= snapTol) {
        lines.push({ type: "vertical", x: otherCx });
        snappedLeft = otherCx - moving.width / 2;
      }
      // top/bottom/left/right edges
      const edges = {
        top: other.top,
        bottom: other.top + other.height,
        left: other.left,
        right: other.left + other.width,
      };
      if (Math.abs(proposedTop - edges.top) <= snapTol) {
        lines.push({ type: "horizontal", y: edges.top });
        snappedTop = edges.top;
      }
      if (Math.abs(proposedTop - edges.bottom) <= snapTol) {
        lines.push({ type: "horizontal", y: edges.bottom });
        snappedTop = edges.bottom;
      }
      if (Math.abs(proposedLeft - edges.left) <= snapTol) {
        lines.push({ type: "vertical", x: edges.left });
        snappedLeft = edges.left;
      }
      if (Math.abs(proposedLeft - edges.right) <= snapTol) {
        lines.push({ type: "vertical", x: edges.right });
        snappedLeft = edges.right;
      }
    }

    return { left: snappedLeft, top: snappedTop, lines };
  };

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
          setAlignmentLines([]);
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
            <GridOverlay gridSize={snapToGrid ? gridSize : 0} />
            {guideLines.length > 0 && (
              <AlignmentLines lines={guideLines} scale={canvasScale} color="#cbd5e1" />
            )}
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
                  const snap = computeSnap(el, left, top);
                  setAlignmentLines(snap.lines);
                  const orig = dragSnapshotRef.current.find((d) => d.id === id);
                  const dx = orig ? snap.left - orig.left : 0;
                  const dy = orig ? snap.top - orig.top : 0;

                  updateElement({
                    id,
                    props: { left: snap.left, top: snap.top },
                    slideId: currentSlide?.id,
                  });

                  if (dragSnapshotRef.current.length > 1) {
                    dragSnapshotRef.current
                      .filter((d) => d.id !== id)
                      .forEach((d) => {
                        updateElement({
                          id: d.id,
                          props: { left: d.left + dx, top: d.top + dy },
                          slideId: currentSlide?.id,
                        });
                      });
                  }
                }}
                onMouseDownEx={(e, el) => {
                  setIsDraggingElement(true);
                  setDragStart({ x: e.pageX, y: e.pageY });
                  if (!activeElementIdList.includes(el.id)) {
                    setActiveElementIdList([el.id]);
                  }
                  const ids =
                    activeElementIdList.length && activeElementIdList.includes(el.id)
                      ? activeElementIdList
                      : [el.id];
                  const elems = slides[slideIndex]?.elements || [];
                  dragSnapshotRef.current = elems
                    .filter((item) => ids.includes(item.id))
                    .map((item) => ({ id: item.id, left: item.left, top: item.top }));
                  setAlignmentLines([]);
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
