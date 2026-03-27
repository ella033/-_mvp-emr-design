// 병원 정보 전역 상태 관리

import type { DoctorType } from "@/types/doctor-type";
import { create } from "zustand";

type DoctorsState = {
  doctors: DoctorType[];
  setDoctors: (doctors: DoctorType[]) => void;
};

export const useDoctorsStore = create<DoctorsState>((set) => ({
  doctors: [] as DoctorType[],
  setDoctors: (doctors: DoctorType[]) => set(() => ({ doctors: doctors })),
}));
