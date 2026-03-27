import { ApiClient } from "@/lib/api/api-client";
import { specimenLibrariesApi } from "@/lib/api/routes/specimen-libraries-api";
import type { SpecimenLibrary } from "@/types/specimen-libraries-type";

export class SpecimenLibrariesService {
  /**
   * 검체 라이브러리 목록 조회 (전체 또는 keyword 검색).
   * @param keyword 없으면 전체 목록
   */
  static async getSpecimenLibraries(
    keyword?: string
  ): Promise<SpecimenLibrary[]> {
    const params = new URLSearchParams();
    if (keyword?.trim()) {
      params.set("keyword", keyword.trim());
    }
    const queryString = params.toString();
    const res = await ApiClient.get<SpecimenLibrary[]>(
      specimenLibrariesApi.list(queryString)
    );
    return res ?? [];
  }
}
