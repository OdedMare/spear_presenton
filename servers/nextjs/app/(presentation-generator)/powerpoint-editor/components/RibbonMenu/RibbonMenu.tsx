"use client";

import React, { useState } from "react";
import { RibbonTab } from "../../types";
import { HomeTabEnhanced } from "./HomeTabEnhanced";
import { InsertTab } from "./InsertTab";
import { DesignTab } from "./DesignTab";
import { TransitionsTab } from "./TransitionsTab";
import { AnimationsTab } from "./AnimationsTab";

export const RibbonMenu: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");

  const tabs: { key: RibbonTab; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "insert", label: "Insert" },
    { key: "design", label: "Design" },
    { key: "transitions", label: "Transitions" },
    { key: "animations", label: "Animations" },
    { key: "slideshow", label: "Slide Show" },
    { key: "review", label: "Review" },
    { key: "view", label: "View" },
  ];

  return (
    <div className="pptx-ribbon">
      <div className="pptx-ribbon-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pptx-ribbon-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pptx-ribbon-content">
        {activeTab === "home" && <HomeTabEnhanced />}
        {activeTab === "insert" && <InsertTab />}
        {activeTab === "design" && <DesignTab />}
        {activeTab === "transitions" && <TransitionsTab />}
        {activeTab === "animations" && <AnimationsTab />}
      </div>
    </div>
  );
};
