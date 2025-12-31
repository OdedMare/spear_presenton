"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { OverlayLoader } from "@/components/ui/overlay-loader";
import Wrapper from "@/components/Wrapper";
import OutlineContent from "./OutlineContent";
import EmptyStateView from "./EmptyStateView";
import GenerateButton from "./GenerateButton";
import { Radio, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { TABS, Template } from "../types/index";
import { useOutlineStreaming } from "../hooks/useOutlineStreaming";
import { useOutlinePolling } from "../hooks/useOutlinePolling";
import { useOutlineManagement } from "../hooks/useOutlineManagement";
import { usePresentationGeneration } from "../hooks/usePresentationGeneration";
import TemplateSelection from "./TemplateSelection";

// Generation method type
type GenerationMethod = "stream" | "polling";

const OutlinePage: React.FC = () => {
  const { presentation_id, outlines } = useSelector(
    (state: RootState) => state.presentationGeneration
  );

  const [activeTab, setActiveTab] = useState<string>(TABS.OUTLINE);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Get saved method from localStorage or default to "polling"
  const [generationMethod, setGenerationMethod] = useState<GenerationMethod>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("outlineGenerationMethod");
      return (saved as GenerationMethod) || "polling";
    }
    return "polling";
  });

  // Save method preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("outlineGenerationMethod", generationMethod);
    }
  }, [generationMethod]);

  // Custom hooks - use both but only one will be active based on method
  const streamState = useOutlineStreaming(generationMethod === "stream" ? presentation_id : null);
  const pollingState = useOutlinePolling(generationMethod === "polling" ? presentation_id : null);

  // Select active state based on method
  const activeState = generationMethod === "stream" ? streamState : pollingState;

  const { handleDragEnd, handleAddSlide } = useOutlineManagement(outlines);
  const { loadingState, handleSubmit } = usePresentationGeneration(
    presentation_id,
    outlines,
    selectedTemplate,
    setActiveTab
  );

  if (!presentation_id) {
    return <EmptyStateView />;
  }


  return (
    <div className="h-[calc(100vh-72px)]">
      <OverlayLoader
        show={loadingState.isLoading}
        text={loadingState.message}
        showProgress={loadingState.showProgress}
        duration={loadingState.duration}
      />

      <Wrapper className="h-full flex flex-col w-full">
        <div className="flex-grow overflow-y-hidden w-[1200px] mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-[50%] mx-auto my-4 grid-cols-2">
              <TabsTrigger value={TABS.OUTLINE}>מתווה ותוכן</TabsTrigger>
              <TabsTrigger value={TABS.LAYOUTS}>בחר תבנית</TabsTrigger>
            </TabsList>

            <div className="flex-grow w-full mx-auto">
              <TabsContent value={TABS.OUTLINE} className="h-[calc(100vh-16rem)] overflow-y-auto custom_scrollbar"
              >
                <div>
                  {/* Method Selector - only show when not actively generating */}
                  {!activeState.isLoading && !activeState.isStreaming && outlines.length === 0 && (
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-500">שיטת יצירה:</span>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        <Button
                          variant={generationMethod === "stream" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setGenerationMethod("stream")}
                          className={`rounded-none ${generationMethod === "stream" ? "bg-blue-600 text-white" : ""}`}
                        >
                          <Zap className="h-4 w-4 ml-1" />
                          סטרימינג
                        </Button>
                        <Button
                          variant={generationMethod === "polling" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setGenerationMethod("polling")}
                          className={`rounded-none ${generationMethod === "polling" ? "bg-blue-600 text-white" : ""}`}
                        >
                          <Radio className="h-4 w-4 ml-1" />
                          רגיל
                        </Button>
                      </div>
                    </div>
                  )}
                  <OutlineContent
                    outlines={outlines}
                    isLoading={activeState.isLoading}
                    isStreaming={activeState.isStreaming}
                    activeSlideIndex={activeState.activeSlideIndex}
                    highestActiveIndex={activeState.highestActiveIndex}
                    statusMessage={activeState.statusMessage}
                    expectedSlides={6}
                    retryInfo={activeState.retryInfo}
                    onDragEnd={handleDragEnd}
                    onAddSlide={handleAddSlide}
                    onRetry={activeState.manualRetry}
                  />
                </div>
              </TabsContent>

              <TabsContent value={TABS.LAYOUTS} className="h-[calc(100vh-16rem)] overflow-y-auto custom_scrollbar">
                <div>
                  <TemplateSelection
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={setSelectedTemplate}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Fixed Button */}
        <div className="py-4 border-t border-gray-200">
          <div className="max-w-[1200px] mx-auto">
            <GenerateButton
              outlineCount={outlines.length}
              loadingState={loadingState}
              streamState={activeState}
              selectedTemplate={selectedTemplate}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </Wrapper>
    </div>
  );
};

export default OutlinePage;