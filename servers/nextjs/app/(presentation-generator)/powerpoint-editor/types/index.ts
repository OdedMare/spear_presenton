// ============================================================================
// POWERPOINT ONLINE CLONE - TYPE DEFINITIONS
// ============================================================================

// Basic geometry
export interface Point {
  x: number;
  y: number;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

// Colors and styling
export interface Color {
  type: "solid" | "gradient" | "theme";
  value?: string;
  gradient?: GradientColor;
  themeColor?: string;
}

export interface GradientColor {
  type: "linear" | "radial";
  angle?: number;
  stops: GradientStop[];
}

export interface GradientStop {
  offset: number; // 0-1
  color: string;
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Border {
  width: number;
  color: string;
  style: "solid" | "dashed" | "dotted";
}

// Text formatting
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
  backgroundColor?: string;
  underline?: boolean;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
}

export interface ParagraphStyle {
  align: "left" | "center" | "right" | "justify";
  lineHeight: number;
  spaceBefore: number;
  spaceAfter: number;
  indent: number;
  bullet?: BulletStyle;
}

export interface BulletStyle {
  type: "bullet" | "number" | "none";
  character?: string;
  startNumber?: number;
  level: number;
}

// Animations
export interface Animation {
  id: string;
  type: "entrance" | "emphasis" | "exit" | "motion";
  effect: string; // "fade", "fly", "zoom", "bounce", etc.
  duration: number; // milliseconds
  delay: number; // milliseconds
  trigger: "onClick" | "withPrevious" | "afterPrevious";
  direction?: "left" | "right" | "top" | "bottom";
  path?: Point[]; // For motion paths
}

// Transitions
export interface Transition {
  effect: string; // "fade", "push", "wipe", "zoom", etc.
  duration: number; // milliseconds
  direction?: "left" | "right" | "top" | "bottom";
  sound?: string;
}

// Background
export interface Background {
  type: "solid" | "gradient" | "image" | "texture";
  color?: string;
  gradient?: GradientColor;
  image?: string;
  texture?: string;
}

// ============================================================================
// SLIDE ELEMENTS
// ============================================================================

export interface BaseElement {
  id: string;
  type: "text" | "shape" | "image" | "video" | "audio" | "table" | "chart" | "group";
  bbox: BBox;
  z: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  name?: string;
  animations?: Animation[];
}

// Text Element
export interface TextElement extends BaseElement {
  type: "text";
  content: TextContent[];
  paragraphStyle: ParagraphStyle;
  verticalAlign: "top" | "middle" | "bottom";
  textDirection: "horizontal" | "vertical";
  autofit: "none" | "shrink" | "resize";
  padding: number;
  background?: Color;
  border?: Border;
  shadow?: Shadow;
}

export interface TextContent {
  text: string;
  style: TextStyle;
}

// Shape Element
export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  fill?: Color;
  border?: Border;
  shadow?: Shadow;
  text?: TextContent[];
  cornerRadius?: number;
}

export type ShapeType =
  // Basic shapes
  | "rectangle"
  | "rounded-rectangle"
  | "ellipse"
  | "triangle"
  | "right-triangle"
  | "parallelogram"
  | "trapezoid"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star-4"
  | "star-5"
  | "star-6"
  | "star-8"
  // Arrows
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "arrow-left-right"
  | "arrow-up-down"
  | "curved-arrow"
  | "u-turn-arrow"
  | "circular-arrow"
  // Block arrows
  | "block-arrow-right"
  | "block-arrow-left"
  | "block-arrow-up"
  | "block-arrow-down"
  | "chevron"
  | "notched-arrow"
  // Flowchart
  | "flowchart-process"
  | "flowchart-decision"
  | "flowchart-data"
  | "flowchart-predefined"
  | "flowchart-internal-storage"
  | "flowchart-document"
  | "flowchart-multidocument"
  | "flowchart-terminator"
  | "flowchart-preparation"
  | "flowchart-manual-input"
  | "flowchart-manual-operation"
  | "flowchart-connector"
  | "flowchart-off-page-connector"
  | "flowchart-card"
  | "flowchart-punched-tape"
  | "flowchart-summing-junction"
  | "flowchart-or"
  | "flowchart-collate"
  | "flowchart-sort"
  | "flowchart-extract"
  | "flowchart-merge"
  | "flowchart-stored-data"
  | "flowchart-delay"
  | "flowchart-magnetic-disk"
  | "flowchart-direct-access"
  | "flowchart-display"
  // Callouts
  | "callout-rectangle"
  | "callout-rounded-rectangle"
  | "callout-oval"
  | "callout-cloud"
  | "callout-line"
  // Lines and connectors
  | "line"
  | "line-arrow"
  | "line-double-arrow"
  | "curved-connector"
  | "elbow-connector"
  // Stars and banners
  | "banner"
  | "ribbon"
  | "scroll"
  | "wave"
  | "double-wave"
  // Symbols
  | "heart"
  | "lightning"
  | "sun"
  | "moon"
  | "cloud"
  | "smiley";

// Image Element
export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  alt?: string;
  objectFit: "contain" | "cover" | "fill" | "none";
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  filters?: ImageFilter[];
  border?: Border;
  shadow?: Shadow;
}

export interface ImageFilter {
  type: "brightness" | "contrast" | "saturation" | "blur" | "grayscale" | "sepia";
  value: number;
}

// Video Element
export interface VideoElement extends BaseElement {
  type: "video";
  src: string;
  poster?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  startTime?: number;
  endTime?: number;
}

// Audio Element
export interface AudioElement extends BaseElement {
  type: "audio";
  src: string;
  autoplay: boolean;
  loop: boolean;
  volume: number;
  hideIcon: boolean;
}

// Table Element
export interface TableElement extends BaseElement {
  type: "table";
  rows: number;
  cols: number;
  cells: TableCell[][];
  defaultCellStyle: CellStyle;
  headerRow: boolean;
  totalRow: boolean;
  bandedRows: boolean;
  bandedCols: boolean;
}

export interface TableCell {
  content: TextContent[];
  style: CellStyle;
  colspan: number;
  rowspan: number;
  merge?: boolean;
}

export interface CellStyle {
  fill?: Color;
  border?: Border;
  padding: number;
  verticalAlign: "top" | "middle" | "bottom";
}

// Chart Element
export interface ChartElement extends BaseElement {
  type: "chart";
  chartType: ChartType;
  data: ChartData;
  options: ChartOptions;
}

export type ChartType = "bar" | "column" | "line" | "pie" | "doughnut" | "area" | "scatter" | "radar";

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartOptions {
  title?: string;
  legend: boolean;
  legendPosition: "top" | "bottom" | "left" | "right";
  gridLines: boolean;
  dataLabels: boolean;
}

// Group Element
export interface GroupElement extends BaseElement {
  type: "group";
  children: SlideElement[];
}

export type SlideElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | VideoElement
  | AudioElement
  | TableElement
  | ChartElement
  | GroupElement;

// ============================================================================
// SLIDE
// ============================================================================

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: Background;
  layout: SlideLayout;
  notes: string;
  transition?: Transition;
  hidden?: boolean;
  master?: string; // Reference to slide master
}

export type SlideLayout =
  | "blank"
  | "title"
  | "title-content"
  | "section-header"
  | "two-content"
  | "comparison"
  | "content-caption"
  | "picture-caption"
  | "title-only";

// ============================================================================
// PRESENTATION
// ============================================================================

export interface Presentation {
  id: string;
  name: string;
  width: number;
  height: number;
  slides: Slide[];
  theme: Theme;
  masters: SlideMaster[];
  settings: PresentationSettings;
  metadata?: PresentationMetadata;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  effects?: ThemeEffects;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  background1: string;
  background2: string;
  text1: string;
  text2: string;
  hyperlink: string;
  followedHyperlink: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface ThemeEffects {
  shadow?: Shadow;
  reflection?: boolean;
  glow?: {
    color: string;
    size: number;
  };
}

export interface SlideMaster {
  id: string;
  name: string;
  background: Background;
  elements: SlideElement[];
  layouts: SlideLayout[];
}

export interface PresentationSettings {
  autoAdvance: boolean;
  advanceTime?: number; // milliseconds
  loop: boolean;
  showProgressBar: boolean;
  showSlideNumbers: boolean;
  showNotes: boolean;
  aspectRatio: "16:9" | "4:3" | "16:10";
}

export interface PresentationMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: string[];
  description?: string;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface EditorState {
  presentation: Presentation;
  currentSlideIndex: number;
  selectedElementIds: string[];
  clipboard: SlideElement[];
  history: HistoryEntry[];
  historyIndex: number;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  activeTab: RibbonTab;
  viewMode: ViewMode;
}

export interface HistoryEntry {
  presentation: Presentation;
  timestamp: Date;
  action: string;
}

export type RibbonTab = "home" | "insert" | "design" | "transitions" | "animations" | "slideshow" | "review" | "view";

export type ViewMode = "normal" | "outline" | "slide-sorter" | "notes" | "master" | "slideshow";

// ============================================================================
// EVENTS & INTERACTIONS
// ============================================================================

export interface SelectionBox {
  start: Point;
  end: Point;
}

export interface DragState {
  elementId: string;
  startPos: Point;
  currentPos: Point;
  offset: Point;
}

export interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startBBox: BBox;
  startPos: Point;
  aspectRatio?: number;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface RotateState {
  elementId: string;
  startAngle: number;
  center: Point;
}

// ============================================================================
// API & EXPORT
// ============================================================================

export interface ExportOptions {
  format: "pptx" | "pdf" | "png" | "jpg" | "svg" | "mp4";
  quality?: number;
  includeNotes?: boolean;
  slideRange?: {
    start: number;
    end: number;
  };
}

export interface ImportResult {
  presentation: Presentation;
  warnings?: string[];
  errors?: string[];
}
