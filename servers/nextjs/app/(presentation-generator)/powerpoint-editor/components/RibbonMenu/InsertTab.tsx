"use client";

import React from "react";
import { useEditor } from "../../context/EditorContext";
import { Image, Table, BarChart3, Video, Music, Link as LinkIcon } from "lucide-react";

export const InsertTab: React.FC = () => {
  const { addElement } = useEditor();

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          addElement({
            id: crypto.randomUUID(),
            type: "image",
            bbox: { x: 100, y: 100, width: 400, height: 300 },
            z: 0,
            rotation: 0,
            opacity: 1,
            src: event.target?.result as string,
            objectFit: "contain",
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addTable = () => {
    addElement({
      id: crypto.randomUUID(),
      type: "table",
      bbox: { x: 100, y: 100, width: 600, height: 300 },
      z: 0,
      rotation: 0,
      opacity: 1,
      rows: 3,
      cols: 3,
      cells: Array(3)
        .fill(null)
        .map(() =>
          Array(3)
            .fill(null)
            .map(() => ({
              content: [{ text: "Cell", style: { fontFamily: "Arial", fontSize: 14, fontWeight: 400, fontStyle: "normal", color: "#000000" } }],
              style: {
                fill: { type: "solid", value: "#FFFFFF" },
                border: { width: 1, color: "#000000", style: "solid" },
                padding: 8,
                verticalAlign: "middle" as const,
              },
              colspan: 1,
              rowspan: 1,
            }))
        ),
      defaultCellStyle: {
        fill: { type: "solid", value: "#FFFFFF" },
        border: { width: 1, color: "#000000", style: "solid" },
        padding: 8,
        verticalAlign: "middle",
      },
      headerRow: true,
      totalRow: false,
      bandedRows: false,
      bandedCols: false,
    });
  };

  return (
    <>
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col items-center">
          <button className="pptx-btn pptx-btn-large" onClick={handleImageUpload}>
            <Image size={24} />
            <span>Images</span>
          </button>
        </div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col items-center">
          <button className="pptx-btn pptx-btn-large" onClick={addTable}>
            <Table size={24} />
            <span>Table</span>
          </button>
        </div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col items-center">
          <button className="pptx-btn pptx-btn-large">
            <BarChart3 size={24} />
            <span>Chart</span>
          </button>
        </div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content gap-2">
          <button className="pptx-btn">
            <Video size={16} />
            Video
          </button>
          <button className="pptx-btn">
            <Music size={16} />
            Audio
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Media</div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content">
          <button className="pptx-btn">
            <LinkIcon size={16} />
            Link
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Links</div>
      </div>
    </>
  );
};
