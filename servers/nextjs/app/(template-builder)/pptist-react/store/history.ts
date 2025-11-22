import { create } from "zustand";
import type { Slide } from "../types/pptist";

interface Snapshot {
  index: number;
  slides: Slide[];
}

interface HistoryState {
  cursor: number;
  snapshots: Snapshot[];
}

interface HistoryActions {
  init: (initial: Snapshot) => void;
  addSnapshot: (snapshot: Snapshot) => void;
  undo: () => Snapshot | null;
  redo: () => Snapshot | null;
}

const SNAPSHOT_LIMIT = 20;

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  cursor: -1,
  snapshots: [],
  init: (initial) =>
    set(() => ({
      cursor: 0,
      snapshots: [initial],
    })),
  addSnapshot: (snapshot) =>
    set((state) => {
      const trimmed = state.snapshots.slice(0, state.cursor + 1);
      const next = [...trimmed, snapshot].slice(-SNAPSHOT_LIMIT);
      const cursor = next.length - 1;
      return { snapshots: next, cursor };
    }),
  undo: () => {
    const { cursor, snapshots } = get();
    if (cursor <= 0) return null;
    const nextCursor = cursor - 1;
    set({ cursor: nextCursor });
    return snapshots[nextCursor] || null;
  },
  redo: () => {
    const { cursor, snapshots } = get();
    if (cursor >= snapshots.length - 1) return null;
    const nextCursor = cursor + 1;
    set({ cursor: nextCursor });
    return snapshots[nextCursor] || null;
  },
}));
