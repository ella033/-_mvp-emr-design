import { ApiClient } from "@/lib/api/api-client";
import { holidayApplicationsApi } from "@/lib/api/routes/holiday-applications-api";
import type {
  HolidayApplicationTypes,
  CheckHolidayConflictsHoliday,
  SyncHospitalHolidaysRequest,
} from "@/types/common/holiday-applications-types";
import { HolidayRecurrenceType } from "@/constants/common/common-enum";

export interface HolidayApplicationsListQuery {
  startDate: string;
  endDate: string;
  /**
   * 활성화된 휴무일만 조회할지 여부
   * - 기본값: true
   */
  isActive?: boolean;
}

export class HolidayApplicationsService {
  /**
   * HolidayApplicationTypes -> SyncHospitalHolidaysRequest 변환
   * - holidayMasterId가 있으면 startDate/endDate는 보내지 않음
   * - holidayMasterId가 없고 recurrenceType=0(없음)인 경우 startDate/endDate를 포함(있을 때만)
   * - 정기휴무(예: recurrenceType=3)인 경우 startDate/endDate는 보내지 않음
   */
  static toSyncHospitalHolidaysRequest(
    holiday: HolidayApplicationTypes
  ): SyncHospitalHolidaysRequest {
    const recurrenceType = holiday.recurrenceType ?? HolidayRecurrenceType.없음;

    // 공휴일(마스터)
    if (holiday.holidayMasterId !== null) {
      return {
        holidayMasterId: holiday.holidayMasterId,
        holidayName: holiday.holidayName,
        isActive: holiday.isActive,
      };
    }

    // 커스텀(임시) 휴무일: holidayMasterId=null && recurrenceType=0 && 날짜가 있는 케이스
    if (recurrenceType === HolidayRecurrenceType.없음) {
      const startDate =
        typeof holiday.startDate === "string"
          ? holiday.startDate
          : holiday.startDate?.toISOString?.() ?? null;
      const endDate =
        typeof holiday.endDate === "string"
          ? holiday.endDate
          : holiday.endDate?.toISOString?.() ?? null;

      return {
        holidayMasterId: null,
        startDate,
        endDate,
        holidayName: holiday.holidayName,
        isActive: holiday.isActive,
        recurrenceType,
      };
    }

    // 정기휴무일: recurrenceType!=0
    return {
      holidayMasterId: null,
      holidayName: holiday.holidayName,
      isActive: holiday.isActive,
      recurrenceType,
      recurrenceWeek: holiday.recurrenceWeek ?? null,
      recurrenceDayOfWeek: holiday.recurrenceDayOfWeek ?? null,
    };
  }

  static toSyncHospitalHolidaysRequests(
    holidays: HolidayApplicationTypes[]
  ): SyncHospitalHolidaysRequest[] {
    return (holidays ?? []).map((h) => this.toSyncHospitalHolidaysRequest(h));
  }

  /**
   * HolidayApplicationTypes -> check-holiday-conflicts용 holiday 아이템 변환
   * - id/hospitalId/appointmentRoomId 같은 내부 필드는 절대 포함하지 않는다.
   */
  static toCheckHolidayConflictsHoliday(
    holiday: HolidayApplicationTypes
  ): CheckHolidayConflictsHoliday {
    // 공휴일(마스터): 최소 필드만
    if (holiday.holidayMasterId !== null) {
      return {
        holidayMasterId: holiday.holidayMasterId,
        isActive: holiday.isActive,
      };
    }

    const recurrenceType = holiday.recurrenceType ?? HolidayRecurrenceType.없음;

    // 임시 휴무(날짜 범위)
    if (recurrenceType === HolidayRecurrenceType.없음) {
      const startDate =
        typeof holiday.startDate === "string"
          ? holiday.startDate
          : holiday.startDate?.toISOString?.() ?? null;
      const endDate =
        typeof holiday.endDate === "string"
          ? holiday.endDate
          : holiday.endDate?.toISOString?.() ?? null;

      return {
        holidayMasterId: null,
        startDate,
        endDate,
        holidayName: holiday.holidayName,
        isActive: holiday.isActive,
        recurrenceType,
      };
    }

    // 정기 휴무
    return {
      holidayMasterId: null,
      holidayName: holiday.holidayName,
      isActive: holiday.isActive,
      recurrenceType,
      recurrenceWeek: holiday.recurrenceWeek ?? null,
      recurrenceDayOfWeek: holiday.recurrenceDayOfWeek ?? null,
    };
  }

  static toCheckHolidayConflictsHolidays(
    holidays: HolidayApplicationTypes[]
  ): CheckHolidayConflictsHoliday[] {
    return (holidays ?? []).map((h) => this.toCheckHolidayConflictsHoliday(h));
  }

  static async getHolidayApplications(
    query: HolidayApplicationsListQuery
  ): Promise<HolidayApplicationTypes[]> {
    const { startDate, endDate, isActive = true } = query;

    if (!startDate || !endDate) {
      throw new Error("공휴일 조회에는 startDate와 endDate가 모두 필요합니다.");
    }

    try {
      return await ApiClient.get<HolidayApplicationTypes[]>(
        holidayApplicationsApi.list,
        { startDate, endDate}
      ).then((res) => res.filter((h) => h.isActive === isActive));
    } catch (error: any) {
      throw new Error("공휴일 신청 조회 실패", error.status);
    }
  }

  static async getHolidayApplication(id: number): Promise<HolidayApplicationTypes> {
    try {
      return await ApiClient.get<HolidayApplicationTypes>(holidayApplicationsApi.detail(id));
    } catch (error: any) {
      throw new Error("공휴일 신청 조회 실패", error.status);
    }
  }

  static async updateHolidayApplication(id: number, data: HolidayApplicationTypes): Promise<HolidayApplicationTypes> {
    try {
      return await ApiClient.patch<HolidayApplicationTypes>(holidayApplicationsApi.update(id), data);
    } catch (error: any) {
      throw new Error("공휴일 신청 수정 실패", error.status);
    }
  }

  static async deleteHolidayApplication(id: number): Promise<void> {
    try {
      await ApiClient.delete(holidayApplicationsApi.delete(id));
    } catch (error: any) {
      throw new Error("공휴일 신청 삭제 실패", error.status);
    }
  }

}