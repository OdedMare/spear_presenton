"use client";

import { useState } from "react";
import clsx from "clsx";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
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
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);

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
        <div className="mt-2 grid grid-cols-7 gap-1 rounded border border-slate-200 bg-white p-2 shadow-md">
          {presetColors.map((c) => (
            <button
              key={c}
              className={clsx(
                "h-6 w-6 rounded border border-slate-200",
                c.toLowerCase() === value.toLowerCase() && "ring-2 ring-blue-500"
              )}
              style={{ background: c }}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
            />
          ))}
          <div className="col-span-7 flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-12 rounded border border-slate-200 bg-white"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 flex-1 rounded border border-slate-200 px-2 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

