import type { Appointment } from "./appointments";

export interface AppointmentHistoryItem {
  id: number;
  appointmentId: number;
  action: string;
  description: string;
  createdAt: Date;
  createdBy: string;
}

export interface AppointmentWithHistory extends Appointment {
  appointmentHistory: AppointmentHistoryItem[];
}
