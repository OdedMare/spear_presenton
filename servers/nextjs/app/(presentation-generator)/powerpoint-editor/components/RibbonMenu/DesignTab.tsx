"use client";

import React from "react";
import { Palette, Image as ImageIcon } from "lucide-react";

export const DesignTab: React.FC = () => {
  return (
    <>
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex gap-2">
          {["Blue", "Green", "Red", "Purple", "Orange"].map((theme) => (
            <button
              key={theme}
              className="w-16 h-12 rounded border-2 border-gray-300 hover:border-blue-500"
              style={{
                background: `linear-gradient(135deg, ${theme.toLowerCase()} 0%, ${theme.toLowerCase()}33 100%)`,
              }}
              title={`${theme} Theme`}
            />
          ))}
        </div>
        <div className="pptx-ribbon-group-label">Themes</div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content">
          <button className="pptx-btn">
            <Palette size={16} />
            Colors
          </button>
          <button className="pptx-btn">
            <ImageIcon size={16} />
            Background
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Customize</div>
      </div>
    </>
  );
};
