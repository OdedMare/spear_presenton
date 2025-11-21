import { ShapeType } from "../types";

// Shape definitions with SVG paths
// Normalized to 100x100 viewBox
export const shapeDefinitions: Record<ShapeType, { path: string; viewBox?: string }> = {
  // Basic Shapes
  rectangle: {
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
  },
  "rounded-rectangle": {
    path: "M 10 0 L 90 0 Q 100 0 100 10 L 100 90 Q 100 100 90 100 L 10 100 Q 0 100 0 90 L 0 10 Q 0 0 10 0 Z",
  },
  ellipse: {
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z",
  },
  triangle: {
    path: "M 50 0 L 100 100 L 0 100 Z",
  },
  "right-triangle": {
    path: "M 0 0 L 100 100 L 0 100 Z",
  },
  parallelogram: {
    path: "M 20 0 L 100 0 L 80 100 L 0 100 Z",
  },
  trapezoid: {
    path: "M 20 0 L 80 0 L 100 100 L 0 100 Z",
  },
  diamond: {
    path: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
  },
  pentagon: {
    path: "M 50 0 L 100 38 L 81 100 L 19 100 L 0 38 Z",
  },
  hexagon: {
    path: "M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z",
  },
  octagon: {
    path: "M 30 0 L 70 0 L 100 30 L 100 70 L 70 100 L 30 100 L 0 70 L 0 30 Z",
  },
  "star-4": {
    path: "M 50 0 L 60 40 L 100 50 L 60 60 L 50 100 L 40 60 L 0 50 L 40 40 Z",
  },
  "star-5": {
    path: "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
  },
  "star-6": {
    path: "M 50 0 L 65 35 L 100 35 L 73 57 L 88 92 L 50 70 L 12 92 L 27 57 L 0 35 L 35 35 Z",
  },
  "star-8": {
    path: "M 50 0 L 58 29 L 85 15 L 71 42 L 100 50 L 71 58 L 85 85 L 58 71 L 50 100 L 42 71 L 15 85 L 29 58 L 0 50 L 29 42 L 15 15 L 42 29 Z",
  },

  // Arrows
  "arrow-right": {
    path: "M 0 40 L 70 40 L 70 20 L 100 50 L 70 80 L 70 60 L 0 60 Z",
  },
  "arrow-left": {
    path: "M 30 20 L 30 40 L 100 40 L 100 60 L 30 60 L 30 80 L 0 50 Z",
  },
  "arrow-up": {
    path: "M 40 100 L 40 30 L 20 30 L 50 0 L 80 30 L 60 30 L 60 100 Z",
  },
  "arrow-down": {
    path: "M 40 0 L 40 70 L 20 70 L 50 100 L 80 70 L 60 70 L 60 0 Z",
  },
  "arrow-left-right": {
    path: "M 0 50 L 20 30 L 20 40 L 80 40 L 80 30 L 100 50 L 80 70 L 80 60 L 20 60 L 20 70 Z",
  },
  "arrow-up-down": {
    path: "M 50 0 L 70 20 L 60 20 L 60 80 L 70 80 L 50 100 L 30 80 L 40 80 L 40 20 L 30 20 Z",
  },
  "curved-arrow": {
    path: "M 10 50 Q 10 10 50 10 L 70 10 L 70 0 L 90 15 L 70 30 L 70 20 L 50 20 Q 20 20 20 50 L 20 90 L 10 90 Z",
  },
  "u-turn-arrow": {
    path: "M 20 100 L 20 30 Q 20 10 40 10 L 80 10 L 80 0 L 100 20 L 80 40 L 80 30 L 40 30 Q 40 30 40 50 L 40 100 Z",
  },
  "circular-arrow": {
    path: "M 50 10 Q 80 10 90 40 L 100 35 L 95 50 L 80 45 L 85 40 Q 78 20 50 20 Q 22 20 15 48 Q 8 76 36 83 Q 64 90 72 62 L 82 65 Q 72 98 38 93 Q 4 88 0 54 Q -4 20 30 10 Q 40 5 50 10 Z",
  },

  // Block Arrows
  "block-arrow-right": {
    path: "M 0 30 L 60 30 L 60 0 L 100 50 L 60 100 L 60 70 L 0 70 Z",
  },
  "block-arrow-left": {
    path: "M 40 0 L 40 30 L 100 30 L 100 70 L 40 70 L 40 100 L 0 50 Z",
  },
  "block-arrow-up": {
    path: "M 30 100 L 30 40 L 0 40 L 50 0 L 100 40 L 70 40 L 70 100 Z",
  },
  "block-arrow-down": {
    path: "M 30 0 L 30 60 L 0 60 L 50 100 L 100 60 L 70 60 L 70 0 Z",
  },
  chevron: {
    path: "M 0 0 L 75 0 L 100 50 L 75 100 L 0 100 L 25 50 Z",
  },
  "notched-arrow": {
    path: "M 0 40 L 70 40 L 70 20 L 100 50 L 70 80 L 70 60 L 0 60 L 20 50 Z",
  },

  // Flowchart
  "flowchart-process": {
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
  },
  "flowchart-decision": {
    path: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
  },
  "flowchart-data": {
    path: "M 20 0 L 100 0 L 80 100 L 0 100 Z",
  },
  "flowchart-predefined": {
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z M 10 0 L 10 100 M 90 0 L 90 100",
  },
  "flowchart-internal-storage": {
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z M 20 0 L 20 100 M 0 20 L 100 20",
  },
  "flowchart-document": {
    path: "M 0 0 L 100 0 L 100 85 Q 75 95 50 85 Q 25 75 0 85 Z",
  },
  "flowchart-multidocument": {
    path: "M 10 0 L 100 0 L 100 75 Q 75 85 50 75 Q 25 65 10 75 Z M 5 10 L 95 10 M 0 20 L 90 20",
  },
  "flowchart-terminator": {
    path: "M 25 0 L 75 0 Q 100 0 100 50 Q 100 100 75 100 L 25 100 Q 0 100 0 50 Q 0 0 25 0 Z",
  },
  "flowchart-preparation": {
    path: "M 20 0 L 80 0 L 100 50 L 80 100 L 20 100 L 0 50 Z",
  },
  "flowchart-manual-input": {
    path: "M 0 20 L 100 0 L 100 100 L 0 100 Z",
  },
  "flowchart-manual-operation": {
    path: "M 0 0 L 100 0 L 80 100 L 20 100 Z",
  },
  "flowchart-connector": {
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z",
  },
  "flowchart-off-page-connector": {
    path: "M 0 0 L 100 0 L 100 70 L 50 100 L 0 70 Z",
  },
  "flowchart-card": {
    path: "M 15 0 L 100 0 L 100 100 L 0 100 L 0 15 Z",
  },
  "flowchart-punched-tape": {
    path: "M 0 15 Q 25 5 50 15 Q 75 25 100 15 L 100 85 Q 75 95 50 85 Q 25 75 0 85 Z",
  },
  "flowchart-summing-junction": {
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z M 15 15 L 85 85 M 85 15 L 15 85",
  },
  "flowchart-or": {
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z M 50 0 L 50 100 M 0 50 L 100 50",
  },
  "flowchart-collate": {
    path: "M 0 0 L 100 100 L 0 100 Z M 100 0 L 0 100 L 100 100 Z",
  },
  "flowchart-sort": {
    path: "M 0 50 L 50 0 L 100 50 L 50 100 Z M 0 50 L 100 50",
  },
  "flowchart-extract": {
    path: "M 50 0 L 100 100 L 0 100 Z",
  },
  "flowchart-merge": {
    path: "M 0 0 L 100 0 L 50 100 Z",
  },
  "flowchart-stored-data": {
    path: "M 20 0 Q 0 0 0 50 Q 0 100 20 100 L 100 100 Q 100 100 100 50 Q 100 0 100 0 Z M 20 0 L 100 0",
  },
  "flowchart-delay": {
    path: "M 0 0 L 70 0 Q 100 0 100 50 Q 100 100 70 100 L 0 100 Z",
  },
  "flowchart-magnetic-disk": {
    path: "M 0 15 Q 0 0 50 0 Q 100 0 100 15 L 100 100 Q 100 115 50 115 Q 0 115 0 100 Z M 0 15 Q 0 30 50 30 Q 100 30 100 15",
  },
  "flowchart-direct-access": {
    path: "M 15 0 L 85 0 Q 100 0 100 50 Q 100 100 85 100 L 15 100 Q 0 100 0 50 Q 0 0 15 0 Z M 15 0 Q 0 0 0 50 Q 0 100 15 100",
  },
  "flowchart-display": {
    path: "M 20 0 L 80 0 Q 100 25 80 50 Q 100 75 80 100 L 20 100 Q 0 75 20 50 Q 0 25 20 0 Z",
  },

  // Callouts
  "callout-rectangle": {
    path: "M 0 0 L 100 0 L 100 70 L 70 70 L 60 100 L 55 70 L 0 70 Z",
  },
  "callout-rounded-rectangle": {
    path: "M 10 0 L 90 0 Q 100 0 100 10 L 100 60 L 70 60 L 60 90 L 55 60 L 10 60 Q 0 60 0 50 L 0 10 Q 0 0 10 0 Z",
  },
  "callout-oval": {
    path: "M 50 0 Q 100 0 100 35 Q 100 70 70 70 L 60 100 L 55 70 Q 0 70 0 35 Q 0 0 50 0 Z",
  },
  "callout-cloud": {
    path: "M 25 40 Q 10 30 15 20 Q 20 10 30 15 Q 35 5 45 10 Q 55 0 65 10 Q 75 5 80 15 Q 90 10 95 20 Q 100 30 85 40 L 70 40 L 60 70 L 55 40 Q 40 50 25 40 Z",
  },
  "callout-line": {
    path: "M 0 0 L 40 50 L 100 100",
  },

  // Lines
  line: {
    path: "M 0 50 L 100 50",
  },
  "line-arrow": {
    path: "M 0 50 L 85 50 L 80 45 M 85 50 L 80 55 M 85 50 L 100 50",
  },
  "line-double-arrow": {
    path: "M 0 50 L 15 50 L 10 45 M 15 50 L 10 55 M 15 50 L 85 50 L 80 45 M 85 50 L 80 55 M 85 50 L 100 50",
  },
  "curved-connector": {
    path: "M 0 50 Q 50 0 100 50",
  },
  "elbow-connector": {
    path: "M 0 50 L 50 50 L 50 100",
  },

  // Stars & Banners
  banner: {
    path: "M 0 20 L 100 20 L 90 40 L 100 60 L 0 60 L 10 40 Z",
  },
  ribbon: {
    path: "M 20 0 L 80 0 L 100 20 L 90 50 L 100 80 L 80 100 L 20 100 L 0 80 L 10 50 L 0 20 Z",
  },
  scroll: {
    path: "M 15 0 Q 0 0 0 15 L 0 85 Q 0 100 15 100 L 85 100 Q 100 100 100 85 L 100 15 Q 100 0 85 0 Z M 15 0 Q 15 15 0 15 M 85 100 Q 85 85 100 85",
  },
  wave: {
    path: "M 0 50 Q 25 30 50 50 Q 75 70 100 50 L 100 100 L 0 100 Z",
  },
  "double-wave": {
    path: "M 0 40 Q 25 20 50 40 Q 75 60 100 40 L 100 60 Q 75 80 50 60 Q 25 40 0 60 Z M 0 60 L 0 100 L 100 100 L 100 60",
  },

  // Symbols
  heart: {
    path: "M 50 90 Q 20 70 15 50 Q 10 30 25 20 Q 40 10 50 25 Q 60 10 75 20 Q 90 30 85 50 Q 80 70 50 90 Z",
  },
  lightning: {
    path: "M 60 0 L 30 40 L 50 40 L 20 100 L 70 50 L 50 50 L 80 0 Z",
  },
  sun: {
    path: "M 50 20 A 30 30 0 1 1 50 80 A 30 30 0 1 1 50 20 Z M 50 0 L 50 10 M 50 90 L 50 100 M 0 50 L 10 50 M 90 50 L 100 50 M 15 15 L 22 22 M 78 78 L 85 85 M 85 15 L 78 22 M 22 78 L 15 85",
  },
  moon: {
    path: "M 70 10 Q 50 10 35 30 Q 20 50 35 70 Q 50 90 70 90 Q 55 90 42 77 Q 30 65 30 50 Q 30 35 42 23 Q 55 10 70 10 Z",
  },
  cloud: {
    path: "M 30 60 Q 10 60 10 40 Q 10 25 25 20 Q 30 10 40 10 Q 50 10 55 20 Q 70 15 80 25 Q 95 35 90 50 Q 85 65 70 65 Z",
  },
  smiley: {
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z M 30 35 A 5 5 0 1 1 30 45 A 5 5 0 1 1 30 35 Z M 70 35 A 5 5 0 1 1 70 45 A 5 5 0 1 1 70 35 Z M 25 65 Q 35 75 50 75 Q 65 75 75 65",
  },
};

// Helper to convert shape type to path
export const getShapePath = (shapeType: ShapeType): string => {
  return shapeDefinitions[shapeType]?.path || shapeDefinitions.rectangle.path;
};

// Shape categories for UI organization
export const shapeCategories = {
  basic: [
    "rectangle",
    "rounded-rectangle",
    "ellipse",
    "triangle",
    "right-triangle",
    "parallelogram",
    "trapezoid",
    "diamond",
    "pentagon",
    "hexagon",
    "octagon",
  ] as ShapeType[],

  stars: [
    "star-4",
    "star-5",
    "star-6",
    "star-8",
  ] as ShapeType[],

  arrows: [
    "arrow-right",
    "arrow-left",
    "arrow-up",
    "arrow-down",
    "arrow-left-right",
    "arrow-up-down",
    "curved-arrow",
    "u-turn-arrow",
    "circular-arrow",
  ] as ShapeType[],

  blockArrows: [
    "block-arrow-right",
    "block-arrow-left",
    "block-arrow-up",
    "block-arrow-down",
    "chevron",
    "notched-arrow",
  ] as ShapeType[],

  flowchart: [
    "flowchart-process",
    "flowchart-decision",
    "flowchart-data",
    "flowchart-predefined",
    "flowchart-internal-storage",
    "flowchart-document",
    "flowchart-multidocument",
    "flowchart-terminator",
    "flowchart-preparation",
    "flowchart-manual-input",
    "flowchart-manual-operation",
    "flowchart-connector",
    "flowchart-off-page-connector",
    "flowchart-card",
    "flowchart-punched-tape",
    "flowchart-summing-junction",
    "flowchart-or",
    "flowchart-collate",
    "flowchart-sort",
    "flowchart-extract",
    "flowchart-merge",
    "flowchart-stored-data",
    "flowchart-delay",
    "flowchart-magnetic-disk",
    "flowchart-direct-access",
    "flowchart-display",
  ] as ShapeType[],

  callouts: [
    "callout-rectangle",
    "callout-rounded-rectangle",
    "callout-oval",
    "callout-cloud",
    "callout-line",
  ] as ShapeType[],

  linesConnectors: [
    "line",
    "line-arrow",
    "line-double-arrow",
    "curved-connector",
    "elbow-connector",
  ] as ShapeType[],

  banners: [
    "banner",
    "ribbon",
    "scroll",
    "wave",
    "double-wave",
  ] as ShapeType[],

  symbols: [
    "heart",
    "lightning",
    "sun",
    "moon",
    "cloud",
    "smiley",
  ] as ShapeType[],
};

// Get user-friendly name for shape
export const getShapeName = (shapeType: ShapeType): string => {
  return shapeType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
