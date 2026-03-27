
export interface BreakTime {
  id: number;
  operatingHoursId: number;
  breakStart: string;
  breakEnd: string;
  breakName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AppointmentRoomOperatingHoursBase {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakTimes: BreakTime[];
  timeSlotDuration: number;
  isActive: boolean;
}

export interface AppointmentRoomOperatingHours extends AppointmentRoomOperatingHoursBase {
  id: number;
  appointmentRoomId: number;
}

export interface CreateAppointmentRoomOperatingHourRequest extends AppointmentRoomOperatingHoursBase { }
export interface CreateAppointmentRoomOperatingHourResponse {
  id: number;
}

export interface UpdateAppointmentRoomOperatingHourRequest extends Partial<AppointmentRoomOperatingHours> { }
export interface UpdateAppointmentRoomOperatingHourResponse {
  id: number;
}

export interface DeleteAppointmentRoomOperatingHourRequest { }
export interface DeleteAppointmentRoomOperatingHourResponse {
  id: number;
}