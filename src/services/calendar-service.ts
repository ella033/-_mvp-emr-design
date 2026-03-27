import { ApiClient } from "@/lib/api/api-client";
import { calendarApi } from "@/lib/api/api-routes";
import type { HospitalSchedule } from "@/types/calendar-types";

export class CalendarService {
  static async getHospitalSchedule(
    year?: string,
    month?: string
  ): Promise<HospitalSchedule> {
    try {
      const url = calendarApi.getHospitalSchedule(year, month);
      return await ApiClient.get<HospitalSchedule>(url);
    } catch (error: any) {
      throw new Error("병원 스케줄 조회 실패", error.status);
    }
  }
}
