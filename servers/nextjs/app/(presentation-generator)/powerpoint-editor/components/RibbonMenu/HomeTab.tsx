"use client";

import React, { useState } from "react";
import { useEditor } from "../../context/EditorContext";
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Square,
  Circle,
  ArrowRight,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export const HomeTab: React.FC = () => {
  const {
    addElement,
    copy,
    cut,
    paste,
    deleteElement,
    selectedElementIds,
    bringToFront,
    sendToBack,
    alignLeft,
    alignCenter,
    alignRight,
  } = useEditor();

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(18);

  const addTextBox = () => {
    addElement({
      id: crypto.randomUUID(),
      type: "text",
      bbox: { x: 100, y: 100, width: 400, height: 100 },
      z: 0,
      rotation: 0,
      opacity: 1,
      content: [
        {
          text: "Click to edit text",
          style: {
            fontFamily: "Arial",
            fontSize: 24,
            fontWeight: 400,
            fontStyle: "normal",
            color: "#000000",
          },
        },
      ],
      paragraphStyle: {
        align: "left",
        lineHeight: 1.2,
        spaceBefore: 0,
        spaceAfter: 0,
        indent: 0,
      },
      verticalAlign: "top",
      textDirection: "horizontal",
      autofit: "none",
      padding: 8,
    });
  };

  const addShape = (shapeType: "rectangle" | "ellipse") => {
    addElement({
      id: crypto.randomUUID(),
      type: "shape",
      shapeType,
      bbox: { x: 200, y: 200, width: 200, height: 200 },
      z: 0,
      rotation: 0,
      opacity: 1,
      fill: { type: "solid", value: "#0078d4" },
      border: { width: 2, color: "#003f7f", style: "solid" },
    });
  };

  return (
    <>
      {/* Clipboard Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col items-center">
          <button className="pptx-btn pptx-btn-icon" onClick={paste} title="Paste (Ctrl+V)">
            <Clipboard size={20} />
          </button>
          <span className="text-xs">Paste</span>
        </div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content">
          <button className="pptx-btn pptx-btn-icon" onClick={cut} title="Cut (Ctrl+X)">
            <Scissors size={16} />
          </button>
          <button className="pptx-btn pptx-btn-icon" onClick={copy} title="Copy (Ctrl+C)">
            <Copy size={16} />
          </button>
          <button
            className="pptx-btn pptx-btn-icon"
            onClick={() => selectedElementIds.forEach(deleteElement)}
            disabled={selectedElementIds.length === 0}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Clipboard</div>
      </div>

      {/* Slides Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-1">
          <button className="pptx-btn pptx-btn-icon" onClick={addTextBox}>
            <Type size={16} />
          </button>
          <span className="text-xs">New Slide</span>
        </div>
        <div className="pptx-ribbon-group-label">Slides</div>
      </div>

      {/* Font Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex gap-2">
            <select
              className="pptx-property-input text-xs"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
            <select
              className="pptx-property-input text-xs w-16"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            <button className="pptx-btn pptx-btn-icon" title="Bold (Ctrl+B)">
              <Bold size={16} />
            </button>
            <button className="pptx-btn pptx-btn-icon" title="Italic (Ctrl+I)">
              <Italic size={16} />
            </button>
            <button className="pptx-btn pptx-btn-icon" title="Underline (Ctrl+U)">
              <Underline size={16} />
            </button>
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Font</div>
      </div>

      {/* Paragraph Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex gap-1">
            <button className="pptx-btn pptx-btn-icon" title="Bullets">
              <List size={16} />
            </button>
            <button className="pptx-btn pptx-btn-icon" title="Numbering">
              <ListOrdered size={16} />
            </button>
          </div>
          <div className="flex gap-1">
            <button className="pptx-btn pptx-btn-icon" onClick={alignLeft} title="Align Left">
              <AlignLeft size={16} />
            </button>
            <button className="pptx-btn pptx-btn-icon" onClick={alignCenter} title="Align Center">
              <AlignCenter size={16} />
            </button>
            <button className="pptx-btn pptx-btn-icon" onClick={alignRight} title="Align Right">
              <AlignRight size={16} />
            </button>
            <button className="pptx-btn pptx-btn-icon" title="Justify">
              <AlignJustify size={16} />
            </button>
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Paragraph</div>
      </div>

      {/* Drawing Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content gap-1">
          <button className="pptx-btn pptx-btn-icon" onClick={addTextBox} title="Text Box">
            <Type size={16} />
          </button>
          <button
            className="pptx-btn pptx-btn-icon"
            onClick={() => addShape("rectangle")}
            title="Rectangle"
          >
            <Square size={16} />
          </button>
          <button
            className="pptx-btn pptx-btn-icon"
            onClick={() => addShape("ellipse")}
            title="Circle"
          >
            <Circle size={16} />
          </button>
          <button className="pptx-btn pptx-btn-icon" title="Arrow">
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Drawing</div>
      </div>

      {/* Arrange Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-1">
          <button
            className="pptx-btn pptx-btn-icon"
            onClick={() => selectedElementIds[0] && bringToFront(selectedElementIds[0])}
            disabled={selectedElementIds.length === 0}
            title="Bring to Front"
          >
            <ArrowUp size={16} />
          </button>
          <button
            className="pptx-btn pptx-btn-icon"
            onClick={() => selectedElementIds[0] && sendToBack(selectedElementIds[0])}
            disabled={selectedElementIds.length === 0}
            title="Send to Back"
          >
            <ArrowDown size={16} />
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Arrange</div>
      </div>
    </>
  );
};
