import { ApiClient } from "@/lib/api/api-client";
import { diseaseLibrariesApi } from "@/lib/api/api-routes";
import type { DiseaseLibrariesParamType } from "@/types/master-data/disease-libraries/disease-libraries-param-type";
import type { DiseaseLibrariesResponse } from "@/types/master-data/disease-libraries/disease-libraries-response-type";
import type { DiseaseLibraryDetail } from "@/types/master-data/disease-libraries/disease-libraries-detail-type";

export class DiseaseLibrariesService {
  static async searchDiseaseLibraries(
    query?: DiseaseLibrariesParamType
  ): Promise<DiseaseLibrariesResponse> {
    try {
      const queryString = query ? this.buildQueryString(query) : "";
      return await ApiClient.get<DiseaseLibrariesResponse>(
        diseaseLibrariesApi.search(queryString)
      );
    } catch (error: any) {
      throw new Error("상병 라이브러리 검색 실패", error.status);
    }
  }

  static async getDiseaseLibraryById(id: number): Promise<DiseaseLibraryDetail> {
    try {
      return await ApiClient.get<DiseaseLibraryDetail>(
        diseaseLibrariesApi.detail(id)
      );
    } catch (error: any) {
      throw new Error("상병 라이브러리 상세 조회 실패", error.status);
    }
  }

  private static buildQueryString(query: DiseaseLibrariesParamType): string {
    const params = new URLSearchParams();

    if (query.keyword !== undefined && query.keyword !== "") {
      params.append("keyword", query.keyword);
    }
    if (query.limit !== undefined && query.limit > 0) {
      params.append("limit", query.limit.toString());
    }
    if (query.cursor !== undefined && query.cursor > 0) {
      params.append("cursor", query.cursor.toString());
    }
    if (query.baseDate !== undefined && query.baseDate !== "") {
      params.append("baseDate", query.baseDate);
    }
    if (query.isComplete !== undefined && query.isComplete !== false) {
      params.append("isComplete", query.isComplete ? "true" : "false");
    }

    return params.toString();
  }
}
