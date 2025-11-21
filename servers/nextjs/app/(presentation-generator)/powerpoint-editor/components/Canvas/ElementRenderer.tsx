"use client";

import React, { useRef, useEffect } from "react";
import { Group, Rect, Circle, Text, Image as KonvaImage, Transformer } from "react-konva";
import { useEditor } from "../../context/EditorContext";
import { SlideElement } from "../../types";
import useImage from "use-image";

interface ElementRendererProps {
  element: SlideElement;
  zoom: number;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ element, zoom }) => {
  const { selectedElementIds, selectElement, updateElement } = useEditor();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const isSelected = selectedElementIds.includes(element.id);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleSelect = (e: any) => {
    e.cancelBubble = true;
    selectElement(element.id, e.evt.shiftKey);
  };

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      bbox: {
        ...element.bbox,
        x: e.target.x(),
        y: e.target.y(),
      },
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateElement(element.id, {
      bbox: {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      },
      rotation: node.rotation(),
    });
  };

  // Render based on element type
  const renderElement = () => {
    switch (element.type) {
      case "text":
        return (
          <Group
            ref={shapeRef}
            x={element.bbox.x}
            y={element.bbox.y}
            width={element.bbox.width}
            height={element.bbox.height}
            rotation={element.rotation}
            opacity={element.opacity}
            draggable
            onClick={handleSelect}
            onTap={handleSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <Rect
              width={element.bbox.width}
              height={element.bbox.height}
              fill={element.background?.value || "transparent"}
              stroke={element.border?.color}
              strokeWidth={element.border?.width}
            />
            <Text
              text={element.content.map((c) => c.text).join("")}
              fontSize={element.content[0]?.style.fontSize || 18}
              fontFamily={element.content[0]?.style.fontFamily || "Arial"}
              fill={element.content[0]?.style.color || "#000000"}
              width={element.bbox.width}
              height={element.bbox.height}
              padding={element.padding}
              align={element.paragraphStyle.align}
              verticalAlign={element.verticalAlign}
            />
          </Group>
        );

      case "shape":
        const ShapeComponent = element.shapeType === "ellipse" ? Circle : Rect;
        const shapeProps =
          element.shapeType === "ellipse"
            ? {
                x: element.bbox.x + element.bbox.width / 2,
                y: element.bbox.y + element.bbox.height / 2,
                radiusX: element.bbox.width / 2,
                radiusY: element.bbox.height / 2,
              }
            : {
                x: element.bbox.x,
                y: element.bbox.y,
                width: element.bbox.width,
                height: element.bbox.height,
                cornerRadius: element.cornerRadius || 0,
              };

        return (
          <ShapeComponent
            ref={shapeRef}
            {...shapeProps}
            fill={element.fill?.value || "#0078d4"}
            stroke={element.border?.color}
            strokeWidth={element.border?.width}
            rotation={element.rotation}
            opacity={element.opacity}
            draggable
            onClick={handleSelect}
            onTap={handleSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );

      case "image":
        return <ImageElement element={element} />;

      case "table":
        return (
          <Group
            ref={shapeRef}
            x={element.bbox.x}
            y={element.bbox.y}
            width={element.bbox.width}
            height={element.bbox.height}
            rotation={element.rotation}
            opacity={element.opacity}
            draggable
            onClick={handleSelect}
            onTap={handleSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <Rect
              width={element.bbox.width}
              height={element.bbox.height}
              fill="white"
              stroke="black"
              strokeWidth={1}
            />
            <Text
              text={`Table ${element.rows}x${element.cols}`}
              fontSize={14}
              width={element.bbox.width}
              height={element.bbox.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderElement()}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          resizeEnabled={true}
          keepRatio={false}
          borderStroke="#0078d4"
          borderStrokeWidth={2 / zoom}
          anchorSize={8 / zoom}
          anchorStroke="#0078d4"
          anchorFill="white"
          anchorStrokeWidth={2 / zoom}
        />
      )}
    </>
  );
};

// Separate component for images to handle loading
const ImageElement: React.FC<{ element: any }> = ({ element }) => {
  const [image] = useImage(element.src);
  const { selectElement, updateElement, selectedElementIds } = useEditor();
  const imageRef = useRef<any>(null);
  const isSelected = selectedElementIds.includes(element.id);

  return (
    <KonvaImage
      ref={imageRef}
      image={image}
      x={element.bbox.x}
      y={element.bbox.y}
      width={element.bbox.width}
      height={element.bbox.height}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        selectElement(element.id, e.evt.shiftKey);
      }}
      onDragEnd={(e) => {
        updateElement(element.id, {
          bbox: {
            ...element.bbox,
            x: e.target.x(),
            y: e.target.y(),
          },
        });
      }}
    />
  );
};
