import { ApiClient } from "@/lib/api/api-client";
import { closingsApi } from "@/lib/api/routes/closings-api";
import type {
  DailyClosing,
  DailyClosingPatient,
} from "@/types/closings/closings-daily-types";

export const closingsService = {
  /**
   * 일일 마감 환자 목록 조회
   * @param date 조회할 날짜
   * @returns 일일 마감 환자 목록 (receptionTime, receiptTime은 UTC에서 KST로 변환됨)
   */
  getDailyClosings: async (date: string) => {
    const response = await ApiClient.get<DailyClosing>(closingsApi.daily(date));

    const convertedPatients = response.patients.map((patient: DailyClosingPatient) => ({
      ...patient,
    }));

    return {
      ...response,
      patients: convertedPatients,
    };
  }
}