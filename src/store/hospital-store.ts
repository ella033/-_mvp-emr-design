// 병원 정보 전역 상태 관리

import type { Hospital } from "@/types/hospital-types";
import { create } from "zustand";
import { syncWithBroadcast } from "@/lib/broadcast-sync";

type HospitalState = {
  hospital: Hospital;
  setHospital: (hospital: Hospital) => void;
};

export const useHospitalStore = create<HospitalState>()(
  syncWithBroadcast("hospital-store", (set) => ({
    hospital: {} as Hospital, // 초기값
    setHospital: (hospital: Hospital) => set(() => ({ hospital: hospital })),
  }), {
    pick: ["hospital"],
  })
);
