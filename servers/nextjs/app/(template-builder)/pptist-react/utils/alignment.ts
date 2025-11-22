import { PPTElement } from "../types/pptist";

export type AlignDirection =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom";
export type DistributeDirection = "horizontal" | "vertical";
export type MirrorDirection = "horizontal" | "vertical";
export type RotateDirection = "left" | "right";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
};

export const getSelectionBounds = (
  elements: PPTElement[],
  ids: string[]
): Bounds | null => {
  if (!ids.length) return null;
  const set = new Set(ids);
  const selected = elements.filter((el) => set.has(el.id));
  if (!selected.length) return null;
  const minX = Math.min(...selected.map((el) => el.left));
  const minY = Math.min(...selected.map((el) => el.top));
  const maxX = Math.max(...selected.map((el) => el.left + el.width));
  const maxY = Math.max(...selected.map((el) => el.top + el.height));
  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

export const alignElementsBy = (
  elements: PPTElement[],
  ids: string[],
  direction: AlignDirection
): PPTElement[] => {
  const bounds = getSelectionBounds(elements, ids);
  if (!bounds) return elements;
  const idSet = new Set(ids);

  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    switch (direction) {
      case "left":
        return { ...el, left: bounds.minX };
      case "right":
        return { ...el, left: bounds.maxX - el.width };
      case "center":
        return { ...el, left: bounds.centerX - el.width / 2 };
      case "top":
        return { ...el, top: bounds.minY };
      case "bottom":
        return { ...el, top: bounds.maxY - el.height };
      case "middle":
        return { ...el, top: bounds.centerY - el.height / 2 };
      default:
        return el;
    }
  });
};

export const distributeElementsBy = (
  elements: PPTElement[],
  ids: string[],
  direction: DistributeDirection
): PPTElement[] => {
  const idSet = new Set(ids);
  const selected = elements.filter((el) => idSet.has(el.id));
  if (selected.length < 3) return elements;

  const sorted =
    direction === "horizontal"
      ? [...selected].sort((a, b) => a.left - b.left)
      : [...selected].sort((a, b) => a.top - b.top);

  const start = direction === "horizontal" ? sorted[0].left : sorted[0].top;
  const end =
    direction === "horizontal"
      ? sorted[sorted.length - 1].left + sorted[sorted.length - 1].width
      : sorted[sorted.length - 1].top + sorted[sorted.length - 1].height;

  const totalSpan =
    direction === "horizontal"
      ? sorted.reduce((acc, el) => acc + el.width, 0)
      : sorted.reduce((acc, el) => acc + el.height, 0);
  const gap = (end - start - totalSpan) / (sorted.length - 1);

  let cursor = start;
  const nextPositions = new Map<string, { left?: number; top?: number }>();
  sorted.forEach((el) => {
    if (direction === "horizontal") {
      nextPositions.set(el.id, { left: cursor });
      cursor += el.width + gap;
    } else {
      nextPositions.set(el.id, { top: cursor });
      cursor += el.height + gap;
    }
  });

  return elements.map((el) => {
    const next = nextPositions.get(el.id);
    if (!next) return el;
    return { ...el, ...next };
  });
};

export const rotateElementsBy = (
  elements: PPTElement[],
  ids: string[],
  direction: RotateDirection
): PPTElement[] => {
  const idSet = new Set(ids);
  const delta = direction === "left" ? -90 : 90;
  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    const rotate = (((el.rotate || 0) + delta) % 360 + 360) % 360;
    return { ...el, rotate };
  });
};

export const mirrorElementsBy = (
  elements: PPTElement[],
  ids: string[],
  direction: MirrorDirection
): PPTElement[] => {
  const bounds = getSelectionBounds(elements, ids);
  if (!bounds) return elements;
  const idSet = new Set(ids);

  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    if (direction === "horizontal") {
      const left = bounds.minX + (bounds.maxX - (el.left + el.width));
      return { ...el, left };
    }
    const top = bounds.minY + (bounds.maxY - (el.top + el.height));
    return { ...el, top };
  });
};
