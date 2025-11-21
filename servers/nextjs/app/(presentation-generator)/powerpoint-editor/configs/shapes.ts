// Shape library configuration inspired by PPTist
// https://github.com/pipipi-pikachu/PPTist/blob/master/src/configs/shapes.ts

export interface ShapeConfig {
  id: string;
  name: string;
  category: string;
  path: string; // SVG path data
  viewBox?: string;
  fill?: string;
  stroke?: string;
}

export const SHAPE_CATEGORIES = [
  { id: "basic", name: "Basic Shapes" },
  { id: "arrows", name: "Block Arrows" },
  { id: "equation", name: "Equation Shapes" },
  { id: "flowchart", name: "Flowchart" },
  { id: "stars", name: "Stars and Banners" },
  { id: "callouts", name: "Callouts" },
];

export const SHAPES: ShapeConfig[] = [
  // Basic Shapes
  {
    id: "rectangle",
    name: "Rectangle",
    category: "basic",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "rounded-rectangle",
    name: "Rounded Rectangle",
    category: "basic",
    path: "M 10 0 L 90 0 Q 100 0 100 10 L 100 90 Q 100 100 90 100 L 10 100 Q 0 100 0 90 L 0 10 Q 0 0 10 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "ellipse",
    name: "Ellipse",
    category: "basic",
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "circle",
    name: "Circle",
    category: "basic",
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "triangle",
    name: "Triangle",
    category: "basic",
    path: "M 50 0 L 100 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "right-triangle",
    name: "Right Triangle",
    category: "basic",
    path: "M 0 0 L 100 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "parallelogram",
    name: "Parallelogram",
    category: "basic",
    path: "M 20 0 L 100 0 L 80 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "trapezoid",
    name: "Trapezoid",
    category: "basic",
    path: "M 20 0 L 80 0 L 100 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "diamond",
    name: "Diamond",
    category: "basic",
    path: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "pentagon",
    name: "Pentagon",
    category: "basic",
    path: "M 50 0 L 100 38 L 82 100 L 18 100 L 0 38 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "hexagon",
    name: "Hexagon",
    category: "basic",
    path: "M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "octagon",
    name: "Octagon",
    category: "basic",
    path: "M 30 0 L 70 0 L 100 30 L 100 70 L 70 100 L 30 100 L 0 70 L 0 30 Z",
    viewBox: "0 0 100 100",
  },

  // Block Arrows
  {
    id: "arrow-right",
    name: "Right Arrow",
    category: "arrows",
    path: "M 0 30 L 60 30 L 60 0 L 100 50 L 60 100 L 60 70 L 0 70 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "arrow-left",
    name: "Left Arrow",
    category: "arrows",
    path: "M 100 30 L 40 30 L 40 0 L 0 50 L 40 100 L 40 70 L 100 70 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "arrow-up",
    name: "Up Arrow",
    category: "arrows",
    path: "M 30 100 L 30 40 L 0 40 L 50 0 L 100 40 L 70 40 L 70 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "arrow-down",
    name: "Down Arrow",
    category: "arrows",
    path: "M 30 0 L 30 60 L 0 60 L 50 100 L 100 60 L 70 60 L 70 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "arrow-left-right",
    name: "Left-Right Arrow",
    category: "arrows",
    path: "M 20 40 L 0 50 L 20 60 L 20 55 L 80 55 L 80 60 L 100 50 L 80 40 L 80 45 L 20 45 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "arrow-up-down",
    name: "Up-Down Arrow",
    category: "arrows",
    path: "M 40 20 L 50 0 L 60 20 L 55 20 L 55 80 L 60 80 L 50 100 L 40 80 L 45 80 L 45 20 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "chevron-right",
    name: "Chevron Right",
    category: "arrows",
    path: "M 0 0 L 60 0 L 100 50 L 60 100 L 0 100 L 40 50 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "chevron-left",
    name: "Chevron Left",
    category: "arrows",
    path: "M 100 0 L 40 0 L 0 50 L 40 100 L 100 100 L 60 50 Z",
    viewBox: "0 0 100 100",
  },

  // Equation Shapes
  {
    id: "plus",
    name: "Plus",
    category: "equation",
    path: "M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "minus",
    name: "Minus",
    category: "equation",
    path: "M 0 35 L 100 35 L 100 65 L 0 65 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "multiply",
    name: "Multiply",
    category: "equation",
    path: "M 20 0 L 50 30 L 80 0 L 100 20 L 70 50 L 100 80 L 80 100 L 50 70 L 20 100 L 0 80 L 30 50 L 0 20 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "divide",
    name: "Divide",
    category: "equation",
    path: "M 0 45 L 100 45 L 100 55 L 0 55 Z M 40 15 A 10 10 0 1 1 60 15 A 10 10 0 1 1 40 15 M 40 85 A 10 10 0 1 1 60 85 A 10 10 0 1 1 40 85",
    viewBox: "0 0 100 100",
  },
  {
    id: "equal",
    name: "Equal",
    category: "equation",
    path: "M 0 30 L 100 30 L 100 40 L 0 40 Z M 0 60 L 100 60 L 100 70 L 0 70 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "not-equal",
    name: "Not Equal",
    category: "equation",
    path: "M 0 30 L 100 30 L 100 40 L 0 40 Z M 0 60 L 100 60 L 100 70 L 0 70 Z M 60 0 L 70 0 L 40 100 L 30 100 Z",
    viewBox: "0 0 100 100",
  },

  // Flowchart
  {
    id: "flowchart-process",
    name: "Process",
    category: "flowchart",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-decision",
    name: "Decision",
    category: "flowchart",
    path: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-data",
    name: "Data",
    category: "flowchart",
    path: "M 20 0 L 100 0 L 80 100 L 0 100 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-predefined-process",
    name: "Predefined Process",
    category: "flowchart",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z M 10 0 L 10 100 M 90 0 L 90 100",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-document",
    name: "Document",
    category: "flowchart",
    path: "M 0 0 L 100 0 L 100 90 Q 75 80 50 90 Q 25 100 0 90 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-database",
    name: "Database",
    category: "flowchart",
    path: "M 0 20 Q 0 0 50 0 Q 100 0 100 20 L 100 80 Q 100 100 50 100 Q 0 100 0 80 Z M 0 20 Q 0 30 50 30 Q 100 30 100 20",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-terminator",
    name: "Terminator",
    category: "flowchart",
    path: "M 20 0 L 80 0 Q 100 0 100 50 Q 100 100 80 100 L 20 100 Q 0 100 0 50 Q 0 0 20 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "flowchart-preparation",
    name: "Preparation",
    category: "flowchart",
    path: "M 20 0 L 80 0 L 100 50 L 80 100 L 20 100 L 0 50 Z",
    viewBox: "0 0 100 100",
  },

  // Stars and Banners
  {
    id: "star-4",
    name: "4-Point Star",
    category: "stars",
    path: "M 50 0 L 60 40 L 100 50 L 60 60 L 50 100 L 40 60 L 0 50 L 40 40 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "star-5",
    name: "5-Point Star",
    category: "stars",
    path: "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "star-6",
    name: "6-Point Star",
    category: "stars",
    path: "M 50 0 L 63 25 L 50 50 L 88 50 L 100 75 L 88 100 L 50 100 L 38 75 L 50 50 L 12 50 L 0 25 L 12 0 L 50 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "star-8",
    name: "8-Point Star",
    category: "stars",
    path: "M 50 0 L 58 29 L 71 15 L 71 42 L 85 29 L 85 58 L 100 50 L 85 71 L 100 85 L 71 71 L 58 85 L 71 58 L 50 100 L 42 71 L 29 85 L 29 58 L 15 71 L 0 85 L 15 50 L 0 15 L 29 29 L 29 0 L 42 29 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "star-12",
    name: "12-Point Star",
    category: "stars",
    path: "M 50 0 L 55 25 L 65 10 L 60 35 L 75 25 L 65 45 L 85 40 L 70 55 L 90 60 L 70 65 L 85 75 L 65 70 L 75 85 L 60 75 L 65 95 L 55 80 L 50 100 L 45 80 L 35 95 L 40 75 L 25 85 L 35 70 L 15 75 L 30 65 L 10 60 L 30 55 L 15 40 L 35 45 L 25 25 L 40 35 L 35 10 L 45 25 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "banner",
    name: "Banner",
    category: "stars",
    path: "M 0 0 L 100 0 L 100 80 L 50 100 L 0 80 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "ribbon",
    name: "Ribbon",
    category: "stars",
    path: "M 10 0 L 90 0 Q 100 0 100 10 L 100 60 Q 100 70 90 70 L 50 70 L 60 100 L 50 85 L 40 100 L 50 70 L 10 70 Q 0 70 0 60 L 0 10 Q 0 0 10 0 Z",
    viewBox: "0 0 100 100",
  },

  // Callouts
  {
    id: "callout-rectangle",
    name: "Rectangular Callout",
    category: "callouts",
    path: "M 0 0 L 100 0 L 100 70 L 60 70 L 50 100 L 40 70 L 0 70 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "callout-rounded",
    name: "Rounded Callout",
    category: "callouts",
    path: "M 10 0 L 90 0 Q 100 0 100 10 L 100 60 Q 100 70 90 70 L 60 70 L 50 100 L 40 70 L 10 70 Q 0 70 0 60 L 0 10 Q 0 0 10 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "callout-ellipse",
    name: "Oval Callout",
    category: "callouts",
    path: "M 50 0 A 50 35 0 1 1 50 70 L 40 100 L 50 70 A 50 35 0 1 1 50 0 Z",
    viewBox: "0 0 100 100",
  },
  {
    id: "callout-cloud",
    name: "Cloud Callout",
    category: "callouts",
    path: "M 25 40 A 15 15 0 0 1 40 25 A 20 20 0 0 1 70 25 A 15 15 0 0 1 85 40 A 20 20 0 0 1 85 65 L 50 65 L 45 85 L 40 65 A 25 25 0 0 1 25 40 Z",
    viewBox: "0 0 100 100",
  },
];

export const getShapesByCategory = (categoryId: string): ShapeConfig[] => {
  return SHAPES.filter((shape) => shape.category === categoryId);
};

export const getShapeById = (shapeId: string): ShapeConfig | undefined => {
  return SHAPES.find((shape) => shape.id === shapeId);
};
