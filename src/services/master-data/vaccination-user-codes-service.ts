import { ApiClient } from "@/lib/api/api-client";
import { vaccinationUserCodesApi } from "@/lib/api/api-routes";
import { createServiceError } from "@/lib/error-utils";
import { validateId } from "@/lib/validation";

export class VaccinationUserCodesService {
  static async searchVaccinationUserCodes(keyword: string): Promise<any> {
    try {
      return await ApiClient.get<any>(vaccinationUserCodesApi.list(keyword));
    } catch (error: any) {
      throw new Error("접종 라이브러리 조회 실패", error.status);
    }
  }

  static async getVaccinationUserCodesDetail(id: number): Promise<any> {
    try {
      return await ApiClient.get<any>(vaccinationUserCodesApi.detail(id));
    } catch (error: any) {
      throw new Error("접종 라이브러리 상세 조회 실패", error.status);
    }
  }

  static async upsertVaccinationUserCodes(data: any): Promise<any> {
    try {
      // 수정 모드인 경우 existingId를 URL에 추가
      const existingId = data.userCodeId?.toString();
      return await ApiClient.post<any>(
        vaccinationUserCodesApi.upsert(existingId),
        data
      );
    } catch (error: any) {
      throw createServiceError(
        error,
        "VaccinationUserCodeService.upsertVaccinationUserCodes"
      );
    }
  }

  static async toggleVaccinationUserCodes(
    id: number,
    isActive: boolean
  ): Promise<any> {
    return await ApiClient.patch<any>(
      vaccinationUserCodesApi.toggleActive(id, isActive)
    );
  }

  static async deleteVaccinationUserCodes(id: string): Promise<any> {
    const validatedId = validateId(id, "vaccinationUserCodesId");
    try {
      return await ApiClient.delete<any>(
        vaccinationUserCodesApi.delete(validatedId)
      );
    } catch (error: any) {
      throw createServiceError(
        error,
        "VaccinationUserCodeService.deleteVaccinationUserCodes"
      );
    }
  }
}
