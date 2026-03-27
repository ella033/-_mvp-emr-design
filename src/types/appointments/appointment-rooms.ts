import { AppointmentRoomOperatingHoursBase } from "./appointment-room-operating-hours";
export interface AppointmentRoomsBase {
  hospitalId: number;
  facilityId: number | null;
  userId: number | null;
  name: string;
  displayName: string;
  colorCode: string;
  defaultDurationMinutes: number;
  sortOrder: number;
  isVirtual: boolean;
  isActive: boolean;
  description: string;
  timeSlotDuration: number;
  maxAppointmentsPerSlot: number;
  bufferTimeMinutes: number;
  allowOverlap: boolean;
  operationStartDate: Date;
  operationEndDate: Date;
  operatingHours: AppointmentRoomOperatingHoursBase[];
  /** 외부 플랫폼 코드 배열 (예: ddocdoc, naver) */
  externalPlatformCodes?: string[];
}

export interface AppointmentRooms extends AppointmentRoomsBase {
  id: number;
}

export interface CreateAppointmentRoomRequest extends AppointmentRoomsBase { }
export interface CreateAppointmentRoomResponse {
  id: number;
}

export interface UpdateAppointmentRoomRequest extends Partial<AppointmentRoomsBase> { }
export interface UpdateAppointmentRoomResponse {
  id: number;
}

export interface DeleteAppointmentRoomRequest { }
export interface DeleteAppointmentRoomResponse {
  id: number;
}
