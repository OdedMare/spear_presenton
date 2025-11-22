"use client";

import {
  FilePlus2,
  Type,
  Square,
  Eye,
  EyeOff,
  MoveRight,
  MoveLeft,
  ChevronsUp,
  ChevronsDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeftRight,
  ArrowUpDown,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useSlidesStore } from "../store/slides";
import { useMainStore } from "../store/main";
import ColorPicker from "../components/ColorPicker";
import { useActiveSlide } from "../hooks/useActiveSlide";
import { getSelectionBounds } from "../utils/alignment";

export default function CanvasToolbar() {
  const addElement = useSlidesStore((s) => s.addElement);
  const bringForward = useSlidesStore((s) => s.bringForward);
  const sendBackward = useSlidesStore((s) => s.sendBackward);
  const bringToFront = useSlidesStore((s) => s.bringToFront);
  const sendToBack = useSlidesStore((s) => s.sendToBack);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const alignElements = useSlidesStore((s) => s.alignElements);
  const distributeElements = useSlidesStore((s) => s.distributeElements);
  const rotateElements = useSlidesStore((s) => s.rotateElements);
  const mirrorElements = useSlidesStore((s) => s.mirrorElements);
  const hiddenIds = useMainStore((s) => s.hiddenElementIdList);
  const setHiddenIds = useMainStore((s) => s.setHiddenElementIdList);
  const activeIds = useMainStore((s) => s.activeElementIdList);
  const setActiveIds = useMainStore((s) => s.setActiveElementIdList);
  const snapToGrid = useMainStore((s) => s.snapToGrid);
  const setSnapToGrid = useMainStore((s) => s.setSnapToGrid);
  const gridSize = useMainStore((s) => s.gridLineSize);
  const setGridLineSize = useMainStore((s) => s.setGridLineSize);
  const guides = useMainStore((s) => s.guides);
  const addGuide = useMainStore((s) => s.addGuide);
  const clearGuides = useMainStore((s) => s.clearGuides);
  const viewportSize = useSlidesStore((s) => s.viewportSize);
  const viewportRatio = useSlidesStore((s) => s.viewportRatio);
  const { currentSlide } = useActiveSlide();
  const canAlign = activeIds.length >= 1;
  const canDistribute = activeIds.length >= 3;
  const canRotate = activeIds.length >= 1;
  const gridSizeValue = gridSize > 0 ? gridSize : 8;
  const hasGuides = guides.vertical.length + guides.horizontal.length > 0;

  const toggleHide = () => {
    if (!activeIds.length) return;
    const id = activeIds[0];
    if (hiddenIds.includes(id)) {
      setHiddenIds(hiddenIds.filter((h) => h !== id));
    } else {
      setHiddenIds([...hiddenIds, id]);
    }
  };

  const addText = () => {
    const el = {
      id: uuidv4(),
      type: "text",
      left: 100,
      top: 100,
      width: 200,
      height: 60,
      rotate: 0,
      defaultColor: "#1f2937",
      fill: "transparent",
      text: "New Text",
      content: `<div>New Text</div>`,
      textAlign: "left",
      fontSize: 18,
      lineHeight: 1.35,
      letterSpacing: 0,
      textBold: false,
      textItalic: false,
      textUnderline: false,
      textStrikethrough: false,
      bulletList: false,
      orderedList: false,
    };
    addElement(el as any);
    setActiveIds([el.id]);
  };

  const addShape = () => {
    const el = {
      id: uuidv4(),
      type: "shape",
      left: 120,
      top: 160,
      width: 200,
      height: 120,
      rotate: 0,
      fill: "#3b82f6",
      outline: { color: "#2563eb", width: 1, style: "solid" },
      shapePreset: "rectangle",
      cornerRadius: 8,
    };
    addElement(el as any);
    setActiveIds([el.id]);
  };

  const setFill = (color: string) => {
    if (!activeIds.length) return;
    updateElement({
      id: activeIds,
      props: { fill: color } as any,
      slideId: currentSlide?.id,
    });
  };

  const setOutline = (color: string) => {
    if (!activeIds.length) return;
    updateElement({
      id: activeIds,
      props: { outline: { color, width: 1, style: "solid" } } as any,
      slideId: currentSlide?.id,
    });
  };

  const addVerticalGuide = () => {
    const bounds = currentSlide
      ? getSelectionBounds(currentSlide.elements || [], activeIds)
      : null;
    const fallback = viewportSize / 2;
    addGuide("vertical", Math.round(bounds?.centerX ?? fallback));
  };

  const addHorizontalGuide = () => {
    const bounds = currentSlide
      ? getSelectionBounds(currentSlide.elements || [], activeIds)
      : null;
    const fallback = (viewportSize * viewportRatio) / 2;
    addGuide("horizontal", Math.round(bounds?.centerY ?? fallback));
  };

  return (
    <div className="flex h-full items-center justify-between px-3 text-sm text-slate-700">
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={addText}
        >
          <Type className="h-4 w-4" />
          Text
        </button>
        <button
          className="flex items-center gap-1 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={addShape}
        >
          <Square className="h-4 w-4" />
          Shape
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ColorPicker label="Fill" value="#3b82f6" onChange={setFill} />
          <ColorPicker label="Outline" value="#2563eb" onChange={setOutline} />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={snapToGrid}
              onChange={(e) => {
                if (e.target.checked && gridSize <= 0) {
                  setGridLineSize(8);
                }
                setSnapToGrid(e.target.checked);
              }}
            />
            <span>Snap</span>
          </label>
          <input
            className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
            type="number"
            min={2}
            max={200}
            value={gridSizeValue}
            onChange={(e) => setGridLineSize(Math.max(2, Number(e.target.value) || 0))}
            title="Grid size for snap-to-grid"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={addVerticalGuide}
            title="Add vertical guide (uses selection center or slide center)"
          >
            V Guide
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={addHorizontalGuide}
            title="Add horizontal guide (uses selection center or slide center)"
          >
            H Guide
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={clearGuides}
            disabled={!hasGuides}
            title="Clear all guides"
          >
            Clear Guides
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => alignElements("left", activeIds, currentSlide?.id)}
            disabled={!canAlign}
            title="Align left (Cmd/Ctrl + Shift + ArrowLeft)"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => alignElements("center", activeIds, currentSlide?.id)}
            disabled={!canAlign}
            title="Align center (Cmd/Ctrl + Shift + C)"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => alignElements("right", activeIds, currentSlide?.id)}
            disabled={!canAlign}
            title="Align right (Cmd/Ctrl + Shift + ArrowRight)"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => alignElements("top", activeIds, currentSlide?.id)}
            disabled={!canAlign}
            title="Align top (Cmd/Ctrl + Shift + ArrowUp)"
          >
            Top
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => alignElements("middle", activeIds, currentSlide?.id)}
            disabled={!canAlign}
            title="Align middle (Cmd/Ctrl + Shift + M)"
          >
            Mid
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => alignElements("bottom", activeIds, currentSlide?.id)}
            disabled={!canAlign}
            title="Align bottom (Cmd/Ctrl + Shift + ArrowDown)"
          >
            Bot
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => distributeElements("horizontal", activeIds, currentSlide?.id)}
            disabled={!canDistribute}
            title="Distribute horizontally (Cmd/Ctrl + Alt + H)"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => distributeElements("vertical", activeIds, currentSlide?.id)}
            disabled={!canDistribute}
            title="Distribute vertically (Cmd/Ctrl + Alt + V)"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => rotateElements("left", activeIds, currentSlide?.id)}
            disabled={!canRotate}
            title="Rotate left 90° (Cmd/Ctrl + [)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => rotateElements("right", activeIds, currentSlide?.id)}
            disabled={!canRotate}
            title="Rotate right 90° (Cmd/Ctrl + ])"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => mirrorElements("horizontal", activeIds, currentSlide?.id)}
            disabled={!canRotate}
            title="Mirror horizontal (Cmd/Ctrl + Shift + H)"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => mirrorElements("vertical", activeIds, currentSlide?.id)}
            disabled={!canRotate}
            title="Mirror vertical (Cmd/Ctrl + Shift + V)"
          >
            <FlipVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={toggleHide}
            disabled={!activeIds.length}
          >
            {activeIds.length && hiddenIds.includes(activeIds[0]) ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => activeIds[0] && bringForward(activeIds[0], currentSlide?.id)}
            disabled={!activeIds.length}
          >
            <MoveRight className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => activeIds[0] && sendBackward(activeIds[0], currentSlide?.id)}
            disabled={!activeIds.length}
          >
            <MoveLeft className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => activeIds[0] && bringToFront(activeIds[0], currentSlide?.id)}
            disabled={!activeIds.length}
          >
            <ChevronsUp className="h-4 w-4" />
          </button>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => activeIds[0] && sendToBack(activeIds[0], currentSlide?.id)}
            disabled={!activeIds.length}
          >
            <ChevronsDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600">
        <FilePlus2 className="h-4 w-4" />
        <span>Use toolbar to add elements & arrange layers</span>
      </div>
    </div>
  );
}
