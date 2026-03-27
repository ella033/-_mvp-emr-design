import type { Benefit } from "@/types/benefits-types";
import { create } from "zustand";

type BenefitsState = {
  benefits: Benefit[];
  setBenefits: (benefits: Benefit[]) => void;
};

export const useBenefitsStore = create<BenefitsState>((set) => ({
  benefits: [],
  setBenefits: (benefits) => set({ benefits }),
}));
