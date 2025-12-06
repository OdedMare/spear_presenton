"use client";

import React, { useEffect } from "react";
import FontManager from "./components/FontManager";
import Header from "../dashboard/components/Header";
import { useLayout } from "../context/LayoutContext";
import { useCustomLayout } from "./hooks/useCustomLayout";
import { useFontManagement } from "./hooks/useFontManagement";
import { useFileUpload } from "./hooks/useFileUpload";
import { useSlideProcessing } from "./hooks/useSlideProcessing";
import { useLayoutSaving } from "./hooks/useLayoutSaving";
import { useRouter } from "next/navigation";
import { FileUploadSection } from "./components/FileUploadSection";
import { SaveLayoutButton } from "./components/SaveLayoutButton";
import { SaveLayoutModal } from "./components/SaveLayoutModal";
import EachSlide from "./components/EachSlide/NewEachSlide";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";

const CustomTemplatePage = () => {
  const router = useRouter();
  const { refetch } = useLayout();

  // Password authentication state
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState("");
  const [authError, setAuthError] = React.useState(false);

  // Custom hooks for different concerns
  const { selectedFile, handleFileSelect, removeFile } = useFileUpload();
  const { slides, setSlides, completedSlides } = useCustomLayout();
  const { fontsData, UploadedFonts, uploadFont, removeFont, getAllUnsupportedFonts, setFontsData } = useFontManagement();
  const { isProcessingPptx, processFile, retrySlide, processSlideToHtml } = useSlideProcessing(
    selectedFile,
    slides,
    setSlides,
    setFontsData
  );
  const { isSavingLayout, isModalOpen, openSaveModal, closeSaveModal, saveLayout } = useLayoutSaving(
    slides,
    UploadedFonts,
    fontsData,
    refetch,
    setSlides
  );

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "oded2002" || passwordInput === "spear1") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleSaveTemplate = async (layoutName: string, description: string): Promise<string | null> => {
    trackEvent(MixpanelEvent.CustomTemplate_Save_Templates_API_Call);
    const id = await saveLayout(layoutName, description);
    if (id) {
      router.push(`/template-preview/custom-${id}`);
    }
    return id;
  };

  const handleProcessSlideToHtml = (slide: any) => {
    processSlideToHtml(slide,0)
  }

  // Handle slide updates
  const handleSlideUpdate = (index: number, updatedSlideData: any) => {
    setSlides((prevSlides) =>
      prevSlides.map((s, i) =>
        i === index
          ? {
              ...s,
              ...updatedSlideData,
              modified: true,
            }
          : s
      )
    );
  };
 useEffect(() => {
    const existingScript = document.querySelector(
      'script[src*="tailwindcss.com"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // NO MORE API KEY CHECKS - Deterministic pipeline doesn't need VLM!

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
        <Header />
        <main className="flex-1 container mx-auto px-4 max-w-md flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">יצירת תבנית מותאמת - מוגן בסיסמה</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                    authError
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                  placeholder="הכנס סיסמה"
                  autoFocus
                />
                {authError && <p className="text-red-500 text-sm mt-1">סיסמה שגויה</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                כניסה
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="max-w-[1440px] aspect-video mx-auto px-6">
        {/* Header */}
        <div className="text-center space-y-2 my-6">
          <h1 className="text-4xl font-bold text-gray-900">
            Custom Template Processor ⚡
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your PPTX file to extract slides and convert them to
            a template which you can use to generate AI presentations.
          </p>
          <div className="max-w-2xl mx-auto mt-2">
            <div className="inline-block rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              🚀 Deterministic pipeline: ~2 seconds per slide (no AI needed!)
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 shadow-sm">
              <span>✅ No screenshots</span>
              <span className="text-green-400">•</span>
              <span>✅ No VLM calls</span>
              <span className="text-green-400">•</span>
              <span>✅ 100% deterministic</span>
            </div>
          </div>
        </div>
       

        {/* File Upload Section */}
        <FileUploadSection
          selectedFile={selectedFile}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          processFile={processFile}
          isProcessingPptx={isProcessingPptx}
          slides={slides}
          completedSlides={completedSlides}
        />

        {/* Global Font Management */}
        {fontsData && (
          <FontManager
            fontsData={fontsData}
            UploadedFonts={UploadedFonts}
            uploadFont={uploadFont}
            removeFont={removeFont}
            getAllUnsupportedFonts={getAllUnsupportedFonts}
            processSlideToHtml={()=>handleProcessSlideToHtml(slides[0])}
          />
        )}

        {/* Slides Section */}
        {slides.length > 0 && (
          <div className="space-y-6 mt-10">
            {slides.map((slide, index) => (
              <EachSlide
                key={index}
                slide={slide}
                index={index}
                isProcessing={slides.some((s) => s.processing)}
                retrySlide={retrySlide}
                setSlides={setSlides}
                onSlideUpdate={(updatedSlideData) =>
                  handleSlideUpdate(index, updatedSlideData)
                }
              />
            ))}
          </div>
        )}

        {/* Floating Save Template Button */}
        {slides.length > 0 && slides.some((s) => s.processed) && (
          <SaveLayoutButton
            onSave={openSaveModal}
            isSaving={isSavingLayout}
            isProcessing={slides.some((s) => s.processing)}
          />
        )}

        {/* Save Template Modal */}
        <SaveLayoutModal
          isOpen={isModalOpen}
          onClose={closeSaveModal}
          onSave={handleSaveTemplate}
          isSaving={isSavingLayout}
        />
      </div>
    </div>
  );
};

export default CustomTemplatePage;
