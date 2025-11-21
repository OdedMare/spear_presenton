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
  ChevronUp,
  Eraser,
  Sparkles,
  Highlighter,
  FlipHorizontal,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  FilePlus,
  Layout,
  Search,
  MousePointer2,
} from "lucide-react";
import { FONT_FAMILIES, FONT_SIZES, LINE_SPACING_OPTIONS } from "../../utils/constants";
import { SlideLayoutPicker } from "../Dialogs/SlideLayoutPicker";
import { FindReplaceDialog } from "../Dialogs/FindReplaceDialog";
import { ShapeLibrary } from "../Dialogs/ShapeLibrary";
import { useFormatPainter } from "../../hooks/useFormatPainter";
import { SlideElement } from "../../types";
import { getShapeById } from "../../configs/shapes";

export const HomeTabEnhanced: React.FC = () => {
  const {
    addElement,
    updateElement,
    addSlide,
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
  const [hasTextShadow, setHasTextShadow] = useState(false);
  const [highlightColor, setHighlightColor] = useState("transparent");
  const [hasBullets, setHasBullets] = useState(false);
  const [hasNumbering, setHasNumbering] = useState(false);
  const [textDirection, setTextDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [verticalAlign, setVerticalAlign] = useState<"top" | "middle" | "bottom">("top");
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showFindDialog, setShowFindDialog] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState<"find" | "replace">("find");
  const [showShapeLibrary, setShowShapeLibrary] = useState(false);

  // Format Painter hook
  const {
    isPainterActive,
    isPersistent,
    copyFormat,
    applyFormat,
    clearFormat: clearPainterFormat,
    togglePersistent,
  } = useFormatPainter();

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
      // Set text direction and vertical alignment from selected element
      setTextDirection(selectedTextElement.textDirection || "horizontal");
      setVerticalAlign(selectedTextElement.verticalAlign || "top");
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

  const increaseFontSize = () => {
    let currentIndex = -1;
    for (let i = 0; i < FONT_SIZES.length; i++) {
      if (FONT_SIZES[i] === fontSize) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex >= 0 && currentIndex < FONT_SIZES.length - 1) {
      const newSize = FONT_SIZES[currentIndex + 1];
      setFontSize(newSize);
      applyTextFormatting({ fontSize: newSize });
    }
  };

  const decreaseFontSize = () => {
    let currentIndex = -1;
    for (let i = 0; i < FONT_SIZES.length; i++) {
      if (FONT_SIZES[i] === fontSize) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex > 0) {
      const newSize = FONT_SIZES[currentIndex - 1];
      setFontSize(newSize);
      applyTextFormatting({ fontSize: newSize });
    }
  };

  const toggleTextShadow = () => {
    const newShadow = !hasTextShadow;
    setHasTextShadow(newShadow);
    // Apply text shadow through context - will need to update context to support this
    // For now, we'll use a CSS class or inline style
  };

  const handleHighlightChange = (newColor: string) => {
    setHighlightColor(newColor);
    // Apply highlight color through context - will need to update context
  };

  const clearFormatting = () => {
    // Reset all formatting to defaults
    setFontFamily("Arial");
    setFontSize(18);
    setFontColor("#000000");
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setTextAlign("left");
    setLineSpacing(1.2);
    setHasTextShadow(false);
    setHighlightColor("transparent");

    // Apply default formatting
    applyTextFormatting({
      fontFamily: "Arial",
      fontSize: 18,
      color: "#000000",
      bold: false,
      italic: false,
      underline: false,
    });
    applyParagraphFormatting({
      align: "left",
      lineHeight: 1.2,
      indent: 0,
    });
  };

  const toggleBullets = () => {
    const newBullets = !hasBullets;
    setHasBullets(newBullets);
    if (newBullets) {
      setHasNumbering(false);
      applyParagraphFormatting({ bulletStyle: "disc" });
    } else {
      applyParagraphFormatting({ bulletStyle: undefined });
    }
  };

  const toggleNumbering = () => {
    const newNumbering = !hasNumbering;
    setHasNumbering(newNumbering);
    if (newNumbering) {
      setHasBullets(false);
      applyParagraphFormatting({ numberStyle: "decimal" });
    } else {
      applyParagraphFormatting({ numberStyle: undefined });
    }
  };

  const toggleTextDirection = () => {
    const newDirection = textDirection === "horizontal" ? "vertical" : "horizontal";
    setTextDirection(newDirection);
    // Apply to selected text element
    if (selectedElementIds.length === 1 && selectedTextElement) {
      updateElement(selectedElementIds[0], { textDirection: newDirection });
    }
  };

  const handleVerticalAlignChange = (align: "top" | "middle" | "bottom") => {
    setVerticalAlign(align);
    // Apply to selected text element
    if (selectedElementIds.length === 1 && selectedTextElement) {
      updateElement(selectedElementIds[0], { verticalAlign: align });
    }
  };

  const handleLayoutSelect = (layoutId: string) => {
    // TODO: Apply the selected layout to the current slide
    // For now, we'll just add a new slide with that layout
    console.log("Selected layout:", layoutId);
    addSlide(currentSlideIndex + 1);
  };

  const handleShapeSelect = (shapeId: string) => {
    const shapeConfig = getShapeById(shapeId);
    if (!shapeConfig) return;

    // Create a custom shape element using SVG path
    addElement({
      id: crypto.randomUUID(),
      type: "shape",
      shapeType: "custom",
      bbox: { x: 200, y: 200, width: 200, height: 200 },
      z: 0,
      rotation: 0,
      opacity: 1,
      fill: { type: "solid", value: "#0078d4" },
      border: { width: 2, color: "#003f7f", style: "solid" },
      // Store SVG path data in a custom property
      svgPath: shapeConfig.path,
      viewBox: shapeConfig.viewBox || "0 0 100 100",
    } as any);
  };

  // Format Painter handlers
  const handleFormatPainterClick = () => {
    if (isPainterActive) {
      // If painter is active, clicking again clears it
      clearPainterFormat();
    } else if (selectedElementIds.length === 1) {
      // Copy format from selected element
      const slide = presentation.slides[currentSlideIndex];
      const element = slide.elements.find((el) => el.id === selectedElementIds[0]);
      if (element) {
        copyFormat(element as SlideElement);
      }
    }
  };

  const handleFormatPainterDoubleClick = () => {
    // Double-click enables persistent mode
    if (selectedElementIds.length === 1) {
      const slide = presentation.slides[currentSlideIndex];
      const element = slide.elements.find((el) => el.id === selectedElementIds[0]);
      if (element) {
        copyFormat(element as SlideElement);
        togglePersistent();
      }
    }
  };

  const handleElementClick = (elementId: string) => {
    // When format painter is active and user clicks an element, apply formatting
    if (isPainterActive) {
      const formatting = applyFormat();
      if (formatting && elementId) {
        const slide = presentation.slides[currentSlideIndex];
        const targetElement = slide.elements.find((el) => el.id === elementId);

        if (targetElement && formatting.type === targetElement.type) {
          if (formatting.type === "text" && formatting.textStyle && formatting.paragraphStyle) {
            // Apply text formatting
            applyTextFormatting({
              fontFamily: formatting.textStyle.fontFamily,
              fontSize: formatting.textStyle.fontSize,
              color: formatting.textStyle.color,
              bold: formatting.textStyle.fontWeight === 700 || formatting.textStyle.fontWeight === "bold",
              italic: formatting.textStyle.fontStyle === "italic",
              underline: formatting.textStyle.underline,
            });
            applyParagraphFormatting({
              align: formatting.paragraphStyle.align,
              lineHeight: formatting.paragraphStyle.lineHeight,
              indent: formatting.paragraphStyle.indent,
            });
          } else if (formatting.type === "shape" && formatting.shapeStyle) {
            // Apply shape formatting
            updateElement(elementId, {
              fill: formatting.shapeStyle.fill,
              border: formatting.shapeStyle.border,
              shadow: formatting.shapeStyle.shadow,
              opacity: formatting.shapeStyle.opacity,
            });
          }
        }
      }
    }
  };

  return (
    <>
      <SlideLayoutPicker
        open={showLayoutPicker}
        onClose={() => setShowLayoutPicker(false)}
        onSelectLayout={handleLayoutSelect}
      />
      <FindReplaceDialog
        open={showFindDialog}
        onClose={() => setShowFindDialog(false)}
        mode={findReplaceMode}
      />
      <ShapeLibrary
        open={showShapeLibrary}
        onClose={() => setShowShapeLibrary(false)}
        onSelectShape={handleShapeSelect}
      />
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
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <button
            className="pptx-btn flex items-center gap-2 w-full"
            onClick={() => addSlide(currentSlideIndex + 1)}
            title="New Slide"
          >
            <FilePlus size={16} />
            <span className="text-sm">New Slide</span>
          </button>
          <button
            className="pptx-btn flex items-center gap-2 w-full"
            onClick={() => setShowLayoutPicker(!showLayoutPicker)}
            title="Slide Layout"
          >
            <Layout size={16} />
            <span className="text-sm">Layout</span>
          </button>
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
              onChange={(e) => handleFontChange(e.target.value)}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-0.5">
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
              <div className="flex flex-col">
                <button
                  className="pptx-btn pptx-btn-icon p-0 h-3 w-5 flex items-center justify-center"
                  onClick={increaseFontSize}
                  disabled={selectedElementIds.length === 0 || !selectedTextElement}
                  title="Increase Font Size (Ctrl+])"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  className="pptx-btn pptx-btn-icon p-0 h-3 w-5 flex items-center justify-center"
                  onClick={decreaseFontSize}
                  disabled={selectedElementIds.length === 0 || !selectedTextElement}
                  title="Decrease Font Size (Ctrl+[)"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            </div>
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
            <button
              className={`pptx-btn pptx-btn-icon ${hasTextShadow && selectedTextElement ? "bg-blue-100" : ""}`}
              onClick={toggleTextShadow}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Text Shadow"
            >
              <Sparkles size={16} />
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
            <div className="relative">
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => handleHighlightChange(e.target.value)}
                disabled={selectedElementIds.length === 0 || !selectedTextElement}
                className="w-8 h-8 cursor-pointer border border-gray-300 rounded"
                title="Text Highlight Color"
              />
            </div>
            <button
              className="pptx-btn pptx-btn-icon"
              onClick={clearFormatting}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Clear All Formatting"
            >
              <Eraser size={16} />
            </button>
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Font</div>
      </div>

      {/* Paragraph Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex gap-1">
            <button
              className={`pptx-btn pptx-btn-icon ${hasBullets && selectedTextElement ? "bg-blue-100" : ""}`}
              onClick={toggleBullets}
              title="Bullets"
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
            >
              <List size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${hasNumbering && selectedTextElement ? "bg-blue-100" : ""}`}
              onClick={toggleNumbering}
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
          <div className="flex gap-1">
            <button
              className={`pptx-btn pptx-btn-icon ${textDirection === "vertical" ? "bg-blue-100" : ""}`}
              onClick={toggleTextDirection}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Text Direction"
            >
              <FlipHorizontal size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${verticalAlign === "top" ? "bg-blue-100" : ""}`}
              onClick={() => handleVerticalAlignChange("top")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Align Top"
            >
              <AlignVerticalJustifyStart size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${verticalAlign === "middle" ? "bg-blue-100" : ""}`}
              onClick={() => handleVerticalAlignChange("middle")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Align Middle"
            >
              <AlignVerticalJustifyCenter size={16} />
            </button>
            <button
              className={`pptx-btn pptx-btn-icon ${verticalAlign === "bottom" ? "bg-blue-100" : ""}`}
              onClick={() => handleVerticalAlignChange("bottom")}
              disabled={selectedElementIds.length === 0 || !selectedTextElement}
              title="Align Bottom"
            >
              <AlignVerticalJustifyEnd size={16} />
            </button>
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Paragraph</div>
      </div>

      {/* Drawing Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex gap-1">
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
          <button
            className="pptx-btn flex items-center gap-2 w-full"
            onClick={() => setShowShapeLibrary(true)}
            title="More Shapes"
          >
            <Square size={16} />
            <span className="text-sm">Shapes</span>
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
            className={`pptx-btn pptx-btn-icon ${isPainterActive ? "bg-blue-100" : ""} ${isPersistent ? "ring-2 ring-blue-500" : ""}`}
            onClick={handleFormatPainterClick}
            onDoubleClick={handleFormatPainterDoubleClick}
            disabled={selectedElementIds.length === 0}
            title={isPainterActive ? "Format Painter (Active - Click to Cancel)" : "Format Painter (Click to copy format, Double-click for persistent)"}
          >
            <Paintbrush size={20} />
          </button>
          <span className="text-xs">Format Painter</span>
        </div>
      </div>

      {/* Editing Group */}
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <button
            className="pptx-btn flex items-center gap-2 w-full"
            onClick={() => {
              setFindReplaceMode("find");
              setShowFindDialog(true);
            }}
            title="Find (Ctrl+F)"
          >
            <Search size={16} />
            <span className="text-sm">Find</span>
          </button>
          <button
            className="pptx-btn flex items-center gap-2 w-full"
            onClick={() => {
              setFindReplaceMode("replace");
              setShowFindDialog(true);
            }}
            title="Replace (Ctrl+H)"
          >
            <Search size={16} />
            <span className="text-sm">Replace</span>
          </button>
          <div className="relative group">
            <button
              className="pptx-btn flex items-center gap-2 w-full"
              title="Select"
            >
              <MousePointer2 size={16} />
              <span className="text-sm">Select</span>
              <ChevronDown size={12} />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-10 min-w-[160px]">
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                onClick={() => {
                  // Select all elements on current slide
                  const slide = presentation.slides[currentSlideIndex];
                  slide.elements.forEach((el) => {
                    if (!selectedElementIds.includes(el.id)) {
                      // TODO: Add multi-select support in EditorContext
                      console.log("Select all:", el.id);
                    }
                  });
                }}
              >
                Select All (Ctrl+A)
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                onClick={() => {
                  // TODO: Implement select objects mode
                  console.log("Select Objects");
                }}
              >
                Select Objects
              </button>
            </div>
          </div>
        </div>
        <div className="pptx-ribbon-group-label">Editing</div>
      </div>
    </>
  );
};
