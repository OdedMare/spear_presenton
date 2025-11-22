"use client";

import { useState } from "react";
import { useSlidesStore } from "../store/slides";
import { useMainStore } from "../store/main";

export default function HeaderBar() {
  const title = useSlidesStore((s) => s.title);
  const setTitle = useSlidesStore((s) => s.setTitle);
  const openExport = useMainStore((s) => s.setDialogForExport);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(title);

  const handleBlur = () => {
    setTitle(input.trim() || "未命名演示文稿");
    setEditing(false);
  };

  return (
    <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-white px-2">
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            className="h-8 w-56 rounded border border-slate-300 px-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur();
            }}
          />
        ) : (
          <div
            className="line-clamp-1 max-w-[240px] cursor-text text-sm font-semibold text-slate-800"
            title={title}
            onClick={() => {
              setInput(title);
              setEditing(true);
            }}
          >
            {title}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          className="rounded px-3 py-1 text-slate-700 hover:bg-slate-100"
          onClick={() => openExport("pptx")}
        >
          导出
        </button>
        <button
          className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
          onClick={() => openExport("presenton")}
        >
          导出到 Presenton
        </button>
      </div>
    </div>
  );
}

