"use client";

import React from "react";
import { Play, Plus } from "lucide-react";

export const AnimationsTab: React.FC = () => {
  const animations = ["Appear", "Fade", "Fly In", "Float In", "Split", "Wipe", "Zoom"];

  return (
    <>
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex gap-2">
          {animations.map((animation) => (
            <button
              key={animation}
              className="pptx-btn w-20 h-12 flex flex-col items-center justify-center text-xs"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-300 rounded mb-1" />
              {animation}
            </button>
          ))}
        </div>
        <div className="pptx-ribbon-group-label">Animation</div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content">
          <button className="pptx-btn">
            <Plus size={16} />
            Add Animation
          </button>
          <button className="pptx-btn">
            <Play size={16} />
            Preview
          </button>
        </div>
        <div className="pptx-ribbon-group-label">Advanced Animation</div>
      </div>
    </>
  );
};
