import type {
  AppointmentStatus,
  DayOfWeek,
  HolidayRecurrenceType,
  HolidayRecurrenceWeek,
} from "@/constants/common/common-enum";
import type { HolidayMasterTypes } from "./holiday-master-types";

export interface HolidayApplicationBase {
  hospitalId: number;
  appointmentRoomId: number | null;
  holidayMasterId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  holidayName: string;
  isActive: boolean;
  recurrenceType?: HolidayRecurrenceType;
  recurrenceDayOfWeek?: DayOfWeek;
  recurrenceWeek?: HolidayRecurrenceWeek;
}

export interface HolidayApplicationTypes extends HolidayApplicationBase {
  id: number;
  holidayMaster: HolidayMasterTypes;
  periods : HolidayPeriodTypes[];
}
  export interface HolidayPeriodTypes {
    from: string;
    to: string;
  }
export interface CreateHolidayApplicationsTypesRequest extends HolidayApplicationBase {
  createdDateTime: Date;
  createdId: number;
}
export interface CreateHolidayApplicationsTypesResponse extends HolidayApplicationBase {
  id: number;
}
export interface UpdateHolidayApplicationsTypesRequest extends Partial<HolidayApplicationTypes> {
}
export interface UpdateHolidayApplicationsTypesResponse extends HolidayApplicationTypes { }
export interface DeleteHolidayApplicationsTypesRequest {
  id: number;
}
export interface SyncHospitalHolidaysRequest {
  holidayMasterId: number | null;
  startDate?: string | null;
  endDate?: string | null;
  holidayName: string;
  isActive: boolean;
  recurrenceType?: HolidayRecurrenceType | null;
  recurrenceDayOfWeek?: DayOfWeek | null;
  recurrenceWeek?: HolidayRecurrenceWeek | null;
}

/**
 * check-holiday-conflicts 요청에서 사용하는 holidays 아이템 타입
 *
 * - 공휴일(holidayMasterId 존재): { holidayMasterId, isActive }
 * - 정기/임시(holidayMasterId 없음): SyncHospitalHolidaysRequest 기반 + isRecurring
 *
 * (주의) HolidayApplicationTypes 같은 "내부/화면 상태" 타입을 그대로 보내지 않도록
 * 요청 전용 타입을 분리한다.
 */
export type CheckHolidayConflictsHoliday =
  | {
      holidayMasterId: number;
      isActive: boolean;
    }
  | (Omit<SyncHospitalHolidaysRequest, "holidayMasterId"> & {
      holidayMasterId?: null;
    });

export interface CheckHolidayConflictsRequest {
  hospitalId: number;
  appointmentRoomId?: number | null;
  holidays: CheckHolidayConflictsHoliday[];
}
export interface CheckHolidayConflictsResponse {
  hasConflicts: boolean;
  appointments: CheckHolidayConflictsAppointment[];
  conflictCount: number;
}

export interface CheckHolidayConflictsAppointment {
  id: number;
  appointmentStartTime: string;
  appointmentEndTime?: string | null;
  status: AppointmentStatus;

  patientName?: string | null;
  appointmentTypeName?: string | null;
  appointmentRoomName?: string | null;
  memo?: string | null;
  phoneNumber?: string | null;
}