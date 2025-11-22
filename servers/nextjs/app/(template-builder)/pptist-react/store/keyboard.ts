import { create } from "zustand";

export interface KeyboardState {
  ctrlKeyState: boolean;
  shiftKeyState: boolean;
  spaceKeyState: boolean;
}

interface KeyboardActions {
  setCtrlKeyState: (active: boolean) => void;
  setShiftKeyState: (active: boolean) => void;
  setSpaceKeyState: (active: boolean) => void;
}

export const useKeyboardStore = create<KeyboardState & KeyboardActions>((set) => ({
  ctrlKeyState: false,
  shiftKeyState: false,
  spaceKeyState: false,
  setCtrlKeyState: (active) => set({ ctrlKeyState: active }),
  setShiftKeyState: (active) => set({ shiftKeyState: active }),
  setSpaceKeyState: (active) => set({ spaceKeyState: active }),
}));

