import { ApiClient } from "@/lib/api/api-client";
import { prohibitedDrugsApi } from "@/lib/api/routes/prohibited-drugs-api";
import type {
  ProhibitedDrug,
  UpsertManyProhibitedDrugsRequest,
} from "@/types/prohibited-drugs-type";

export class ProhibitedDrugsService {
  /**
   * 환자별 처방금지약품 목록 조회
   */
  static async getProhibitedDrugs(
    patientId: number
  ): Promise<ProhibitedDrug[]> {
    try {
      return await ApiClient.get<ProhibitedDrug[]>(
        prohibitedDrugsApi.list(patientId)
      );
    } catch (error: any) {
      throw new Error("처방금지약품 목록 조회 실패", error.status);
    }
  }

  /**
   * 환자별 처방금지약품 일괄 삭제 및 생성/수정
   */
  static async deleteUpsertManyProhibitedDrugs(
    patientId: number,
    data: UpsertManyProhibitedDrugsRequest
  ): Promise<ProhibitedDrug[]> {
    try {
      return await ApiClient.post<ProhibitedDrug[]>(
        prohibitedDrugsApi.deleteUpsertMany(patientId),
        data
      );
    } catch (error: any) {
      throw new Error("처방금지약품 일괄 처리 실패", error.status);
    }
  }
}
