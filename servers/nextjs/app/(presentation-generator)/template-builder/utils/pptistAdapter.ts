import { v4 as uuidv4 } from "uuid";
import {
  PptistElement,
  PptistProject,
  PresentonBorder,
  PresentonColor,
  PresentonElement,
  PresentonLayout,
  PresentonShadow,
  PresentonSlide,
} from "../types";

const fallbackColor = "#1f2937";

const toPresentonColor = (color?: string | PptistElement["fill"]): PresentonColor | undefined => {
  if (!color) return undefined;

  if (typeof color === "string") {
    return { type: "solid", value: color };
  }

  if (typeof color === "object" && "type" in color) {
    return {
      type: "gradient",
      value: (color.colors && color.colors[0]?.color) || fallbackColor,
      gradientStops: color.colors?.map((c: { pos: number; color: string }) => ({
        offset: c.pos,
        color: c.color,
      })),
      angle: color.rotate,
    };
  }

  return undefined;
};

const toBorder = (outline?: { style?: string; width?: number; color?: string }): PresentonBorder | undefined => {
  if (!outline) return undefined;
  if (!outline.color && !outline.width) return undefined;
  return {
    color: outline.color,
    width: outline.width,
    style: (outline.style as PresentonBorder["style"]) || "solid",
  };
};

const toShadow = (
  shadow?: { h: number; v: number; blur: number; color: string }
): PresentonShadow | undefined => {
  if (!shadow) return undefined;
  return {
    x: shadow.h,
    y: shadow.v,
    blur: shadow.blur,
    color: shadow.color,
  };
};

const mapElement = (element: PptistElement): PresentonElement => {
  const frame = {
    x: element.left,
    y: element.top,
    width: element.width,
    height: element.height,
    rotate: element.rotate || 0,
  };

  if (element.type === "text") {
    const fontSizeMatch = element.content?.match(/font-size:\s*(\d+)px/i);
    const textAlignMatch = element.content?.match(/text-align:\s*(left|center|right|justify)/i);

    return {
      kind: "text",
      id: element.id,
      frame,
      content: element.content || "",
      style: {
        fontFamily: element.defaultFontName,
        color: element.defaultColor || fallbackColor,
        fontSize: fontSizeMatch ? Number(fontSizeMatch[1]) : undefined,
        lineHeight: element.lineHeight,
        letterSpacing: element.wordSpace,
        opacity: element.opacity,
        textAlign: textAlignMatch ? (textAlignMatch[1] as any) : "left",
        backgroundColor: typeof element.fill === "string" ? element.fill : undefined,
        border: toBorder(element.outline),
        shadow: toShadow(element.shadow),
        vertical: element.vertical,
      },
    };
  }

  if (element.type === "image") {
    return {
      kind: "image",
      id: element.id,
      frame,
      src: (element as any).src || "",
      style: {
        objectFit: "contain",
        opacity: element.opacity,
        border: toBorder(element.outline),
        shadow: toShadow(element.shadow),
        flipH: (element as any).flipH,
        flipV: (element as any).flipV,
      },
    };
  }

  if (element.type === "shape" || element.type === "line") {
    return {
      kind: "shape",
      id: element.id,
      frame,
      path: (element as any).path,
      viewBox: (element as any).viewBox,
      style: {
        fill: toPresentonColor((element as any).fill),
        border: toBorder(element.outline),
        opacity: element.opacity,
        radius: (element as any).radius,
        shadow: toShadow(element.shadow),
        flipH: (element as any).flipH,
        flipV: (element as any).flipV,
      },
    };
  }

  return {
    kind: "shape",
    id: element.id,
    frame,
    style: {
      fill: { type: "solid", value: fallbackColor },
    },
  };
};

const mapBackground = (background: any): PresentonSlide["background"] => {
  if (!background) return undefined;
  if (background.type === "solid") {
    return { type: "solid", value: background.color || fallbackColor };
  }
  if (background.type === "image") {
    return {
      type: "solid",
      value: background.color || "#ffffff",
      image: {
        src: background.image?.src,
        size: background.image?.size || "cover",
      },
    };
  }
  if (background.type === "gradient") {
    return {
      type: "gradient",
      value: background.gradient?.colors?.[0]?.color || fallbackColor,
      gradientStops: background.gradient?.colors?.map((c: any) => ({
        offset: c.pos,
        color: c.color,
      })),
      angle: background.gradient?.rotate,
    };
  }
  return undefined;
};

export const convertPptistToPresentonLayout = (project: PptistProject): PresentonLayout => {
  const layoutId = uuidv4();
  const slides: PresentonSlide[] = project.slides.map((slide, idx) => ({
    id: slide.id || `slide-${idx + 1}`,
    name: slide.type ? `${slide.type}-${idx + 1}` : `Slide ${idx + 1}`,
    remark: slide.remark,
    background: mapBackground(slide.background),
    elements: (slide.elements || []).map(mapElement),
  }));

  return {
    id: layoutId,
    title: project.title || "Untitled",
    meta: {
      width: project.width,
      height: project.height,
      theme: project.theme || {},
      fonts: [],
    },
    slides,
  };
};

const px = (value?: number) => (typeof value === "number" ? `${value}px` : undefined);

const styleToString = (style: Record<string, string | number | undefined>) =>
  Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");

const renderBackground = (background: PresentonSlide["background"]) => {
  if (!background) return "";
  if (background.image?.src) {
    return `background: ${background.value || "#fff"} url('${background.image.src}') center/ ${
      background.image.size || "cover"
    } no-repeat;`;
  }
  if (background.type === "gradient" && background.gradientStops?.length) {
    const stops = background.gradientStops
      .map((stop) => `${stop.color} ${stop.offset}%`)
      .join(", ");
    const angle = background.angle ?? 0;
    return `background: linear-gradient(${angle}deg, ${stops});`;
  }
  return `background: ${background.value || "#fff"};`;
};

const renderElement = (element: PresentonElement) => {
  if (element.kind === "text") {
    const style = styleToString({
      position: "absolute",
      left: px(element.frame.x),
      top: px(element.frame.y),
      width: px(element.frame.width),
      height: px(element.frame.height),
      transform: element.frame.rotate ? `rotate(${element.frame.rotate}deg)` : undefined,
      color: element.style.color || fallbackColor,
      "font-family": element.style.fontFamily,
      "font-size": element.style.fontSize ? `${element.style.fontSize}px` : undefined,
      "line-height": element.style.lineHeight,
      "letter-spacing": element.style.letterSpacing
        ? `${element.style.letterSpacing}px`
        : undefined,
      "text-align": element.style.textAlign || "left",
      "background-color": element.style.backgroundColor,
      opacity: element.style.opacity ?? 1,
      "writing-mode": element.style.vertical ? "vertical-rl" : undefined,
      "border-color": element.style.border?.color,
      "border-width": element.style.border?.width
        ? `${element.style.border.width}px`
        : undefined,
      "border-style": element.style.border?.style,
      "box-shadow": element.style.shadow
        ? `${element.style.shadow.x}px ${element.style.shadow.y}px ${element.style.shadow.blur}px ${element.style.shadow.color}`
        : undefined,
      padding: "8px",
      overflow: "hidden",
    });
    return `<div class="el text" style="${style}">${element.content}</div>`;
  }

  if (element.kind === "image") {
    const style = styleToString({
      position: "absolute",
      left: px(element.frame.x),
      top: px(element.frame.y),
      width: px(element.frame.width),
      height: px(element.frame.height),
      transform: element.frame.rotate ? `rotate(${element.frame.rotate}deg)` : undefined,
      "object-fit": element.style.objectFit || "contain",
      opacity: element.style.opacity ?? 1,
      "border-color": element.style.border?.color,
      "border-width": element.style.border?.width
        ? `${element.style.border.width}px`
        : undefined,
      "border-style": element.style.border?.style,
      "box-shadow": element.style.shadow
        ? `${element.style.shadow.x}px ${element.style.shadow.y}px ${element.style.shadow.blur}px ${element.style.shadow.color}`
        : undefined,
      transformOrigin: "center",
    });
    const flips = [
      element.style.flipH ? "scaleX(-1)" : "",
      element.style.flipV ? "scaleY(-1)" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const transform = [element.frame.rotate ? `rotate(${element.frame.rotate}deg)` : "", flips]
      .filter(Boolean)
      .join(" ");

    const mergedStyle = transform ? `${style}; transform: ${transform};` : style;

    return `<img class="el image" src="${element.src}" alt="" style="${mergedStyle}" />`;
  }

  const shape = element as any;
  const fill = shape.style.fill;
  const shapeBackground =
    fill?.type === "gradient" && fill.gradientStops?.length
      ? `background: linear-gradient(${fill.angle ?? 0}deg, ${fill.gradientStops
          .map((stop: any) => `${stop.color} ${stop.offset}%`)
          .join(", ")});`
      : fill?.value
      ? `background: ${fill.value};`
      : "";

  const style = styleToString({
    position: "absolute",
    left: px(shape.frame.x),
    top: px(shape.frame.y),
    width: px(shape.frame.width),
    height: px(shape.frame.height),
    transform: shape.frame.rotate ? `rotate(${shape.frame.rotate}deg)` : undefined,
    opacity: shape.style.opacity ?? 1,
    "border-radius": shape.style.radius ? `${shape.style.radius}px` : undefined,
    "border-color": shape.style.border?.color,
    "border-width": shape.style.border?.width
      ? `${shape.style.border.width}px`
      : undefined,
    "border-style": shape.style.border?.style,
    "box-shadow": shape.style.shadow
      ? `${shape.style.shadow.x}px ${shape.style.shadow.y}px ${shape.style.shadow.blur}px ${shape.style.shadow.color}`
      : undefined,
    overflow: "hidden",
  });

  const flips = [
    shape.style.flipH ? "scaleX(-1)" : "",
    shape.style.flipV ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const transform = [shape.frame.rotate ? `rotate(${shape.frame.rotate}deg)` : "", flips]
    .filter(Boolean)
    .join(" ");
  const mergedStyle = transform ? `${style}; transform: ${transform};` : style;

  if (shape.path) {
    return `<div class="el shape" style="${mergedStyle}">${`<svg width="100%" height="100%" viewBox="${
      shape.viewBox || `0 0 ${shape.frame.width} ${shape.frame.height}`
    }" preserveAspectRatio="none"><path d="${shape.path}" fill="${
      fill?.value || fallbackColor
    }"/></svg>`}</div>`;
  }

  return `<div class="el shape" style="${mergedStyle}${shapeBackground}"></div>`;
};

export const presentonSlideToHtml = (slide: PresentonSlide, meta: PresentonLayout["meta"]) => {
  const backgroundStyle = renderBackground(slide.background) || renderBackground({
    type: "solid",
    value: meta.theme?.backgroundColor || "#fff",
  });

  const elementsHtml = slide.elements.map(renderElement).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: ${meta.theme?.fontName || "Inter, sans-serif"}; }
      .slide {
        position: relative;
        width: ${meta.width}px;
        height: ${meta.height}px;
        ${backgroundStyle}
        overflow: hidden;
      }
      .el { position: absolute; }
    </style>
  </head>
  <body>
    <div class="slide" data-slide-id="${slide.id}">
      ${elementsHtml}
    </div>
  </body>
</html>`;
};
