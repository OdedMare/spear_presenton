import React from "react";
import { Type, Square, Image } from "lucide-react";
import { SlideElement } from "../types";

interface ToolbarProps {
  onAddElement: (type: SlideElement["type"]) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddElement }) => {
  const tools = [
    {
      type: "text" as const,
      icon: Type,
      label: "Text Box",
      description: "Add editable text",
    },
    {
      type: "shape" as const,
      icon: Square,
      label: "Shape",
      description: "Add rectangle/circle",
    },
    {
      type: "image" as const,
      icon: Image,
      label: "Image",
      description: "Add image placeholder",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 mb-4">Add Elements</h3>

      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onAddElement(tool.type)}
          className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <tool.icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 group-hover:text-blue-600">
              {tool.label}
            </div>
            <div className="text-xs text-gray-500">{tool.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
