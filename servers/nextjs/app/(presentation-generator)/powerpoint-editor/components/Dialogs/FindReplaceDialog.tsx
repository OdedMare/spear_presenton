"use client";

import React, { useState } from "react";
import { X, Search, Replace, ChevronDown, ChevronUp } from "lucide-react";

interface FindReplaceDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "find" | "replace";
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  open,
  onClose,
  mode: initialMode,
}) => {
  const [mode, setMode] = useState<"find" | "replace">(initialMode);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  if (!open) return null;

  const handleFind = () => {
    // TODO: Implement find logic
    console.log("Finding:", searchText, { matchCase, matchWholeWord });
    setTotalMatches(5); // Mock
    setCurrentMatch(1); // Mock
  };

  const handleFindNext = () => {
    if (currentMatch < totalMatches) {
      setCurrentMatch(currentMatch + 1);
    }
  };

  const handleFindPrevious = () => {
    if (currentMatch > 1) {
      setCurrentMatch(currentMatch - 1);
    }
  };

  const handleReplace = () => {
    // TODO: Implement replace logic
    console.log("Replacing current match:", searchText, "with:", replaceText);
    handleFindNext();
  };

  const handleReplaceAll = () => {
    // TODO: Implement replace all logic
    console.log("Replacing all:", searchText, "with:", replaceText);
    setTotalMatches(0);
    setCurrentMatch(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-2xl w-[480px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">
              {mode === "find" ? "Find" : "Find and Replace"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-200 rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Find what:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFind();
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter search text..."
                autoFocus
              />
              <button
                onClick={handleFind}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={!searchText}
              >
                <Search size={16} />
                Find
              </button>
            </div>
            {totalMatches > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {currentMatch} of {totalMatches} matches
              </p>
            )}
          </div>

          {/* Replace Input (only in replace mode) */}
          {mode === "replace" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replace with:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter replacement text..."
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2 pt-2 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Match case</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matchWholeWord}
                onChange={(e) => setMatchWholeWord(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Match whole word only</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            {/* Navigation buttons */}
            <button
              onClick={handleFindPrevious}
              disabled={currentMatch <= 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Find Previous (Shift+F3)"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={handleFindNext}
              disabled={currentMatch >= totalMatches || totalMatches === 0}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Find Next (F3)"
            >
              <ChevronDown size={16} />
            </button>

            {/* Mode toggle */}
            <button
              onClick={() => setMode(mode === "find" ? "replace" : "find")}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm"
            >
              {mode === "find" ? "Replace" : "Find Only"}
            </button>
          </div>

          {/* Replace actions (only in replace mode) */}
          {mode === "replace" && (
            <div className="flex gap-2">
              <button
                onClick={handleReplace}
                disabled={currentMatch === 0 || !replaceText}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Replace size={14} />
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={totalMatches === 0 || !replaceText}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
