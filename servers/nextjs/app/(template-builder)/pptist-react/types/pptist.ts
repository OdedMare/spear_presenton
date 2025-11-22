export enum ToolbarStates {
  EL_ANIMATION = "elAnimation",
  EL_STYLE = "elStyle",
  EL_POSITION = "elPosition",
  SLIDE_DESIGN = "slideDesign",
  SLIDE_ANIMATION = "slideAnimation",
  MULTI_STYLE = "multiStyle",
  MULTI_POSITION = "multiPosition",
}

export type DialogForExportTypes = "image" | "pdf" | "json" | "pptx" | "pptist" | "";

export type TextAttrs = {
  bold: boolean;
  em: boolean;
  underline: boolean;
  strikethrough: boolean;
  superscript: boolean;
  subscript: boolean;
  code: boolean;
  color: string;
  backcolor: string;
  fontsize: string;
  fontname: string;
  link: string;
  align: "left" | "right" | "center";
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
};

export const defaultRichTextAttrs: TextAttrs = {
  bold: false,
  em: false,
  underline: false,
  strikethrough: false,
  superscript: false,
  subscript: false,
  code: false,
  color: "#000000",
  backcolor: "",
  fontsize: "16px",
  fontname: "",
  link: "",
  align: "left",
  bulletList: false,
  orderedList: false,
  blockquote: false,
};

export type PPTElement = {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: number;
  [key: string]: any;
};

export type PPTElementOutline = {
  style?: string;
  width?: number;
  color?: string;
};

export type PPTElementShadow = {
  h: number;
  v: number;
  blur: number;
  color: string;
};

export type SlideBackground = {
  type: string;
  color?: string;
  image?: { src: string; size: "cover" | "contain" | "repeat" };
  gradient?: any;
};

export type SlideTheme = {
  backgroundColor: string;
  themeColors: string[];
  fontColor: string;
  fontName: string;
  outline: PPTElementOutline;
  shadow: PPTElementShadow;
};

export type Slide = {
  id: string;
  elements: PPTElement[];
  notes?: any[];
  remark?: string;
  background?: SlideBackground;
  animations?: any[];
  turningMode?: any;
  sectionTag?: any;
  type?: any;
};

export type SlideTemplate = {
  name: string;
  id: string;
  cover: string;
  origin?: string;
};

export type CreatingElement =
  | { type: "text"; vertical?: boolean }
  | { type: "shape"; data: any }
  | { type: "line"; data: any };

export type TextFormatPainterKeys =
  | "bold"
  | "em"
  | "underline"
  | "strikethrough"
  | "color"
  | "backcolor"
  | "fontsize"
  | "fontname"
  | "align";

export type TextFormatPainter = {
  keep: boolean;
  bold?: boolean;
  em?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backcolor?: string;
  fontsize?: string;
  fontname?: string;
  align?: "left" | "right" | "center";
};

export type ShapeFormatPainter = {
  keep: boolean;
  fill?: string;
  gradient?: any;
  outline?: PPTElementOutline;
  opacity?: number;
  shadow?: PPTElementShadow;
};
