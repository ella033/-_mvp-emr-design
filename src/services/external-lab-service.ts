import { ApiClient } from "@/lib/api/api-client";
import { externalLabApi } from "@/lib/api/api-routes";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";

export class ExternalLabService {
  static async getLabs(
    params?: Record<string, string>
  ): Promise<ExternalLab[]> {
    try {
      return await ApiClient.get<ExternalLab[]>(externalLabApi.getLabs, params);
    } catch (error: any) {
      throw new Error("수탁기관 목록 조회 실패", error.status);
    }
  }

  static async updateLabMapping(data: {
    externalLabId: string;
    isEnabled: boolean;
  }): Promise<any> {
    try {
      return await ApiClient.post<any>(externalLabApi.updateLabMapping, data);
    } catch (error: any) {
      throw new Error("수탁기관 사용여부 업데이트 실패", error.status);
    }
  }

  static async createLab(data: {
    code: string;
    name: string;
  }): Promise<ExternalLab> {
    try {
      return await ApiClient.post<ExternalLab>(externalLabApi.createLab, data);
    } catch (error: any) {
      throw new Error("수탁기관 등록 실패", error.status);
    }
  }

  static async createLabGrade(
    id: string,
    data: {
      qualityGrade: number;
      isPathologyCertified: boolean;
      isNuclearMedicineCertified: boolean;
      applyDate: string;
    }
  ): Promise<any> {
    try {
      return await ApiClient.post<any>(externalLabApi.createLabGrade(id), data);
    } catch (error: any) {
      throw new Error("질가산등급 등록 실패", error.status);
    }
  }

  static async deleteLab(id: string): Promise<any> {
    try {
      return await ApiClient.delete<any>(externalLabApi.deleteLab(id));
    } catch (error: any) {
      throw new Error("수탁기관 삭제 실패", error.status);
    }
  }

  static async deleteLabGrade(id: string, gradeId: string): Promise<any> {
    try {
      return await ApiClient.delete<any>(
        externalLabApi.deleteLabGrade(id, gradeId)
      );
    } catch (error: any) {
      throw new Error("질가산등급 삭제 실패", error.status);
    }
  }

  static async updateLabGrade(
    id: string,
    gradeId: string,
    data: {
      qualityGrade: number;
      isPathologyCertified: boolean;
      isNuclearMedicineCertified: boolean;
    }
  ): Promise<any> {
    try {
      return await ApiClient.patch<any>(
        externalLabApi.updateLabGrade(id, gradeId),
        data
      );
    } catch (error: any) {
      throw new Error("질가산등급 수정 실패", error.status);
    }
  }

  static async updateLab(
    id: string,
    data: {
      name: string;
      code: string;
    }
  ): Promise<ExternalLab> {
    try {
      return await ApiClient.patch<ExternalLab>(
        externalLabApi.updateLab(id),
        data
      );
    } catch (error: any) {
      throw new Error("수탁기관 정보 수정 실패", error.status);
    }
  }

  static async getExaminations(
    id: string,
    cursor?: string | null,
    keyword?: string
  ): Promise<any> {
    try {
      const params: Record<string, string> = {};
      if (cursor) {
        params.cursor = cursor;
      }
      if (keyword && keyword.trim() !== "") {
        params.keyword = keyword.trim();
      }
      return await ApiClient.get<any>(
        externalLabApi.getExaminations(id),
        Object.keys(params).length > 0 ? params : undefined
      );
    } catch (error: any) {
      throw new Error("검사 목록 조회 실패", error.status);
    }
  }
}
