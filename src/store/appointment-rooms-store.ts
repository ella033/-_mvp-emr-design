// 예약실 정보 전역 상태 관리

import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";
import { create } from "zustand";

type AppointmentRoomsState = {
  appointmentRooms: AppointmentRooms[];
  setAppointmentRooms: (appointmentRooms: AppointmentRooms[]) => void;
};

export const useAppointmentRoomsStore = create<AppointmentRoomsState>((set) => ({
  appointmentRooms: [] as AppointmentRooms[],
  setAppointmentRooms: (appointmentRooms: AppointmentRooms[]) => set(() => ({ appointmentRooms: appointmentRooms })),
})); 