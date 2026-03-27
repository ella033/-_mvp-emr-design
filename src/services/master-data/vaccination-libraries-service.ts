import { ApiClient } from "@/lib/api/api-client";
import { vaccinationLibrariesApi } from "@/lib/api/api-routes";

export class VaccinationLibrariesService {
  static async searchVaccinationLibraries(keyword: string): Promise<any> {
    try {
      return await ApiClient.get<any>(vaccinationLibrariesApi.list(keyword));
    } catch (error: any) {
      throw new Error("접종 라이브러리 조회 실패", error.status);
    }
  }

  static async getPrescriptionLibraryDetail(id: number): Promise<any> {
    try {
      return await ApiClient.get<any>(vaccinationLibrariesApi.detail(id));
    } catch (error: any) {
      throw new Error("접종 라이브러리 상세 조회 실패", error.status);
    }
  }
}
