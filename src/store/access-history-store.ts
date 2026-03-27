import { create } from "zustand";
import moment from "moment";
import { CLEAR_VALUE } from "@/components/settings/personal-privacy/AccessHistoryFilter";

interface AccessHistoryState {
  startDate: string;
  endDate: string;
  userId: string;
  setFilter: (startDate: string, endDate: string, userId: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setUserId: (id: string) => void;
  reset: () => void;
}

export const useAccessHistoryStore = create<AccessHistoryState>((set) => ({
  startDate: moment().subtract(1, "month").format("YYYY-MM-DD"),
  endDate: moment().format("YYYY-MM-DD"),
  userId: CLEAR_VALUE,
  setFilter: (startDate, endDate, userId) => set({ startDate, endDate, userId }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  setUserId: (userId) => set({ userId }),
  reset: () =>
    set({
      startDate: moment().subtract(1, "month").format("YYYY-MM-DD"),
      endDate: moment().format("YYYY-MM-DD"),
      userId: CLEAR_VALUE,
    }),
}));
