"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { OverlayLoader } from "@/components/ui/overlay-loader";
import Wrapper from "@/components/Wrapper";
import OutlineContent from "./OutlineContent";
import EmptyStateView from "./EmptyStateView";
import GenerateButton from "./GenerateButton";

import { TABS, Template } from "../types/index";
import { useOutlineStreaming } from "../hooks/useOutlineStreaming";
import { useOutlinePolling } from "../hooks/useOutlinePolling";
import { useOutlineManagement } from "../hooks/useOutlineManagement";
import { usePresentationGeneration } from "../hooks/usePresentationGeneration";
import TemplateSelection from "./TemplateSelection";

const OutlinePage: React.FC = () => {
  const { presentation_id, outlines } = useSelector(
    (state: RootState) => state.presentationGeneration
  );

  // Get generation method from Redux (set in Settings page)
  const generationMethod = useSelector(
    (state: RootState) => state.userConfig.llm_config.GENERATION_METHOD
  ) || "jobs";

  const [activeTab, setActiveTab] = useState<string>(TABS.OUTLINE);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Custom hooks - use both but only one will be active based on method from settings
  const streamState = useOutlineStreaming(generationMethod === "stream" ? presentation_id : null);
  const pollingState = useOutlinePolling(generationMethod === "jobs" ? presentation_id : null);

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