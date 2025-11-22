"use client";

import { useState } from "react";
import { TemplateBuilderClient } from "./TemplateBuilderClient";
import AppShell from "@/app/(template-builder)/pptist-react/AppShell";

type TabKey = "pptx" | "iframe";

export default function TemplateBuilderPageClient() {
  const [tab, setTab] = useState<TabKey>("pptx");

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <button
          className={`rounded px-3 py-1 text-sm font-medium ${
            tab === "pptx"
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setTab("pptx")}
        >
          PPTX Creator (PPTist React)
        </button>
        <button
          className={`rounded px-3 py-1 text-sm font-medium ${
            tab === "iframe"
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setTab("iframe")}
        >
          Legacy Template Builder (iframe)
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-slate-50">
        {tab === "pptx" ? (
          <AppShell />
        ) : (
          <div className="p-6">
            <TemplateBuilderClient />
          </div>
        )}
      </div>
    </div>
  );
}

