import { ApiClient } from "@/lib/api/api-client";
import { appointmentTypesApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  AppointmentTypes,
  CreateAppointmentTypeRequest,
  CreateAppointmentTypeResponse,
  UpdateAppointmentTypeRequest,
  UpdateAppointmentTypeResponse,
  DeleteAppointmentTypeResponse,
} from "@/types/appointments/appointment-types";

export class AppointmentTypesService {
  static async getAppointmentTypes(): Promise<AppointmentTypes[]> {
    try {
      return await ApiClient.get<AppointmentTypes[]>(appointmentTypesApi.list);
    } catch (error: any) {
      throw new Error("예약 유형 목록 조회 실패", error.status);
    }
  }

  static async getAppointmentType(id: number): Promise<AppointmentTypes> {
    const validatedId = validateId(id, "AppointmentType ID");
    try {
      return await ApiClient.get<AppointmentTypes>(appointmentTypesApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("예약 유형 조회 실패", error.status);
    }
  }

  static async createAppointmentType(data: CreateAppointmentTypeRequest): Promise<CreateAppointmentTypeResponse> {
    try {
      return await ApiClient.post<CreateAppointmentTypeResponse>(appointmentTypesApi.create, data);
    } catch (error: any) {
      throw new Error("예약 유형 생성 실패", error.status);
    }
  }

  static async updateAppointmentType(id: number, data: UpdateAppointmentTypeRequest): Promise<UpdateAppointmentTypeResponse> {
    const validatedId = validateId(id, "AppointmentType ID");
    try {
      return await ApiClient.put<UpdateAppointmentTypeResponse>(
        appointmentTypesApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("예약 유형 수정 실패", error.status);
    }
  }

  static async deleteAppointmentType(id: number): Promise<DeleteAppointmentTypeResponse> {
    const validatedId = validateId(id, "AppointmentType ID");
    try {
      return await ApiClient.delete<DeleteAppointmentTypeResponse>(
        appointmentTypesApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("예약 유형 삭제 실패", error.status);
    }
  }

  static async connectAppointmentTypeToRoom(id: number, roomId: number): Promise<any> {
    const validatedId = validateId(id, "AppointmentType ID");
    const validatedRoomId = validateId(roomId, "Room ID");
    try {
      return await ApiClient.post<any>(appointmentTypesApi.connect(validatedId.toString(), validatedRoomId.toString()), {});
    } catch (error: any) {
      throw new Error("예약 유형 예약실 연결 실패", error.status);
    }
  } 

  static async disconnectAppointmentTypeFromRoom(id: number, roomId: number): Promise<any> {
    const validatedId = validateId(id, "AppointmentType ID");
    const validatedRoomId = validateId(roomId, "Room ID");
    try {
      return await ApiClient.delete<any>(appointmentTypesApi.disconnect(validatedId.toString(), validatedRoomId.toString()));
    } catch (error: any) {
      throw new Error("예약 유형 예약실 연결 해제 실패", error.status);
    }
  }
}
