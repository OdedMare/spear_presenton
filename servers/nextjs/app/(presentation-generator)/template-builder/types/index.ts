export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Fill {
  type: "solid" | "gradient" | "theme";
  color?: string;
  stops?: Array<{ offset: number; color: string }>;
  angle?: number;
  theme?: string;
}

export interface Stroke {
  width: number;
  color: string;
}

export interface Font {
  family: string;
  size: number | null;
  weight: number;
  style: string;
  underline: boolean;
  color: string | null;
}

export interface TextRun {
  text: string;
  font: Font;
  color: string | null;
  highlight: string | null;
  underline: boolean;
  strike: boolean;
}

export interface TextElement {
  id: string;
  type: "text";
  bbox: BBox;
  z: number;
  rotation: number;
  opacity: number;
  align: string;
  runs: TextRun[];
  bullets: any[];
  fill?: Fill;
  stroke?: Stroke;
}

export interface ShapeElement {
  id: string;
  type: "shape";
  shape: string;
  bbox: BBox;
  z: number;
  rotation: number;
  opacity: number;
  fill: Fill | null;
  stroke: Stroke | null;
}

export interface ImageElement {
  id: string;
  type: "image";
  bbox: BBox;
  z: number;
  rotation: number;
  opacity: number;
  src: string;
  object_fit: string;
}

export type SlideElement = TextElement | ShapeElement | ImageElement;

export interface TemplateSlide {
  id: string;
  width_px: number;
  height_px: number;
  background: Fill | null;
  elements: SlideElement[];
}

export interface SaveTemplateRequest {
  name: string;
  description: string;
  slides: any[];
  width_px: number;
  height_px: number;
  fonts: string[];
}

export interface SaveTemplateResponse {
  success: boolean;
  template_id: string;
  message: string;
}
