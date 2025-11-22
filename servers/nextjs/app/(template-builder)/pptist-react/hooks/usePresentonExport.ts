"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import type { PptistProject } from "@/app/(presentation-generator)/template-builder/types";
import { useSlidesStore } from "../store/slides";
import { convertPptistToPresentonLayout, presentonSlideToHtml } from "../converters/pptistToPresenton";

interface ExportResult {
  presentationId: string;
  savedCount: number;
}

export const usePresentonExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const slidesState = useSlidesStore();

  const exportToPresenton = useCallback(
    async (opts?: { onSuccess?: (res: ExportResult) => void }) => {
      setIsExporting(true);
      setError(null);
      try {
        const pptistProject: PptistProject = {
          title: slidesState.title,
          width: slidesState.viewportSize,
          height: slidesState.viewportSize * slidesState.viewportRatio,
          theme: slidesState.theme,
          slides: slidesState.slides as any,
        };

        const layout = convertPptistToPresentonLayout(pptistProject);
        const presentationId = uuidv4();
        const fonts: string[] = [];

        const layoutResults: {
          presentation: string;
          layout_id: string;
          layout_name: string;
          layout_code: string;
          fonts: string[];
        }[] = [];

        for (const slide of layout.slides) {
          const html = presentonSlideToHtml(slide, layout.meta);
          const res = await fetch("/api/v1/ppt/html-to-react/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.detail || "html-to-react failed");
          }
          const reactComponent = (data.react_component || data.component_code || "").toString();

          layoutResults.push({
            presentation: presentationId,
            layout_id: slide.id,
            layout_name: slide.name,
            layout_code: reactComponent,
            fonts,
          });
        }

        await fetch("/api/v1/ppt/template-management/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: presentationId,
            name: layout.title,
            description: "Imported from PPTist React",
          }),
        });

        const saveRes = await fetch("/api/v1/ppt/template-management/save-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layouts: layoutResults, fonts }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok || !saveData?.success) {
          throw new Error(saveData?.detail || "Failed to save templates");
        }

        opts?.onSuccess?.({ presentationId, savedCount: layoutResults.length });
        router.push(`/template-preview/custom-${presentationId}`);
      } catch (err: any) {
        setError(err?.message || "Export failed");
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [slidesState, router]
  );

  return { isExporting, error, exportToPresenton };
};
