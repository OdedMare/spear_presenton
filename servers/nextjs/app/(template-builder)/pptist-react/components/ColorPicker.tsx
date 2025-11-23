"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useMainStore } from "../store/main";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
  themeColors?: string[];
  allowTransparent?: boolean;
}

const defaultColors = [
  "#000000",
  "#ffffff",
  "#1f2937",
  "#4b5563",
  "#9ca3af",
  "#e5e7eb",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
];

export default function ColorPicker({
  label,
  value,
  onChange,
  presetColors = defaultColors,
  themeColors = [],
  allowTransparent = true,
}: ColorPickerProps) {
  const recentColors = useMainStore((s) => s.recentColors);
  const addRecentColor = useMainStore((s) => s.addRecentColor);
  const [open, setOpen] = useState(false);
  const swatches = useMemo(
    () => ({
      theme: themeColors.filter(Boolean),
      recent: recentColors || [],
      basic: presetColors,
    }),
    [presetColors, recentColors, themeColors]
  );

  const handlePick = (color: string) => {
    onChange(color);
    addRecentColor(color);
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-slate-600">{label}</div>}
      <div className="flex items-center gap-2">
        <button
          className="h-8 w-12 rounded border border-slate-200"
          style={{ background: value }}
          onClick={() => setOpen((o) => !o)}
        />
        <span className="text-xs text-slate-600">{value}</span>
      </div>
      {open && (
        <div className="mt-2 w-[280px] space-y-2 rounded border border-slate-200 bg-white p-3 shadow-md">
          {swatches.theme.length > 0 && (
            <div>
              <div className="text-[11px] uppercase text-slate-500">Theme</div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {swatches.theme.map((c) => (
                  <button
                    key={`theme-${c}`}
                    className={clsx(
                      "h-6 w-6 rounded border border-slate-200",
                      c.toLowerCase() === value.toLowerCase() && "ring-2 ring-blue-500"
                    )}
                    style={{ background: c }}
                    onClick={() => handlePick(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {swatches.recent.length > 0 && (
            <div>
              <div className="text-[11px] uppercase text-slate-500">Recent</div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {swatches.recent.map((c) => (
                  <button
                    key={`recent-${c}`}
                    className={clsx(
                      "h-6 w-6 rounded border border-slate-200",
                      c.toLowerCase() === value.toLowerCase() && "ring-2 ring-blue-500"
                    )}
                    style={{ background: c }}
                    onClick={() => handlePick(c)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase text-slate-500">Standard</div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  className={clsx(
                    "h-6 w-6 rounded border border-slate-200",
                    c.toLowerCase() === value.toLowerCase() && "ring-2 ring-blue-500"
                  )}
                  style={{ background: c }}
                  onClick={() => handlePick(c)}
                />
              ))}
              {allowTransparent && (
                <button
                  className="col-span-2 h-6 rounded border border-slate-300 text-[11px] text-slate-600"
                  onClick={() => handlePick("transparent")}
                >
                  Transparent
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => handlePick(e.target.value)}
              className="h-8 w-12 rounded border border-slate-200 bg-white"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 flex-1 rounded border border-slate-200 px-2 text-xs"
            />
            <button
              className="rounded border border-slate-300 px-2 py-1 text-[11px]"
              onClick={() => handlePick(value)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
