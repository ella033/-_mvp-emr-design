import { ApiClient } from "@/lib/api/api-client";
import { internalLabApi } from "@/lib/api/api-routes";

export interface InternalQualityGrade {
  id: string;
  applyDate: string;
  qualityGrade: number;
  isPathologyCertified: boolean;
  isNuclearMedicineCertified: boolean;
  pathologyAddOnRate?: number;
  nuclearMedicineAddOnRate?: number;
}

export class InternalLabService {
  static async getGrades(): Promise<InternalQualityGrade[]> {
    try {
      return await ApiClient.get<InternalQualityGrade[]>(internalLabApi.getGrades);
    } catch (error: any) {
      throw new Error("원내 질가산등급 목록 조회 실패", error.status);
    }
  }

  static async createGrade(data: {
    qualityGrade: number;
    isPathologyCertified: boolean;
    isNuclearMedicineCertified: boolean;
    applyDate: string;
  }): Promise<InternalQualityGrade> {
    try {
      return await ApiClient.post<InternalQualityGrade>(
        internalLabApi.createGrade,
        data
      );
    } catch (error: any) {
      throw new Error("원내 질가산등급 등록 실패", error.status);
    }
  }

  static async updateGrade(
    id: string,
    data: {
      qualityGrade: number;
      isPathologyCertified: boolean;
      isNuclearMedicineCertified: boolean;
    }
  ): Promise<InternalQualityGrade> {
    try {
      return await ApiClient.patch<InternalQualityGrade>(
        internalLabApi.updateGrade(id),
        data
      );
    } catch (error: any) {
      throw new Error("원내 질가산등급 수정 실패", error.status);
    }
  }

  static async deleteGrade(id: string): Promise<any> {
    try {
      return await ApiClient.delete<any>(internalLabApi.deleteGrade(id));
    } catch (error: any) {
      throw new Error("원내 질가산등급 삭제 실패", error.status);
    }
  }
}

