"use client";

import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useEditor } from "../context/EditorContext";
import { Plus, Copy, Trash2 } from "lucide-react";

export const SlidesThumbnailPanel: React.FC = () => {
  const {
    presentation,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    moveSlide,
  } = useEditor();

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    moveSlide(result.source.index, result.destination.index);
  };

  return (
    <div className="pptx-slides-panel">
      <button
        className="pptx-btn pptx-btn-primary w-full mb-3 flex items-center justify-center gap-2"
        onClick={() => addSlide()}
      >
        <Plus size={16} />
        New Slide
      </button>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="slides">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {presentation.slides.map((slide, index) => (
                <Draggable key={slide.id} draggableId={slide.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`pptx-slide-thumbnail group ${
                        index === currentSlideIndex ? "active" : ""
                      } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                      onClick={() => setCurrentSlide(index)}
                    >
                      <div className="pptx-slide-number">{index + 1}</div>

                      {/* Slide Preview - Simple background for now */}
                      <div
                        className="w-full h-full"
                        style={{
                          background:
                            slide.background.type === "solid"
                              ? slide.background.color
                              : "#FFFFFF",
                        }}
                      >
                        {/* TODO: Render miniature preview of slide elements */}
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          {slide.elements.length} element{slide.elements.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                        <button
                          className="w-6 h-6 bg-white rounded shadow hover:bg-gray-100 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(index);
                          }}
                          title="Duplicate"
                        >
                          <Copy size={12} />
                        </button>
                        {presentation.slides.length > 1 && (
                          <button
                            className="w-6 h-6 bg-white rounded shadow hover:bg-red-50 flex items-center justify-center text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this slide?")) {
                                deleteSlide(index);
                              }
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
