import { ApiClient } from "@/lib/api/api-client";
import { appointmentRoomsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type { AppointmentRoomHolidays } from "@/types/appointments/appointment-room-holidays";
import type { CreateAppointmentRoomRequest, UpdateAppointmentRoomRequest } from "@/types/appointments/appointment-rooms";

export class AppointmentRoomsService {
  static async getAppointmentRooms(): Promise<any[]> {
    try {
      return await ApiClient.get<any[]>(appointmentRoomsApi.list);
    } catch (error: any) {
      throw new Error("예약실 목록 조회 실패", error.status);
    }
  }

  static async getAppointmentRoom(id: number): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    try {
      return await ApiClient.get<any>(appointmentRoomsApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("예약실 조회 실패", error.status);
    }
  }

  static async createAppointmentRoom(data: CreateAppointmentRoomRequest): Promise<any> {
    try {
      return await ApiClient.post<any>(appointmentRoomsApi.create, data);
    } catch (error: any) {
      throw new Error("예약실 생성 실패", error.status);
    }
  }

  static async updateAppointmentRoom(id: number, data: UpdateAppointmentRoomRequest): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    try {
      console.log('[updateAppointmentRoom] data:', data);
      return await ApiClient.put<any>(
        appointmentRoomsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("예약실 수정 실패", error.status);
    }
  }


  static async deleteAppointmentRoom(id: number): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    try {
      return await ApiClient.delete<any>(
        appointmentRoomsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw error;
    }
  }


  static async createHoliday(id: number, data: AppointmentRoomHolidays): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    try {
      return await ApiClient.post<any>(
        appointmentRoomsApi.createHoliday(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("예약실 휴무일 생성 실패", error.status);
    }
  }

  static async updateHoliday(
    id: number,
    holidayId: number,
    data: AppointmentRoomHolidays
  ): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    const validatedHolidayId = validateId(holidayId, "Holiday ID");
    try {
      return await ApiClient.put<any>(
        appointmentRoomsApi.updateHoliday(validatedId, validatedHolidayId),
        data
      );
    } catch (error: any) {
      throw new Error("예약실 휴무일 수정 실패", error.status);
    }
  }

  static async deleteHoliday(id: number, holidayId: number): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    const validatedHolidayId = validateId(holidayId, "Holiday ID");
    try {
      return await ApiClient.delete<any>(
        appointmentRoomsApi.deleteHoliday(validatedId, validatedHolidayId)
      );
    } catch (error: any) {
      throw new Error("예약실 휴무일 삭제 실패", error.status);
    }
  }

  static async syncOpertingHoursMultiple(data: any): Promise<any> {
    try {
      return await ApiClient.put<any>(appointmentRoomsApi.syncOpertingHoursMultiple, data);
    } catch (error: any) {
      throw new Error("예약실 운영시간 동기화 실패", error.status);
    }
  }

  static async findAvailableSlots(
    id: number,
    date: string,
    doctorId?: number
  ): Promise<any> {
    const validatedId = validateId(id, "AppointmentRoom ID");
    try {
      const url = appointmentRoomsApi.findAvailableSlots(
        validatedId,
        date,
        doctorId?.toString()
      );
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("예약 가능 시간 조회 실패", error.status);
    }
  }
}
