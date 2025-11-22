"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PptistProject, PresentonExportResponse } from "./types";

type ExportMessage = {
  type: "presenton:pptist-export";
  payload: {
    project: PptistProject;
    preview?: string;
    source: string;
    version: string;
    exportedAt: number;
  };
};

const iframeSrc = "/pptist/index.html";

export function TemplateBuilderClient() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<
    "idle" | "waiting" | "processing" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PresentonExportResponse | null>(
    null
  );

  const postRequestToIframe = useCallback(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;
    iframeWindow.postMessage({ type: "presenton:request-export" }, "*");
    setStatus("waiting");
    setError(null);
  }, []);

  const handleExport = useCallback(async (payload: ExportMessage["payload"]) => {
    setStatus("processing");
    setError(null);
    try {
      const response = await fetch("/api/template-builder/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: PresentonExportResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || "Export failed");
      }
      setLastResult(data);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Export failed");
    }
  }, []);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      const message = event.data as ExportMessage | undefined;
      if (!message || message.type !== "presenton:pptist-export") return;
      handleExport(message.payload);
    },
    [handleExport]
  );

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "waiting":
        return "Waiting for PPTist to send data…";
      case "processing":
        return "Converting and saving template…";
      case "success":
        return "Template saved to Presenton";
      case "error":
        return "Export failed";
      default:
        return "Idle";
    }
  }, [status]);

  return (
    <div className="flex h-full min-h-[80vh] flex-col gap-4">
      <header className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <div className="text-lg font-semibold text-neutral-900">
            Template Builder (PPTist)
          </div>
          <p className="text-sm text-neutral-500">
            Design in PPTist inside the iframe. Click “导出” in the PPTist
            header or press “Request export” to pull the current project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            onClick={postRequestToIframe}
          >
            Request export
          </button>
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
            {statusLabel}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-lg border border-neutral-200 bg-white shadow-sm">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="h-[80vh] w-full rounded-lg"
            title="PPTist editor"
          />
        </div>
        <div className="col-span-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-neutral-900">Export log</h3>
          <div className="mt-2 text-sm text-neutral-600">
            <p>Status: {statusLabel}</p>
            {error && (
              <p className="mt-2 rounded-md bg-red-50 p-2 text-red-700">
                {error}
              </p>
            )}
            {lastResult?.presentationId && (
              <div className="mt-3 rounded-md bg-green-50 p-3 text-green-800">
                <p>Presentation ID: {lastResult.presentationId}</p>
                <p>Layouts saved: {lastResult.savedCount ?? 0}</p>
              </div>
            )}
          </div>
          <div className="mt-4 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
            <p className="font-semibold text-neutral-800">How it works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Design your slide(s) in the PPTist iframe.</li>
              <li>Click “导出” in PPTist, or press “Request export”.</li>
              <li>
                We receive the raw PPTist JSON, convert it to Presenton layout,
                render HTML, call FastAPI for HTML → React, then save via
                /template-management.
              </li>
              <li>Check the status panel for IDs and errors.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

