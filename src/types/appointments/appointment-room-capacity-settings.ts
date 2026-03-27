export interface AppointmentRoomCapacitySettingsBase {
  appointmentRoomId: number;
  timeSlotDuration: number;
  maxAppointmentsPerSlot: number;
  bufferTimeMinutes: number;
  allowOverlap: boolean;
  effectiveDate: Date;
  isActive: boolean;
}

export interface AppointmentRoomCapacitySettings extends AppointmentRoomCapacitySettingsBase {
  id: number;
}

export interface CreateAppointmentRoomCapacitySettingRequest extends AppointmentRoomCapacitySettingsBase { }
export interface CreateAppointmentRoomCapacitySettingResponse {
  id: number;
}

export interface UpdateAppointmentRoomCapacitySettingRequest extends Partial<AppointmentRoomCapacitySettingsBase> { }
export interface UpdateAppointmentRoomCapacitySettingResponse {
  id: number;
}

export interface DeleteAppointmentRoomCapacitySettingRequest { }
export interface DeleteAppointmentRoomCapacitySettingResponse {
  id: number;
}