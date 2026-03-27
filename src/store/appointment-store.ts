import { create } from "zustand";

// 환자 정보 전역 상태 관리

type AppointmentState = {
  appointments: any[] | undefined;
  setAppointments: (appointments: any[]) => void;
  selectedAppointmentId: number | null;
  setSelectedAppointmentId: (id: number | null) => void;
  copiedAppointment: any | null;
  setCopiedAppointment: (appointment: any | null) => void;
};

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: undefined, // 초기값
  setAppointments: (appointments) =>
    set(() => ({
      appointments: Array.isArray(appointments) ? appointments : undefined,
    })),
  selectedAppointmentId: null,
  setSelectedAppointmentId: (id) => set(() => ({ selectedAppointmentId: id })),
  copiedAppointment: null, // 복사된 예약
  setCopiedAppointment: (appointment) => set(() => ({ copiedAppointment: appointment })),
}));
