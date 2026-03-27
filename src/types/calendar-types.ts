import type { BreakTime } from "./appointments/appointment-room-operating-hours";
import type { AppointmentPatient } from "./patient-types";

export interface Appointment {
  id: number;
  patientName: string;
  patient: AppointmentPatient;
  appointmentStartTime: Date;
  appointmentEndTime: Date;
  status: number;
  roomName: string;
  roomUserId: number;
  doctorName: string;
  appointmentTypeName: string;
  memo: string;
}
export interface Calendar {
  date: string;
  dayOfWeek: number;
  isHoliday: boolean;
}

export interface OperatingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeSlotDuration?: number;
  isActive: boolean;
  breakTimes: BreakTime[];
}

export interface Holiday {
  id: number;
  holidayName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface SlotClosure {
  id: number;
  closureDate: Date;
  startTime: string;
  endTime: string;
  closureType: number;
  reason: string;
}

export interface WeeklyScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeSlotDuration: number;
}

export interface WeeklyScheduleCurrent {
  effectiveFrom: string; // "YYYY-MM-DD"
  days: WeeklyScheduleDay[];
}

export interface WeeklyScheduleHistoryItem {
  effectiveFrom: string; // "YYYY-MM-DD"
  effectiveTo?: string;  // "YYYY-MM-DD" (없을 수도 있어 optional)
  days: WeeklyScheduleDay[];
}

export interface WeeklySchedule {
  current: WeeklyScheduleCurrent;
  history: WeeklyScheduleHistoryItem[];
}

export interface AppointmentRoom {
  id: number;
  code: number;
  name: string;
  userId?: number | null;
  weeklySchedule: WeeklySchedule;
  slotClosures: SlotClosure[];
  maxAppointmentsPerSlot: number;
  isActive: boolean;
  operationStartDate: Date;
  operationEndDate: Date;
}

export interface HospitalHolidayTypes {
  id: number;
  holidayName: string;
  startDate: Date;
  endDate: Date;
}

 interface HospitalBreakTimeItem {
  dayOfWeek: number;
  breakStart: string; // "HH:mm"
  breakEnd: string;   // "HH:mm"
  breakName: string;
  sortOrder: number;
}

 interface HospitalBreakTimesCurrent {
  effectiveFrom: string; // "YYYY-MM-DD"
  effectiveTo?: string;  // "YYYY-MM-DD" (없을 수도 있어 optional)
  breakTimes: HospitalBreakTimeItem[];
}

 interface HospitalBreakTimesHistoryItem {
  effectiveFrom: string; // "YYYY-MM-DD"
  effectiveTo?: string;  // "YYYY-MM-DD" (없을 수도 있어 optional)
  breakTimes: HospitalBreakTimeItem[];
}

export interface HospitalBreakTimes {
  current: HospitalBreakTimesCurrent;
  history: HospitalBreakTimesHistoryItem[];
}

export interface HospitalSchedule {
  hospitalId: number;
  year: number;
  month: number;
  rooms: AppointmentRoom[];
  calendar: Calendar[];
  hospitalHolidays: HospitalHolidayTypes[];
  hospitalBreakTimes: HospitalBreakTimes;

  hospitalOperatingHours: OperatingHours[];
}
