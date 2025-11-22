import { create } from "zustand";

export interface ScreenState {
  screening: boolean;
}

interface ScreenActions {
  setScreening: (screening: boolean) => void;
}

export const useScreenStore = create<ScreenState & ScreenActions>((set) => ({
  screening: false,
  setScreening: (screening) => set({ screening }),
}));

