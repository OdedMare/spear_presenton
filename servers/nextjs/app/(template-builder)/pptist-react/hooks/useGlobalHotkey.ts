"use client";

import { useEffect } from "react";
import { useKeyboardStore } from "../store/keyboard";

export const useGlobalHotkey = () => {
  const setCtrl = useKeyboardStore((s) => s.setCtrlKeyState);
  const setShift = useKeyboardStore((s) => s.setShiftKeyState);
  const setSpace = useKeyboardStore((s) => s.setSpaceKeyState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrl(true);
      if (e.key === "Shift") setShift(true);
      if (e.key === " ") setSpace(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrl(false);
      if (e.key === "Shift") setShift(false);
      if (e.key === " ") setSpace(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setCtrl, setShift, setSpace]);
};

