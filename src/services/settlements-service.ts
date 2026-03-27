import { ApiClient } from "@/lib/api/api-client";
import { settlementsApi } from "@/lib/api/routes/settlements-api";
import { validateId } from "@/lib/validation";
import type {
  SettlementDetailResponse
} from "@/types/receipt/receipt-settlement-types";

export class SettlementService {
  static async listSettlements(
    patientId: string,
    encounterId: string,
    settlementId: string,
    startDate: string,
    endDate: string
  ): Promise<SettlementDetailResponse[]> {
    return await ApiClient.get<SettlementDetailResponse[]>(settlementsApi.list(patientId, encounterId, settlementId, startDate, endDate));
  }

  static async detailSettlement(
    id: string
  ): Promise<SettlementDetailResponse> {
    const validatedId = validateId(id, "settlementId");
    return await ApiClient.get<SettlementDetailResponse>(settlementsApi.detail(validatedId));
  }

}

