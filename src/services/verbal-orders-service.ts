import { ApiClient } from "@/lib/api/api-client";
import { verbalOrdersApi } from "@/lib/api/api-routes";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";

export class VerbalOrdersService {
  static async getVerbalOrders(baseDate: string): Promise<PrescriptionUserCodeType[]> {
    try {
      return await ApiClient.get<PrescriptionUserCodeType[]>(verbalOrdersApi.list(baseDate));
    } catch (error: any) {
      throw new Error("구두처방 리스트 조회 실패", error.status);
    }
  }
}