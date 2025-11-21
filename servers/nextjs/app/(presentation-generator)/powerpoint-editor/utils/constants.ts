// PowerPoint Editor Constants

// Font families
export const FONT_FAMILIES = [
  "Arial",
  "Arial Black",
  "Calibri",
  "Calibri Light",
  "Cambria",
  "Candara",
  "Comic Sans MS",
  "Consolas",
  "Courier New",
  "Georgia",
  "Impact",
  "Lucida Console",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
] as const;

// Font sizes
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96] as const;

// Line spacing options
export const LINE_SPACING_OPTIONS = [
  { label: "1.0", value: 1.0 },
  { label: "1.15", value: 1.15 },
  { label: "1.5", value: 1.5 },
  { label: "2.0", value: 2.0 },
  { label: "2.5", value: 2.5 },
  { label: "3.0", value: 3.0 },
] as const;

// Slide layouts
export const SLIDE_LAYOUTS = [
  { id: "blank", name: "Blank" },
  { id: "title", name: "Title Slide" },
  { id: "title-content", name: "Title and Content" },
  { id: "section-header", name: "Section Header" },
  { id: "two-content", name: "Two Content" },
  { id: "comparison", name: "Comparison" },
  { id: "title-only", name: "Title Only" },
  { id: "content-caption", name: "Content with Caption" },
  { id: "picture-caption", name: "Picture with Caption" },
] as const;

// Transition effects
export const TRANSITIONS = {
  none: { name: "None" },
  fade: { name: "Fade", hasDirection: false },
  push: { name: "Push", hasDirection: true },
  wipe: { name: "Wipe", hasDirection: true },
  split: { name: "Split", hasDirection: true },
  reveal: { name: "Reveal", hasDirection: true },
  cover: { name: "Cover", hasDirection: true },
  uncover: { name: "Uncover", hasDirection: true },
  flash: { name: "Flash", hasDirection: false },
  dissolve: { name: "Dissolve", hasDirection: false },
  zoom: { name: "Zoom", hasDirection: false },
  swivel: { name: "Swivel", hasDirection: false },
  fly: { name: "Fly", hasDirection: true },
  random: { name: "Random", hasDirection: false },
  gallery: { name: "Gallery", hasDirection: true },
  conveyor: { name: "Conveyor", hasDirection: true },
  rotate: { name: "Rotate", hasDirection: false },
  cube: { name: "Cube", hasDirection: true },
  doors: { name: "Doors", hasDirection: true },
  box: { name: "Box", hasDirection: true },
  comb: { name: "Comb", hasDirection: true },
  fall: { name: "Fall Over", hasDirection: false },
  drape: { name: "Drape", hasDirection: true },
  curtains: { name: "Curtains", hasDirection: false },
  wind: { name: "Wind", hasDirection: true },
  prestige: { name: "Prestige", hasDirection: false },
  fracture: { name: "Fracture", hasDirection: false },
  crush: { name: "Crush", hasDirection: false },
  origami: { name: "Origami", hasDirection: true },
} as const;

// Animation effects
export const ANIMATIONS = {
  entrance: {
    appear: "Appear",
    fade: "Fade",
    fly: "Fly In",
    float: "Float In",
    split: "Split",
    wipe: "Wipe",
    shape: "Shape",
    wheel: "Wheel",
    random: "Random Bars",
    grow: "Grow & Turn",
    zoom: "Zoom",
    swivel: "Swivel",
    bounce: "Bounce",
    pulse: "Pulse",
    color: "Color Pulse",
    teeter: "Teeter",
    spin: "Spin",
    grow_shrink: "Grow/Shrink",
    desaturate: "Desaturate",
    lighten: "Lighten",
    darken: "Darken",
    transparency: "Transparency",
    object_color: "Object Color",
    complementary: "Complementary Color",
    line_color: "Line Color",
    fill_color: "Fill Color",
  },
  emphasis: {
    pulse: "Pulse",
    teeter: "Teeter",
    spin: "Spin",
    grow_shrink: "Grow/Shrink",
    desaturate: "Desaturate",
    lighten: "Lighten",
    darken: "Darken",
    transparency: "Transparency",
    object_color: "Object Color",
    complementary: "Complementary Color",
    line_color: "Line Color",
    fill_color: "Fill Color",
    brush_color: "Brush Color",
    font_color: "Font Color",
    underline: "Underline",
    bold_flash: "Bold Flash",
    bold_reveal: "Bold Reveal",
    wave: "Wave",
  },
  exit: {
    disappear: "Disappear",
    fade: "Fade",
    fly_out: "Fly Out",
    float_out: "Float Out",
    split: "Split",
    wipe: "Wipe",
    shape: "Shape",
    random: "Random Bars",
    shrink: "Shrink & Turn",
    zoom: "Zoom",
    swivel: "Swivel",
    bounce: "Bounce",
  },
  motion: {
    lines: "Lines",
    arcs: "Arcs",
    turns: "Turns",
    shapes: "Shapes",
    loops: "Loops",
    custom: "Custom Path",
  },
} as const;

// Directions for transitions and animations
export const DIRECTIONS = {
  fromLeft: "From Left",
  fromRight: "From Right",
  fromTop: "From Top",
  fromBottom: "From Bottom",
  fromTopLeft: "From Top-Left",
  fromTopRight: "From Top-Right",
  fromBottomLeft: "From Bottom-Left",
  fromBottomRight: "From Bottom-Right",
} as const;

// Theme color presets
export const THEME_COLORS = [
  {
    id: "office",
    name: "Office",
    colors: {
      primary: "#0078d4",
      secondary: "#2b88d8",
      accent1: "#c43e1c",
      accent2: "#e67c73",
      accent3: "#f4b400",
      accent4: "#0f9d58",
      accent5: "#ab47bc",
      accent6: "#00acc1",
      background1: "#FFFFFF",
      background2: "#F3F2F1",
      text1: "#000000",
      text2: "#323130",
      hyperlink: "#0078d4",
      followedHyperlink: "#004578",
    },
  },
  {
    id: "colorful",
    name: "Colorful",
    colors: {
      primary: "#E7E6E6",
      secondary: "#44546A",
      accent1: "#4472C4",
      accent2: "#ED7D31",
      accent3: "#A5A5A5",
      accent4: "#FFC000",
      accent5: "#5B9BD5",
      accent6: "#70AD47",
      background1: "#FFFFFF",
      background2: "#E7E6E6",
      text1: "#000000",
      text2: "#44546A",
      hyperlink: "#0563C1",
      followedHyperlink: "#954F72",
    },
  },
  {
    id: "median",
    name: "Median",
    colors: {
      primary: "#96B900",
      secondary: "#00B0F0",
      accent1: "#FFC000",
      accent2: "#4472C4",
      accent3: "#A5A5A5",
      accent4: "#ED7D31",
      accent5: "#5B9BD5",
      accent6: "#70AD47",
      background1: "#FFFFFF",
      background2: "#F2F2F2",
      text1: "#000000",
      text2: "#44546A",
      hyperlink: "#0563C1",
      followedHyperlink: "#954F72",
    },
  },
] as const;

// Slide sizes (16:9, 4:3, custom)
export const SLIDE_SIZES = [
  { name: "Standard (4:3)", width: 960, height: 720 },
  { name: "Widescreen (16:9)", width: 1280, height: 720 },
  { name: "Widescreen (16:10)", width: 1280, height: 800 },
  { name: "Letter Paper (8.5x11 in)", width: 816, height: 1056 },
  { name: "Ledger Paper (11x17 in)", width: 1056, height: 1632 },
  { name: "A4 Paper", width: 794, height: 1123 },
  { name: "Custom", width: 0, height: 0 },
] as const;

// Chart types
export const CHART_TYPES = [
  { id: "column", name: "Column", icon: "BarChart" },
  { id: "line", name: "Line", icon: "LineChart" },
  { id: "pie", name: "Pie", icon: "PieChart" },
  { id: "bar", name: "Bar", icon: "BarChart" },
  { id: "area", name: "Area", icon: "AreaChart" },
  { id: "scatter", name: "Scatter", icon: "ScatterChart" },
  { id: "stock", name: "Stock", icon: "CandlestickChart" },
  { id: "surface", name: "Surface", icon: "Surface" },
  { id: "radar", name: "Radar", icon: "Radar" },
  { id: "treemap", name: "Treemap", icon: "TreeMap" },
  { id: "sunburst", name: "Sunburst", icon: "DonutChart" },
  { id: "histogram", name: "Histogram", icon: "BarChart" },
  { id: "box", name: "Box & Whisker", icon: "BoxPlot" },
  { id: "waterfall", name: "Waterfall", icon: "Waterfall" },
  { id: "funnel", name: "Funnel", icon: "Funnel" },
] as const;

// SmartArt categories
export const SMARTART_CATEGORIES = [
  { id: "list", name: "List" },
  { id: "process", name: "Process" },
  { id: "cycle", name: "Cycle" },
  { id: "hierarchy", name: "Hierarchy" },
  { id: "relationship", name: "Relationship" },
  { id: "matrix", name: "Matrix" },
  { id: "pyramid", name: "Pyramid" },
  { id: "picture", name: "Picture" },
] as const;

// View modes
export const VIEW_MODES = [
  { id: "normal", name: "Normal", icon: "Layout" },
  { id: "outline", name: "Outline View", icon: "List" },
  { id: "slide-sorter", name: "Slide Sorter", icon: "LayoutGrid" },
  { id: "notes", name: "Notes Page", icon: "FileText" },
  { id: "reading", name: "Reading View", icon: "BookOpen" },
] as const;

// Zoom levels
export const ZOOM_LEVELS = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400] as const;

// Bullet list styles
export const BULLET_STYLES = [
  { id: "disc", symbol: "•", name: "Filled Circle" },
  { id: "circle", symbol: "○", name: "Hollow Circle" },
  { id: "square", symbol: "■", name: "Filled Square" },
  { id: "check", symbol: "✓", name: "Check Mark" },
  { id: "arrow", symbol: "➔", name: "Arrow" },
  { id: "star", symbol: "★", name: "Star" },
  { id: "diamond", symbol: "◆", name: "Diamond" },
] as const;

// Number list styles
export const NUMBER_STYLES = [
  { id: "decimal", format: "1.", name: "1, 2, 3" },
  { id: "alpha-lower", format: "a.", name: "a, b, c" },
  { id: "alpha-upper", format: "A.", name: "A, B, C" },
  { id: "roman-lower", format: "i.", name: "i, ii, iii" },
  { id: "roman-upper", format: "I.", name: "I, II, III" },
] as const;

// Text alignments
export const TEXT_ALIGNMENTS = [
  { id: "left", name: "Align Left", icon: "AlignLeft" },
  { id: "center", name: "Align Center", icon: "AlignCenter" },
  { id: "right", name: "Align Right", icon: "AlignRight" },
  { id: "justify", name: "Justify", icon: "AlignJustify" },
] as const;

// Vertical alignments
export const VERTICAL_ALIGNMENTS = [
  { id: "top", name: "Align Top", icon: "AlignVerticalJustifyStart" },
  { id: "middle", name: "Align Middle", icon: "AlignVerticalJustifyCenter" },
  { id: "bottom", name: "Align Bottom", icon: "AlignVerticalJustifyEnd" },
] as const;

// Picture corrections
export const PICTURE_CORRECTIONS = {
  brightness: { min: -100, max: 100, default: 0 },
  contrast: { min: -100, max: 100, default: 0 },
  sharpness: { min: -100, max: 100, default: 0 },
  blur: { min: 0, max: 100, default: 0 },
} as const;

// Picture artistic effects
export const ARTISTIC_EFFECTS = [
  "none",
  "pencil-sketch",
  "line-drawing",
  "chalk-sketch",
  "paint-strokes",
  "paint-brush",
  "glow-diffused",
  "glow-edges",
  "light-screen",
  "watercolor-sponge",
  "glass",
  "cement",
  "texturizer",
  "patch-work",
  "mosaic-bubbles",
  "film-grain",
  "cutout",
  "plastic-wrap",
  "photocopy",
  "blur",
] as const;

// Export formats
export const EXPORT_FORMATS = [
  { id: "pptx", name: "PowerPoint Presentation (.pptx)", extension: ".pptx" },
  { id: "pdf", name: "PDF Document (.pdf)", extension: ".pdf" },
  { id: "png", name: "PNG Image (.png)", extension: ".png" },
  { id: "jpg", name: "JPEG Image (.jpg)", extension: ".jpg" },
  { id: "svg", name: "SVG Vector (.svg)", extension: ".svg" },
  { id: "gif", name: "GIF Animation (.gif)", extension: ".gif" },
  { id: "mp4", name: "Video (.mp4)", extension: ".mp4" },
] as const;
