import { ApiClient } from "@/lib/api/api-client";
import { hospitalsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  HolidayApplicationTypes,
  SyncHospitalHolidaysRequest,
} from "@/types/common/holiday-applications-types";
import type {
  CreateHospitalRequest,
  CreateHospitalResponse,
  DeleteHospitalResponse,
  CreateHospitalWithCredentialRequest,
  Hospital,
  UpdateHospitalRequest,
  UpdateHospitalResponse,
} from "@/types/hospital-types";
import type { components, operations } from "@/generated/api/types";

export class HospitalsService {
  static async getHospitals(): Promise<Hospital[]> {
    try {
      return await ApiClient.get<Hospital[]>(hospitalsApi.list);
    } catch (error: any) {
      throw new Error("병원 목록 조회 실패", error.status);
    }
  }

  static async getHospital(id: number): Promise<Hospital> {
    const validatedId = validateId(id, "Hospital ID");
    try {
      return await ApiClient.get<Hospital>(hospitalsApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("병원 조회 실패", error.status);
    }
  }

  static async createHospitalWithCredential(
    data: CreateHospitalWithCredentialRequest
  ): Promise<CreateHospitalResponse> {
    try {
      return await ApiClient.post<CreateHospitalResponse>(
        hospitalsApi.createWithCredential,
        data
      );
    } catch (error: any) {
      throw new Error("병원 생성 실패", error.status);
    }
  }

  static async createHospital(
    data: CreateHospitalRequest
  ): Promise<CreateHospitalResponse> {
    try {
      return await ApiClient.post<CreateHospitalResponse>(
        hospitalsApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("병원 생성 실패", error.status);
    }
  }

  static async updateHospital(
    id: number,
    data: UpdateHospitalRequest
  ): Promise<UpdateHospitalResponse> {
    const validatedId = validateId(id, "Hospital ID");
    try {
      return await ApiClient.put<UpdateHospitalResponse>(
        hospitalsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("병원 수정 실패", error.status);
    }
  }

  static async deleteHospital(id: number): Promise<DeleteHospitalResponse> {
    const validatedId = validateId(id, "Hospital ID");
    try {
      return await ApiClient.delete<DeleteHospitalResponse>(
        hospitalsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("병원 삭제 실패", error.status);
    }
  }

  static async syncHolidays(
    id: number,
    data: { holidays: SyncHospitalHolidaysRequest[] }
  ): Promise<HolidayApplicationTypes[]> {
    const validatedId = validateId(id, "Hospital ID");
    try {
      return await ApiClient.put<HolidayApplicationTypes[]>(
        hospitalsApi.syncHolidays(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("병원 휴무일 동기화 실패", error.status);
    }
  }

  static async syncOperatingHours(
    id: number,
    data: { operatingHours: any[] }
  ): Promise<any> {
    const validatedId = validateId(id, "Hospital ID");
    try {
      return await ApiClient.put<any>(
        hospitalsApi.syncOperatingHours(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("병원 운영시간 동기화 실패", error.status);
    }
  }

  static async updateInternalLabInfo(
    id: number,
    data: { specimenQualityGrades: any[] } | null
  ): Promise<any> {
    const validatedId = validateId(id, "Hospital ID");
    try {
      return await ApiClient.put<any>(
        hospitalsApi.updateInternalLabInfo(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("원내 검사실 정보 수정 실패", error.status);
    }
  }
}
