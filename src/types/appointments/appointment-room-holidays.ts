export interface AppointmentRoomHolidaysBase {
  appointmentRoomId: number;
  holidayDate: Date;
  reason: string;
  isHalfDay: boolean;
  //TODO : ENUM
  halfDayPeriod: number;
  isActive: boolean;
}

export interface AppointmentRoomHolidays extends AppointmentRoomHolidaysBase {
  id: number;
}

export interface CreateAppointmentRoomHolidayRequest extends AppointmentRoomHolidaysBase { }
export interface CreateAppointmentRoomHolidayResponse {
  id: number;
}

export interface UpdateAppointmentRoomHolidayRequest extends Partial<AppointmentRoomHolidays> { }
export interface UpdateAppointmentRoomHolidayResponse {
  id: number;
}

export interface DeleteAppointmentRoomHolidayRequest { }
export interface DeleteAppointmentRoomHolidayResponse {
  id: number;
}