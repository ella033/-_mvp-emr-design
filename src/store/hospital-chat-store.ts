import { create } from "zustand";

interface HospitalChatState {
  isPanelOpen: boolean;
  selectedRoomId: number | null;
  setIsPanelOpen: (open: boolean) => void;
  setSelectedRoomId: (roomId: number | null) => void;
}

export const useHospitalChatStore = create<HospitalChatState>((set) => ({
  isPanelOpen: false,
  selectedRoomId: null,
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
}));
