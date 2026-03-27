import { ApiClient } from "@/lib/api/api-client";
import { holidayMastersApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type { CreateHolidayMasterTypesRequest, DeleteHolidayMasterTypesResponse, HolidayMasterTypes, HolidayMasterTypesResponse, UpdateHolidayMasterTypesRequest } from "@/types/common/holiday-master-types";

export class HolidayMastersService {
  static async getHolidayMasters(): Promise<HolidayMasterTypesResponse[]> {
    try {
      const items =
        (await ApiClient.get<HolidayMasterTypesResponse[]>(holidayMastersApi.list)) ??
        [];

      // startMonthDay(예: "0101") 기준 오름차순 정렬
      // - 값이 없거나 파싱 불가하면 뒤로 보낸다.
      // - 동률인 경우 id로 안정 정렬한다.
      const getSortKey = (m: HolidayMasterTypesResponse): number => {
        const raw = (m.startMonthDay ?? "").toString().trim();
        if (!raw) return Number.POSITIVE_INFINITY;
        const digits = raw.replace(/\D/g, "");
        if (!digits) return Number.POSITIVE_INFINITY;
        const key = Number(digits.slice(0, 4));
        return Number.isNaN(key) ? Number.POSITIVE_INFINITY : key;
      };

      return [...items].sort((a, b) => {
        const diff = getSortKey(a) - getSortKey(b);
        if (diff !== 0) return diff;
        return a.id - b.id;
      });
    } catch (error: any) {
      throw new Error("공휴일 마스터 목록 조회 실패", error.status);
    }
  }

  static async getHolidayMaster(id: number): Promise<HolidayMasterTypesResponse> {
    const validatedId = validateId(id, "HolidayMaster ID");
    try {
      return await ApiClient.get<HolidayMasterTypesResponse>(holidayMastersApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("공휴일 마스터 조회 실패", error.status);
    }
  }

  static async createHolidayMaster(data: CreateHolidayMasterTypesRequest): Promise<HolidayMasterTypes> {
    try {
      return await ApiClient.post<HolidayMasterTypes>(holidayMastersApi.create, data);
    } catch (error: any) {
      throw new Error("공휴일 마스터 생성 실패", error.status);
    }
  }

  static async updateHolidayMaster(id: number, data: UpdateHolidayMasterTypesRequest): Promise<HolidayMasterTypes> {
    const validatedId = validateId(id, "HolidayMaster ID");
    try {
      return await ApiClient.put<HolidayMasterTypes>(
        holidayMastersApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("공휴일 마스터 수정 실패", error.status);
    }
  }

  static async deleteHolidayMaster(id: number): Promise<DeleteHolidayMasterTypesResponse> {
    const validatedId = validateId(id, "HolidayMaster ID");
    try {
      return await ApiClient.delete<DeleteHolidayMasterTypesResponse>(holidayMastersApi.delete(validatedId));
    } catch (error: any) {
      throw new Error("공휴일 마스터 삭제 실패", error.status);
    }
  }

  static async findInstancesByYear(year: string): Promise<any> {
    try {
      return await ApiClient.get<any>(
        holidayMastersApi.findInstancesByYear(year)
      );
    } catch (error: any) {
      throw new Error("연도별 공휴일 인스턴스 조회 실패", error.status);
    }
  }
}
