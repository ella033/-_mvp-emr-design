import { ApiClient } from "@/lib/api/api-client";
import { billingApi } from "@/lib/api/routes/billing-api";
import type {
  BillingRequest,
  BillingResponse,
} from "@/types/billing-types";

export class BillingService {
  /**
   * One-Click Billing 처리
   * 영수증 생성 + 정산 생성 + 결제를 한 번에 처리합니다.
   * @param requestBody - One-Click Billing 요청 데이터
   * @returns One-Click Billing 응답 데이터
   */
  static async oneClickBilling(
    requestBody: BillingRequest
  ): Promise<BillingResponse> {
    try {
      return await ApiClient.post<BillingResponse>(
        billingApi.create,
        requestBody
      );
    } catch (error: any) {
      throw new Error("One-Click Billing 처리 실패", error.status);
    }
  }
}