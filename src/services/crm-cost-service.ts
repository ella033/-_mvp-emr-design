import { ApiClient } from "@/lib/api/api-client";
import { crmCostApi } from "@/lib/api/routes/crm-cost-api";
import type { GetCostResponseDto } from "@/types/crm/cost/crm-cost-types";

export class CrmCostService {
  static async getCost(
    targetMonth: string
  ): Promise<GetCostResponseDto> {
    try {
      return await ApiClient.get<GetCostResponseDto>(
        crmCostApi.getCost,
        { targetMonth }
      );
    } catch (error: any) {
      throw new Error("CRM 메시지 발송 비용 조회에 실패했습니다.", error.status);
    }
  }
}

