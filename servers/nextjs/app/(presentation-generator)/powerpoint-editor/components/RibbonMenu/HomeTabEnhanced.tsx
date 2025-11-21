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
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Minus,
  Plus,
  Paintbrush,
} from "lucide-react";
import { FONT_FAMILIES, FONT_SIZES, LINE_SPACING_OPTIONS } from "../../utils/constants";

export const HomeTabEnhanced: React.FC = () => {
  const {
    addElement,
    copy,
    cut,
    paste,
    deleteElement,
    selectedElementIds,
    bringToFront,
    sendToBack,
    applyTextFormatting,
    applyParagraphFormatting,
    presentation,
    currentSlideIndex,
  } = useEditor();

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(18);
  const [fontColor, setFontColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [lineSpacing, setLineSpacing] = useState(1.0);

  // Get currently selected text element to show active formatting
  const selectedTextElement = React.useMemo(() => {
    if (selectedElementIds.length === 1) {
      const slide = presentation.slides[currentSlideIndex];
      const element = slide.elements.find((el) => el.id === selectedElementIds[0]);
      if (element && element.type === "text") {
        return element as any;
      }
    }
    return null;
  }, [selectedElementIds, presentation, currentSlideIndex]);

  // Update state when selection changes
  React.useEffect(() => {
    if (selectedTextElement) {
      const firstRun = selectedTextElement.content[0];
      if (firstRun) {
        setFontFamily(firstRun.style.fontFamily);
        setFontSize(firstRun.style.fontSize);
        setFontColor(firstRun.style.color);
        setIsBold(firstRun.style.fontWeight === 700 || firstRun.style.fontWeight === "bold");
        setIsItalic(firstRun.style.fontStyle === "italic");
        setIsUnderline(firstRun.style.underline || false);
      }
      if (selectedTextElement.paragraphStyle) {
        setTextAlign(selectedTextElement.paragraphStyle.align);
        setLineSpacing(selectedTextElement.paragraphStyle.lineHeight);
      }
    }
  }, [selectedTextElement]);

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
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontWeight: 400,
            fontStyle: "normal",
            color: fontColor,
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

  const handleFontChange = (newFont: string) => {
    setFontFamily(newFont);
    applyTextFormatting({ fontFamily: newFont });
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    applyTextFormatting({ fontSize: newSize });
  };

  const handleFontColorChange = (newColor: string) => {
    setFontColor(newColor);
    applyTextFormatting({ color: newColor });
  };

  const toggleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    applyTextFormatting({ bold: newBold });
  };

  const toggleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    applyTextFormatting({ italic: newItalic });
  };

  const toggleUnderline = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    applyTextFormatting({ underline: newUnderline });
  };

  const handleAlignChange = (align: "left" | "center" | "right" | "justify") => {
    setTextAlign(align);
    applyParagraphFormatting({ align });
  };

  const handleLineSpacingChange = (spacing: number) => {
    setLineSpacing(spacing);
    applyParagraphFormatting({ lineHeight: spacing });
  };

  const handleIndentChange = (change: number) => {
    if (selectedTextElement?.paragraphStyle) {
      const currentIndent = selectedTextElement.paragraphStyle.indent || 0;
      applyParagraphFormatting({ indent: Math.max(0, currentIndent + change) });
    }
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
          <span className="text-xs">Text Box</span>
        </div>
        <div className="pptx-ribbon-group-label">Insert</div>
      </div>

      {/* Font Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex gap-2">
            <select
              className="pptx-property-input text-xs"
              value={fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <select
              className="pptx-property-input text-xs w-16"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            <button
              className={`pptx-btn pptx-btn-icon ${isBold && selectedTextElement ? "bg-blue-100" : ""}`}
              onClick={toggleBold}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${isItalic && selectedTextElement ? "bg-blue-100" : ""}`}
              onClick={toggleItalic}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${isUnderline && selectedTextElement ? "bg-blue-100" : ""}`}
              onClick={toggleUnderline}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Underline (Ctrl+U)"
            >
              <Underline size={16} />
            </button>
            <div className="relative">
              <input
                type="color"
                value={fontColor}
                onChange={(e) => handleFontColorChange(e.target.value)}
                disabled={selectedElementIds.length === 0 || !selectedTextElement}
                className="w-8 h-8 cursor-pointer border border-gray-300 rounded"
                title="Font Color"
              />
            </div>
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Font</div>
      </div>

      {/* Paragraph Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex gap-1">
            <button
              className="pptx-btn pptx-btn-icon"
              title="Bullets"
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
            >
              <List size={16} />
            </button>
            <button
              className="pptx-btn pptx-btn-icon"
              title="Numbering"
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
            >
              <ListOrdered size={16} />
            </button>
            <div className="relative group">
              <button
                className="pptx-btn pptx-btn-icon flex items-center gap-1"
                title="Line Spacing"
                disabled={selectedElementIds.length === 0 || !selectedTextElement}
              >
                <span className="text-xs">{lineSpacing.toFixed(1)}</span>
                <ChevronDown size={12} />
              </button>
              {selectedTextElement && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-10 min-w-[120px]">
                  {LINE_SPACING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleLineSpacingChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              className={`pptx-btn pptx-btn-icon ${textAlign === "left" ? "bg-blue-100" : ""}`}
              onClick={() => handleAlignChange("left")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${textAlign === "center" ? "bg-blue-100" : ""}`}
              onClick={() => handleAlignChange("center")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${textAlign === "right" ? "bg-blue-100" : ""}`}
              onClick={() => handleAlignChange("right")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${textAlign === "justify" ? "bg-blue-100" : ""}`}
              onClick={() => handleAlignChange("justify")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Justify"
            >
              <AlignJustify size={16} />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              className="pptx-btn pptx-btn-icon"
              onClick={() => handleIndentChange(-10)}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Decrease Indent"
            >
              <Minus size={16} />
            </button>
            <button
              className="pptx-btn pptx-btn-icon"
              onClick={() => handleIndentChange(10)}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Increase Indent"
            >
              <Plus size={16} />
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

      {/* Format Painter */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col items-center">
          <button
            className="pptx-btn pptx-btn-icon"
            disabled={selectedElementIds.length === 0}
            title="Format Painter"
          >
            <Paintbrush size={20} />
          </button>
          <span className="text-xs">Format Painter</span>
        </div>
      </div>
    </>
  );
};
