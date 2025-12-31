"use client";
import React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OutlineItem } from "./OutlineItem";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";

// Progress Bar Component
const StreamingProgressBar: React.FC<{
    currentSlides: number;
    expectedSlides: number;
    statusMessage?: string;
    retryInfo?: {
        retryCount: number;
        maxRetries: number;
        isRetrying: boolean;
    };
    onRetry?: () => void;
}> = ({ currentSlides, expectedSlides, statusMessage, retryInfo, onRetry }) => {
    const progress = Math.min((currentSlides / expectedSlides) * 100, 100);

    return (
        <div className="mb-6 p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                        מייצר שקפים...
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    {currentSlides} / {expectedSlides} שקפים
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Status Message */}
            {statusMessage && (
                <p className="mt-2 text-xs text-gray-500 text-center">{statusMessage}</p>
            )}

            {/* Retry Info */}
            {retryInfo && retryInfo.isRetrying && (
                <div className="mt-2 flex items-center justify-center gap-2 text-amber-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="text-xs">
                        מנסה שוב ({retryInfo.retryCount}/{retryInfo.maxRetries})...
                    </span>
                </div>
            )}

            {/* Manual Retry Button (shown when max retries exceeded) */}
            {retryInfo && !retryInfo.isRetrying && retryInfo.retryCount >= retryInfo.maxRetries && onRetry && (
                <div className="mt-3 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">החיבור נכשל</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="text-blue-600 border-blue-200"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        נסה שוב מהשקף {currentSlides + 1}
                    </Button>
                </div>
            )}
        </div>
    );
};

interface OutlineContentProps {
    outlines: { content: string }[] | null;
    isLoading: boolean;
    isStreaming: boolean;
    activeSlideIndex: number | null;
    highestActiveIndex: number;
    statusMessage?: string;
    expectedSlides?: number;
    retryInfo?: {
        retryCount: number;
        maxRetries: number;
        isRetrying: boolean;
    };
    onDragEnd: (event: any) => void;
    onAddSlide: () => void;
    onRetry?: () => void;
}

const OutlineContent: React.FC<OutlineContentProps> = ({
    outlines,
    isLoading,
    isStreaming,
    activeSlideIndex,
    highestActiveIndex,
    statusMessage,
    expectedSlides = 6,
    retryInfo,
    onDragEnd,
    onAddSlide,
    onRetry
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const pathname = usePathname();

    const currentSlideCount = outlines?.length || 0;

    return (
        <div className="space-y-6 font-instrument_sans">
            {/* Progress Bar - shown during streaming when we have some slides */}
            {isStreaming && currentSlideCount > 0 && (
                <StreamingProgressBar
                    currentSlides={currentSlideCount}
                    expectedSlides={expectedSlides}
                    statusMessage={statusMessage}
                    retryInfo={retryInfo}
                    onRetry={onRetry}
                />
            )}

            {/* Initial loading state - before any slides arrive */}
            {isLoading && (!outlines || outlines.length === 0) && (
                <div className="flex flex-col items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 px-2 py-0.5 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        מייצר את תוכן המצגת שלך...
                    </span>
                    {statusMessage && (
                        <p className="text-sm text-gray-600 text-center">{statusMessage}</p>
                    )}
                </div>
            )}
            {/* <div className="flex items-center justify-between">
                <h5 className="text-lg font-medium">
                    Presentation Outline
                </h5>
                {isStreaming && (
                    <div className="flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Generating outlines...
                    </div>
                )}
            </div> */}
            {/* Skeleton loading state */}
            {isLoading && (
                <div className="space-y-4">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-white">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                                    </div>
                                </div>
                                <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Outlines content */}
            {outlines && outlines.length > 0 && (
                <div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        {isStreaming ? (

                            outlines.map((item, index) => (
                                <OutlineItem
                                    key={`slide-${index}`}
                                    index={index + 1}
                                    slideOutline={item}
                                    isStreaming={isStreaming}
                                    isActiveStreaming={activeSlideIndex === index}
                                    isStableStreaming={highestActiveIndex >= 0 && index < highestActiveIndex}
                                />
                            ))
                        ) :
                            <SortableContext
                                items={outlines?.map((item, index) => ({ id: `slide-${index}` })) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                {outlines?.map((item, index) => (
                                    <OutlineItem
                                        key={`slide-${index}`}
                                        index={index + 1}
                                        slideOutline={item}
                                        isStreaming={isStreaming}
                                        isActiveStreaming={false}
                                        isStableStreaming={false}
                                    />
                                ))}
                            </SortableContext>}
                    </DndContext>

                    <Button
                        variant="outline"
                        onClick={() => {
                            trackEvent(MixpanelEvent.Outline_Add_Slide_Button_Clicked, { pathname });
                            onAddSlide();
                        }}
                        disabled={isLoading || isStreaming}
                        className="w-full my-4 text-blue-600 border-blue-200"
                    >
                        + הוסף שקף
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!isStreaming && !isLoading && outlines && outlines.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">אין מתווים זמינים</p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            trackEvent(MixpanelEvent.Outline_Add_Slide_Button_Clicked, { pathname });
                            onAddSlide();
                        }}
                        className="text-blue-600 border-blue-200"
                    >
                        + הוסף שקף ראשון
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OutlineContent; 