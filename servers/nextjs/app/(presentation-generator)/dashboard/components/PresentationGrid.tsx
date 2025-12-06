import React from "react";
import { PresentationCard } from "./PresentationCard";
import { PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { PresentationResponse } from "@/app/(presentation-generator)/services/api/dashboard";
import { Sparkles, Languages } from "lucide-react";

interface PresentationGridProps {
  presentations: PresentationResponse[];
  type: "slide" | "video";
  isLoading?: boolean;
  error?: string | null;
  onPresentationDeleted?: (presentationId: string) => void;
}

export const PresentationGrid = ({
  presentations,
  type,
  isLoading = false,
  error = null,
  onPresentationDeleted,
}: PresentationGridProps) => {
  const router = useRouter();
  const handleCreateNewPresentation = () => {
    if (type === "slide") {
      router.push("/upload");
    } else {
      router.push("/editor");
    }
  };

  const handleAIRewrite = () => {
    router.push("/content-rewrite");
  };

  const handleAITranslate = () => {
    router.push("/translate");
  };

  const ShimmerCard = () => (
    <div className="flex flex-col gap-4 min-h-[200px] bg-white/70 rounded-lg p-4 animate-pulse">
      <div className="w-full h-24 bg-gray-200 rounded-lg"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  const CreateNewCard = () => (
    <div
      onClick={handleCreateNewPresentation}
      className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-gray-400 hover:border-primary/60 bg-white/70 hover:bg-white/80 rounded-lg items-center justify-center transition-all duration-300"
    >
      <div className="rounded-full bg-gray-200 group-hover:bg-primary/10 p-4 transition-all duration-300">
        <PlusIcon className="w-8 h-8 text-gray-500 group-hover:text-primary transition-all duration-300" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-700 group-hover:text-gray-900 mb-1">
          {type === "slide" ? "יצירת מצגת חדשה" : "יצירת מצגת וידאו"}
        </h3>
        <p className="text-sm text-gray-500 group-hover:text-gray-600 px-4">
          התחל מאפס והפוך את הרעיונות שלך למציאות
        </p>
      </div>
    </div>
  );

  const AIRewriteCard = () => (
    <div
      onClick={handleAIRewrite}
      className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-purple-400 hover:border-purple-600 bg-gradient-to-br from-purple-50/70 to-blue-50/70 hover:from-purple-50/90 hover:to-blue-50/90 rounded-lg items-center justify-center transition-all duration-300"
    >
      <div className="rounded-full bg-purple-100 group-hover:bg-purple-200 p-4 transition-all duration-300">
        <Sparkles className="w-8 h-8 text-purple-600 group-hover:text-purple-700 transition-all duration-300" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-700 group-hover:text-gray-900 mb-1">
          שכתוב תוכן בעזרת בינה מלאכותית
        </h3>
        <p className="text-sm text-gray-500 group-hover:text-gray-600 px-4">
          שמור על עיצוב המצגת, שכתב את התוכן עם AI
        </p>
      </div>
    </div>
  );

  const AITranslateCard = () => (
    <div
      onClick={handleAITranslate}
      className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-blue-400 hover:border-blue-600 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 hover:from-blue-50/90 hover:to-indigo-50/90 rounded-lg items-center justify-center transition-all duration-300"
    >
      <div className="rounded-full bg-blue-100 group-hover:bg-blue-200 p-4 transition-all duration-300">
        <Languages className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-all duration-300" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-700 group-hover:text-gray-900 mb-1">
          תרגום תוכן עם AI
        </h3>
        <p className="text-sm text-gray-500 group-hover:text-gray-600 px-4">
          שמור על עיצוב המצגת, תרגם את התוכן עם AI
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-gray-400 bg-white/70 rounded-lg items-center justify-center animate-pulse">
          <div className="rounded-full bg-gray-200 p-4">
            <div className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-purple-400 bg-gradient-to-br from-purple-50/70 to-blue-50/70 rounded-lg items-center justify-center animate-pulse">
          <div className="rounded-full bg-purple-100 p-4">
            <div className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-blue-400 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-lg items-center justify-center animate-pulse">
          <div className="rounded-full bg-blue-100 p-4">
            <div className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
        {[...Array(1)].map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CreateNewCard />
        <AIRewriteCard />
        <AITranslateCard />
        <div className="flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:text-primary/80 underline"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <CreateNewCard />
      <AIRewriteCard />
      <AITranslateCard />
      {presentations &&
        presentations.length > 0 &&
        presentations.map((presentation) => (
          <PresentationCard
            key={presentation.id}
            id={presentation.id}
            title={presentation.title}
            created_at={presentation.created_at}
            slide={presentation.slides[0]}
            onDeleted={onPresentationDeleted}
          />
        ))}
    </div>
  );
};
