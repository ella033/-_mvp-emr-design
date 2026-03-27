import { create } from "zustand";

interface RcDockRef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  current: any;
}

interface RcDockState {
  activeRcDockRef: RcDockRef | null;
  setActiveRcDockRef: (ref: RcDockRef | null) => void;
  clearActiveRcDockRef: () => void;
}

export const useRcDockStore = create<RcDockState>((set) => ({
  activeRcDockRef: null,
  setActiveRcDockRef: (ref) => set({ activeRcDockRef: ref }),
  clearActiveRcDockRef: () => set({ activeRcDockRef: null }),
}));
