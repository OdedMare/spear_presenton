"use client";

import { useEffect, useMemo, useState } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";
import { useActiveSlide } from "../hooks/useActiveSlide";
import type { PPTElement, Slide } from "../types/pptist";
import ColorPicker from "../components/ColorPicker";
import { buildHtmlFromPlainText, sanitizeRichHtml, stripHtml } from "../utils/text";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] uppercase tracking-wide text-slate-500">{children}</div>
);

export default function InspectorPanel() {
  const activeIds = useMainStore((s) => s.activeElementIdList);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const updateSlide = useSlidesStore((s) => s.updateSlide);
  const { currentSlide } = useActiveSlide();
  const bringForward = useSlidesStore((s) => s.bringForward);
  const sendBackward = useSlidesStore((s) => s.sendBackward);
  const bringToFront = useSlidesStore((s) => s.bringToFront);
  const sendToBack = useSlidesStore((s) => s.sendToBack);
  const [textValue, setTextValue] = useState("");

  const [localBg, setLocalBg] = useState(currentSlide?.background?.color || "#ffffff");

  const activeElement: PPTElement | null = useMemo(() => {
    if (!currentSlide?.elements?.length || !activeIds.length) return null;
    return currentSlide.elements.find((el) => el.id === activeIds[0]) || null;
  }, [activeIds, currentSlide]);

  useEffect(() => {
    if (activeElement?.type === "text") {
      const raw = (activeElement as any).text || (activeElement as any).plainText;
      const fromContent = stripHtml((activeElement as any).content || "");
      setTextValue(raw ?? fromContent ?? "");
    } else {
      setTextValue("");
    }
  }, [activeElement]);

  const updateOpacity = (value: number) => {
    if (!activeElement) return;
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { opacity: value },
    });
  };

  const updateObjectFit = (value: "contain" | "cover" | "fill") => {
    if (!activeElement) return;
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { objectFit: value } as any,
    });
  };

  const updateColor = (key: "defaultColor" | "fill", value: string) => {
    if (!activeElement) return;
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { [key]: value },
    });
  };

  const updateOutline = (color?: string, width?: number, style?: string) => {
    if (!activeElement) return;
    const outline = {
      ...((activeElement as any).outline || {}),
      color,
      width,
      style,
    };
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { outline },
    });
  };

  const updateShadow = (color?: string, blur?: number, h?: number, v?: number) => {
    if (!activeElement) return;
    const shadow = {
      ...((activeElement as any).shadow || {}),
      color,
      blur,
      h,
      v,
    };
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { shadow },
    });
  };

  const updateNumberProp = (key: string, value: number) => {
    if (!activeElement) return;
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { [key]: value },
    });
  };

  const updateTextStyle = (props: Record<string, any>) => {
    if (!activeElement) return;
    if (activeElement.type !== "text") return;
    const current = {
      fontSize: (activeElement as any).fontSize ?? 16,
      lineHeight: (activeElement as any).lineHeight ?? 1.35,
      letterSpacing: (activeElement as any).letterSpacing ?? 0,
      textAlign: (activeElement as any).textAlign ?? "left",
      textBold: !!(activeElement as any).textBold,
      textItalic: !!(activeElement as any).textItalic,
      textUnderline: !!(activeElement as any).textUnderline,
      textStrikethrough: !!(activeElement as any).textStrikethrough,
      textHighlight: (activeElement as any).textHighlight || "",
      bulletList: !!(activeElement as any).bulletList,
      orderedList: !!(activeElement as any).orderedList,
      textLink: (activeElement as any).textLink || "",
      text: (activeElement as any).text || textValue,
    };
    const next = { ...current, ...props };
    if (next.bulletList && next.orderedList) {
      next.orderedList = false;
    }
    const html = buildHtmlFromPlainText(next.text ?? textValue, next as any);
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: { ...next, text: next.text ?? textValue, content: html },
    });
  };

  const applyPastedHtml = (raw: string) => {
    if (!activeElement || activeElement.type !== "text") return;
    const clean = sanitizeRichHtml(raw || "");
    const plain = stripHtml(clean);
    setTextValue(plain);
    updateElement({
      id: activeElement.id,
      slideId: currentSlide?.id,
      props: {
        content: clean,
        text: plain,
        bulletList: /<ul/i.test(clean),
        orderedList: /<ol/i.test(clean),
      },
    });
  };

  const handleBackgroundChange = (color: string) => {
    if (!currentSlide) return;
    setLocalBg(color);
    const bg = currentSlide.background || { type: "solid" };
    const newBg = { ...bg, type: "solid", color };
    updateSlide({ background: newBg } as Partial<Slide>, currentSlide.id);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-sm text-slate-800 gap-3">
      <div>
        <Label>Slide background</Label>
        <div className="mt-2">
          <ColorPicker value={localBg} onChange={handleBackgroundChange} />
        </div>
      </div>

      {!activeElement && (
        <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-slate-500 text-xs">
          Select an element to edit its properties
        </div>
      )}

      {activeElement && (
        <div className="space-y-3">
          <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
            <Label>Selected element</Label>
            <div className="mt-1 text-xs text-slate-600">
              ID: {activeElement.id} • Type: {activeElement.type}
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <Label>Position & Size</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div>X</div>
                <input
                  type="number"
                  className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  defaultValue={Math.round(activeElement.left)}
                  onBlur={(e) => updateNumberProp("left", Number(e.target.value || 0))}
                />
              </div>
              <div className="space-y-1">
                <div>Y</div>
                <input
                  type="number"
                  className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  defaultValue={Math.round(activeElement.top)}
                  onBlur={(e) => updateNumberProp("top", Number(e.target.value || 0))}
                />
              </div>
              <div className="space-y-1">
                <div>Width</div>
                <input
                  type="number"
                  min={1}
                  className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  defaultValue={Math.round(activeElement.width)}
                  onBlur={(e) =>
                    updateNumberProp("width", Math.max(1, Number(e.target.value || 1)))
                  }
                />
              </div>
              <div className="space-y-1">
                <div>Height</div>
                <input
                  type="number"
                  min={1}
                  className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  defaultValue={Math.round(activeElement.height)}
                  onBlur={(e) =>
                    updateNumberProp("height", Math.max(1, Number(e.target.value || 1)))
                  }
                />
              </div>
              <div className="space-y-1">
                <div>Rotation</div>
                <input
                  type="number"
                  className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  defaultValue={Math.round(activeElement.rotate || 0)}
                  onBlur={(e) =>
                    updateNumberProp(
                      "rotate",
                      (((Number(e.target.value || 0) % 360) + 360) % 360) as number
                    )
                  }
                />
              </div>
            </div>
          </div>

          {(activeElement.type === "text" || activeElement.type === "shape") && (
            <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-3">
              <Label>Colors</Label>
              {activeElement.type === "text" && (
                <ColorPicker
                  label="Text"
                  value={(activeElement as any).defaultColor || "#000000"}
                  onChange={(val) => updateColor("defaultColor", val)}
                />
              )}
              <ColorPicker
                label="Fill"
                value={
                  typeof (activeElement as any).fill === "string"
                    ? ((activeElement as any).fill as string)
                    : "#e5e7eb"
                }
                onChange={(val) => updateColor("fill", val)}
              />
              <div className="space-y-1">
                <Label>Outline</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={((activeElement as any).outline?.color as string) || "#000000"}
                    onChange={(val) =>
                      updateOutline(
                        val,
                        (activeElement as any).outline?.width,
                        (activeElement as any).outline?.style
                      )
                    }
                  />
                  <input
                    type="number"
                    className="h-8 w-16 rounded border border-slate-200 px-2 text-sm"
                    min={0}
                    max={20}
                    defaultValue={(activeElement as any).outline?.width || 1}
                    onBlur={(e) =>
                      updateOutline(
                        (activeElement as any).outline?.color,
                        Number(e.target.value || 1),
                        (activeElement as any).outline?.style
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Shadow</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={((activeElement as any).shadow?.color as string) || "#000000"}
                    onChange={(val) =>
                      updateShadow(
                        val,
                        (activeElement as any).shadow?.blur,
                        (activeElement as any).shadow?.h,
                        (activeElement as any).shadow?.v
                      )
                    }
                  />
                  <input
                    type="number"
                    className="h-8 w-14 rounded border border-slate-200 px-2 text-sm"
                    placeholder="Blur"
                    onBlur={(e) =>
                      updateShadow(
                        (activeElement as any).shadow?.color,
                        Number(e.target.value || 4),
                        (activeElement as any).shadow?.h,
                        (activeElement as any).shadow?.v
                      )
                    }
                  />
                  <input
                    type="number"
                    className="h-8 w-14 rounded border border-slate-200 px-2 text-sm"
                    placeholder="H"
                    onBlur={(e) =>
                      updateShadow(
                        (activeElement as any).shadow?.color,
                        (activeElement as any).shadow?.blur,
                        Number(e.target.value || 2),
                        (activeElement as any).shadow?.v
                      )
                    }
                  />
                  <input
                    type="number"
                    className="h-8 w-14 rounded border border-slate-200 px-2 text-sm"
                    placeholder="V"
                    onBlur={(e) =>
                      updateShadow(
                        (activeElement as any).shadow?.color,
                        (activeElement as any).shadow?.blur,
                        (activeElement as any).shadow?.h,
                        Number(e.target.value || 2)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}
          {activeElement.type === "shape" && (
            <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <Label>Shape</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div>Preset</div>
                  <select
                    className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                    defaultValue={(activeElement as any).shapePreset || "rectangle"}
                    onChange={(e) =>
                      updateElement({
                        id: activeElement.id,
                        slideId: currentSlide?.id,
                        props: { shapePreset: e.target.value },
                      })
                    }
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="round-rect">Round rect</option>
                    <option value="ellipse">Ellipse</option>
                    <option value="diamond">Diamond</option>
                    <option value="arrow-right">Arrow Right</option>
                    <option value="arrow-left">Arrow Left</option>
                    <option value="arrow-up">Arrow Up</option>
                    <option value="arrow-down">Arrow Down</option>
                    <option value="chevron">Chevron</option>
                    <option value="parallelogram">Parallelogram</option>
                    <option value="hexagon">Hexagon</option>
                    <option value="star">Star</option>
                    <option value="cloud">Cloud</option>
                    <option value="trapezoid">Trapezoid</option>
                    <option value="callout-rect">Callout</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div>Corner radius</div>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                    defaultValue={(activeElement as any).cornerRadius ?? 8}
                    onBlur={(e) =>
                      updateElement({
                        id: activeElement.id,
                        slideId: currentSlide?.id,
                        props: { cornerRadius: Math.max(0, Number(e.target.value || 0)) },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-600">Outline style</div>
                <select
                  className="h-8 w-40 rounded border border-slate-200 px-2 text-sm"
                  defaultValue={(activeElement as any).outline?.style || "solid"}
                  onChange={(e) =>
                    updateOutline(
                      (activeElement as any).outline?.color,
                      (activeElement as any).outline?.width,
                      e.target.value
                    )
                  }
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>
            </div>
          )}

          {activeElement.type === "text" && (
            <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-3">
              <Label>Text Content</Label>
              <textarea
                className="w-full rounded border border-slate-200 px-2 py-2 text-sm"
                rows={4}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={(e) =>
                  updateTextStyle({
                    text: e.target.value,
                  })
                }
                placeholder="Type text..."
              />
              <div className="flex items-center gap-2 text-xs">
                <button
                  className="rounded border border-slate-300 px-2 py-1"
                  onClick={() => applyPastedHtml(textValue)}
                >
                  Paste as HTML (sanitize)
                </button>
              </div>

              <Label>Typography</Label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="col-span-1 space-y-1">
                  <div>Size</div>
                  <input
                    type="number"
                    min={8}
                    max={200}
                    defaultValue={(activeElement as any).fontSize || 16}
                    onBlur={(e) =>
                      updateTextStyle({
                        fontSize: Math.max(8, Number(e.target.value || 16)),
                      })
                    }
                    className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <div>Line height</div>
                  <input
                    type="number"
                    step={0.05}
                    min={0.5}
                    max={3}
                    defaultValue={(activeElement as any).lineHeight || 1.35}
                    onBlur={(e) =>
                      updateTextStyle({
                        lineHeight: Math.max(0.5, Number(e.target.value || 1.35)),
                      })
                    }
                    className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <div>Letter spacing</div>
                  <input
                    type="number"
                    step={0.25}
                    min={-5}
                    max={20}
                    defaultValue={(activeElement as any).letterSpacing || 0}
                    onBlur={(e) =>
                      updateTextStyle({
                        letterSpacing: Number(e.target.value || 0),
                      })
                    }
                    className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textAlign === "left"
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() => updateTextStyle({ textAlign: "left" })}
                >
                  Left
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textAlign === "center"
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() => updateTextStyle({ textAlign: "center" })}
                >
                  Center
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textAlign === "right"
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() => updateTextStyle({ textAlign: "right" })}
                >
                  Right
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textBold
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() => updateTextStyle({ textBold: !(activeElement as any).textBold })}
                >
                  Bold
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textItalic
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateTextStyle({ textItalic: !(activeElement as any).textItalic })
                  }
                >
                  Italic
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textUnderline
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateTextStyle({ textUnderline: !(activeElement as any).textUnderline })
                  }
                >
                  Underline
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).textStrikethrough
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateTextStyle({
                      textStrikethrough: !(activeElement as any).textStrikethrough,
                    })
                  }
                >
                  Strike
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).bulletList
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateTextStyle({
                      bulletList: !(activeElement as any).bulletList,
                      orderedList: false,
                    })
                  }
                >
                  Bullets
                </button>
                <button
                  className={`rounded border px-2 py-1 ${
                    (activeElement as any).orderedList
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateTextStyle({
                      orderedList: !(activeElement as any).orderedList,
                      bulletList: false,
                    })
                  }
                >
                  Numbering
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-20">Highlight</span>
                <ColorPicker
                  value={(activeElement as any).textHighlight || ""}
                  onChange={(val) => updateTextStyle({ textHighlight: val })}
                />
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() => updateTextStyle({ textHighlight: "" })}
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-20">Link</span>
                <input
                  type="text"
                  className="h-8 flex-1 rounded border border-slate-200 px-2 text-sm"
                  defaultValue={(activeElement as any).textLink || ""}
                  placeholder="https://..."
                  onBlur={(e) => updateTextStyle({ textLink: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Opacity</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  defaultValue={((activeElement as any).opacity ?? 1) * 100}
                  onChange={(e) => updateOpacity(Number(e.target.value) / 100)}
                  className="flex-1"
                />
                <span className="text-xs text-slate-600 w-10 text-right">
                  {Math.round(((activeElement as any).opacity ?? 1) * 100)}%
                </span>
              </div>
            </div>
          )}

          {activeElement.type === "image" && (
            <div className="rounded border border-slate-200 bg-white p-3 shadow-sm space-y-3">
              <Label>Image</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Fit</span>
                <select
                  className="h-8 w-28 rounded border border-slate-200 px-2 text-sm"
                  defaultValue={(activeElement as any).objectFit || "contain"}
                  onChange={(e) =>
                    updateObjectFit(e.target.value as "contain" | "cover" | "fill")
                  }
                >
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Opacity</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  defaultValue={((activeElement as any).opacity ?? 1) * 100}
                  onChange={(e) => updateOpacity(Number(e.target.value) / 100)}
                  className="flex-1"
                />
                <span className="text-xs text-slate-600 w-10 text-right">
                  {Math.round(((activeElement as any).opacity ?? 1) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Flip</span>
                <button
                  className={`rounded border px-2 py-1 text-xs ${
                    (activeElement as any).flipH
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateElement({
                      id: activeElement.id,
                      slideId: currentSlide?.id,
                      props: { flipH: !(activeElement as any).flipH },
                    })
                  }
                >
                  Horizontal
                </button>
                <button
                  className={`rounded border px-2 py-1 text-xs ${
                    (activeElement as any).flipV
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-300"
                  }`}
                  onClick={() =>
                    updateElement({
                      id: activeElement.id,
                      slideId: currentSlide?.id,
                      props: { flipV: !(activeElement as any).flipV },
                    })
                  }
                >
                  Vertical
                </button>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-600">Crop (inset %)</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["top", "right", "bottom", "left"].map((side) => (
                    <div key={side} className="space-y-1">
                      <div className="capitalize">{side}</div>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        defaultValue={(activeElement as any).imageCrop?.[side] || 0}
                        className="h-8 w-full rounded border border-slate-200 px-2 text-sm"
                        onBlur={(e) => {
                          const val = Math.min(40, Math.max(0, Number(e.target.value || 0)));
                          const prev = (activeElement as any).imageCrop || {};
                          updateElement({
                            id: activeElement.id,
                            slideId: currentSlide?.id,
                            props: { imageCrop: { ...prev, [side]: val } },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
