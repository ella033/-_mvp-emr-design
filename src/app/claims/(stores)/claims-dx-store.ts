"use client";

import { create } from "zustand";
import type { DiseaseWithTempId, OrderWithTempId } from "@/types/chart/chart";

type ClaimsDxState = {
  claim: any;
  claimDetails: any[];
  diseases: DiseaseWithTempId[];
  orders: OrderWithTempId[];
  claimDetail: Record<string, any> | null;
  isEditing: boolean;
  setClaim: (c: any) => void;
  setClaimDetails: (c: any[]) => void;
  setFromEncounter: (d: DiseaseWithTempId[], o: OrderWithTempId[]) => void;
  setClaimDetail: (c: Record<string, any> | null) => void;
  setIsEditing: (v: boolean) => void;
};

export const useClaimsDxStore = create<ClaimsDxState>((set) => ({
  claim: null,
  claimDetails: [],
  diseases: [],
  orders: [],
  claimDetail: null,
  isEditing: false,
  setClaim: (c: any) => set({ claim: c }),
  setClaimDetails: (c: any[]) => set({ claimDetails: c }),
  setFromEncounter: (d, o) => set({ diseases: d, orders: o }),
  setClaimDetail: (c) => set({ claimDetail: c }),
  setIsEditing: (v) => set({ isEditing: v }),
}));
