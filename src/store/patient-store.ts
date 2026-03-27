import type { Patient } from "@/types/patient-types";
import { create } from "zustand";
import { syncWithBroadcast } from "@/lib/broadcast-sync";

// 환자 정보 전역 상태 관리

type PatientState = {
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  selectedPatientId: number | null;
  setSelectedPatientId: (patientId: number | null) => void;
};

export const usePatientStore = create<PatientState>(
  syncWithBroadcast("patient-store", (set) => ({
    patients: [], // 초기값
    setPatients: (patients) => set(() => ({ patients: patients })),
    selectedPatientId: null,
    setSelectedPatientId: (patientId) =>
      set(() => ({ selectedPatientId: patientId })),
  }))
);
