export type PptistElementType =
  | "text"
  | "image"
  | "shape"
  | "line"
  | "chart"
  | "table"
  | "latex"
  | "video"
  | "audio";

export interface PptistElementBase {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: number;
  lock?: boolean;
  link?: {
    type: string;
    target: string;
  };
}

export interface PptistTextElement extends PptistElementBase {
  type: "text";
  content: string;
  defaultFontName: string;
  defaultColor: string;
  outline?: {
    style?: string;
    width?: number;
    color?: string;
  };
  fill?: string;
  lineHeight?: number;
  wordSpace?: number;
  opacity?: number;
  shadow?: {
    h: number;
    v: number;
    blur: number;
    color: string;
  };
  paragraphSpace?: number;
  vertical?: boolean;
  textType?: string;
}

export interface PptistImageElement extends PptistElementBase {
  type: "image";
  src: string;
  fill?: string;
  outline?: {
    style?: string;
    width?: number;
    color?: string;
  };
  flipH?: boolean;
  flipV?: boolean;
  opacity?: number;
  shadow?: {
    h: number;
    v: number;
    blur: number;
    color: string;
  };
}

export interface PptistShapeElement extends PptistElementBase {
  type: "shape" | "line";
  viewBox: string;
  path: string;
  fill?: string | { type: "linear" | "radial"; colors: { pos: number; color: string }[]; rotate: number };
  outline?: {
    style?: string;
    width?: number;
    color?: string;
  };
  radius?: number;
  opacity?: number;
  shadow?: {
    h: number;
    v: number;
    blur: number;
    color: string;
  };
  flipH?: boolean;
  flipV?: boolean;
}

export interface PptistSlideBackground {
  type: "solid" | "image" | "gradient";
  color?: string;
  image?: {
    src: string;
    size: "cover" | "contain" | "repeat";
  };
  gradient?: {
    type: "linear" | "radial";
    colors: { pos: number; color: string }[];
    rotate: number;
  };
}

export type PptistElement =
  | PptistTextElement
  | PptistImageElement
  | PptistShapeElement
  | (PptistElementBase & { type: PptistElementType; [key: string]: any });

export interface PptistSlide {
  id: string;
  elements: PptistElement[];
  remark?: string;
  background?: PptistSlideBackground;
  type?: string;
}

export interface PptistProject {
  title: string;
  width: number;
  height: number;
  theme: {
    backgroundColor?: string;
    themeColors?: string[];
    fontColor?: string;
    fontName?: string;
    outline?: {
      width?: number;
      color?: string;
      style?: string;
    };
    shadow?: {
      h: number;
      v: number;
      blur: number;
      color: string;
    };
  };
  slides: PptistSlide[];
}

export interface PresentonColor {
  type: "solid" | "gradient";
  value: string;
  gradientStops?: { offset: number; color: string }[];
  angle?: number;
}

export interface PresentonShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface PresentonBorder {
  color?: string;
  width?: number;
  style?: "solid" | "dashed" | "dotted";
}

export interface PresentonTextElement {
  kind: "text";
  id: string;
  frame: { x: number; y: number; width: number; height: number; rotate: number };
  content: string;
  style: {
    fontFamily?: string;
    color?: string;
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
    opacity?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    backgroundColor?: string;
    border?: PresentonBorder;
    shadow?: PresentonShadow;
    vertical?: boolean;
  };
}

export interface PresentonImageElement {
  kind: "image";
  id: string;
  frame: { x: number; y: number; width: number; height: number; rotate: number };
  src: string;
  style: {
    objectFit?: "contain" | "cover" | "fill";
    opacity?: number;
    border?: PresentonBorder;
    shadow?: PresentonShadow;
    flipH?: boolean;
    flipV?: boolean;
  };
}

export interface PresentonShapeElement {
  kind: "shape";
  id: string;
  frame: { x: number; y: number; width: number; height: number; rotate: number };
  path?: string;
  viewBox?: string;
  style: {
    fill?: PresentonColor;
    border?: PresentonBorder;
    opacity?: number;
    radius?: number;
    shadow?: PresentonShadow;
    flipH?: boolean;
    flipV?: boolean;
  };
}

export type PresentonElement =
  | PresentonTextElement
  | PresentonImageElement
  | PresentonShapeElement;

export interface PresentonSlide {
  id: string;
  name: string;
  remark?: string;
  background?: PresentonColor & {
    image?: { src: string; size: "cover" | "contain" | "repeat" };
  };
  elements: PresentonElement[];
}

export interface PresentonLayout {
  id: string;
  title: string;
  meta: {
    width: number;
    height: number;
    theme: PptistProject["theme"];
    fonts: string[];
  };
  slides: PresentonSlide[];
}

export interface PresentonExportResponse {
  success: boolean;
  presentationId?: string;
  savedCount?: number;
  layouts?: { layoutId: string; reactPath?: string }[];
  error?: string;
}

