import { create } from "zustand";
import type { ExternalLabOrder } from "@/services/lab-orders-service";

type ExternalLabOrdersState = {
  selectedOrder: ExternalLabOrder | null;
  setSelectedOrder: (order: ExternalLabOrder | null) => void;
};

export const useExternalLabOrdersStore = create<ExternalLabOrdersState>(
  (set) => ({
    selectedOrder: null,
    setSelectedOrder: (order) => set(() => ({ selectedOrder: order })),
  })
);


