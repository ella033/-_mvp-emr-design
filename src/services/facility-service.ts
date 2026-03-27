import { ApiClient } from "@/lib/api/api-client";
import { facilityApi } from "@/lib/api/api-routes";
import type { CreateFacilityRequest, Facility, UpdateFacilityRequest } from "@/types/facility-types";

export class FacilityService {
  static async getFacilities(queryString: string): Promise<Facility[]> {
    try {
      return await ApiClient.get<Facility[]>(facilityApi.list(queryString));
    } catch (error: any) {
      throw new Error("시설 목록 조회 실패", error.status);
    }
  }

  static async getFacility(id: number): Promise<Facility> {
    try {
      return await ApiClient.get<Facility>(facilityApi.detail(id));
    } catch (error: any) {
      throw new Error("시설 상세 조회 실패", error.status);
    }
  }

  static async createFacility(facility: CreateFacilityRequest): Promise<Facility> {
    try {
      return await ApiClient.post<Facility>(facilityApi.create(), facility);
    } catch (error: any) {
      throw new Error("시설 생성 실패", error.status);
    }
  }

  static async updateFacility(id: number, facility: UpdateFacilityRequest): Promise<Facility> {
    try {
      return await ApiClient.put<Facility>(facilityApi.update(id), facility);
    } catch (error: any) {
      throw new Error("시설 수정 실패", error.status);
    }
  }

  static async deleteFacility(id: number): Promise<void> {
    try {
      await ApiClient.delete(facilityApi.delete(id));
    } catch (error: any) {
      throw new Error("시설 삭제 실패", error.status);
    }
  }
}
