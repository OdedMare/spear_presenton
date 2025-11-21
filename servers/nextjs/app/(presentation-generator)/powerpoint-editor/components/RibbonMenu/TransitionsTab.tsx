"use client";

import React from "react";
import { Clock } from "lucide-react";

export const TransitionsTab: React.FC = () => {
  const transitions = ["None", "Fade", "Push", "Wipe", "Split", "Reveal", "Random"];

  return (
    <>
      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex gap-2">
          {transitions.map((transition) => (
            <button
              key={transition}
              className="pptx-btn w-20 h-12 flex flex-col items-center justify-center text-xs"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-300 rounded mb-1" />
              {transition}
            </button>
          ))}
        </div>
        <div className="pptx-ribbon-group-label">Transition to This Slide</div>
      </div>

      <div className="pptx-ribbon-group">
        <div className="pptx-ribbon-group-content flex-col gap-2">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <select className="pptx-property-input text-xs">
              <option>0.5s</option>
              <option>1.0s</option>
              <option>2.0s</option>
              <option>3.0s</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" />
            On Mouse Click
          </label>
        </div>
        <div className="pptx-ribbon-group-label">Timing</div>
      </div>
    </>
  );
};
