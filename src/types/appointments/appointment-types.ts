// 예약실 기본 정보 (Create/Update 시 사용)
export interface AppointmentRoomsBase {
  appointmentRoomId: number;
  isActive: boolean;
}

// 예약실 상세 정보 (Get 시 사용)
export interface AppointmentTypeRooms {
  id: number;
  name: string;
  displayName: string;
  appointmentRoomId: number;
  isActive: boolean;
}

// 예약 유형 기본 정보
export interface AppointmentTypesBase {
  name: string;
  colorCode: string;
  description: string;
  isActive: boolean;
}

// Create 시 사용: 기본 정보 + 예약실 기본 정보
export interface CreateAppointmentTypeRequest extends AppointmentTypesBase {
  appointmentRooms: AppointmentRoomsBase[];
}

export interface CreateAppointmentTypeResponse {
  id: number;
}

// Update 시 사용: ID + 기본 정보 + 예약실 기본 정보
export interface UpdateAppointmentTypeRequest extends AppointmentTypesBase {
  id: number;
  appointmentRooms: AppointmentRoomsBase[];
}

export interface UpdateAppointmentTypeResponse {
  id: number;
}

// Get 시 사용: 기본 정보 + ID + 예약실 상세 정보
export interface AppointmentTypes extends AppointmentTypesBase {
  id: number;
  hospitalId: number;
  appointmentTypeRooms: AppointmentTypeRooms[];
}

export interface DeleteAppointmentTypeRequest { }
export interface DeleteAppointmentTypeResponse {
  id: number;
}
