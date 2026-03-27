import { ApiClient } from "@/lib/api/api-client";
import { receiptsApi } from "@/lib/api/routes/receipts-api";
import { validateId } from "@/lib/validation";
import type {
  ReceiptDetailsResponse,
  ReceiptCancelRequest,
  ReceiptRefundRequest
} from "@/types/receipt/receipt-details-types";

export class ReceiptService {
  static async getReceipt(id: string): Promise<ReceiptDetailsResponse> {
    const validatedId = validateId(id, "receiptId");
    try {
      return await ApiClient.get<ReceiptDetailsResponse>(receiptsApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("영수증 조회 실패", error.status);
    }
  }

  static async getReceiptList(patientId: string, encounterId: string, settlementId: string, startDate: string, endDate: string): Promise<ReceiptDetailsResponse[]> {
    try {
      return await ApiClient.get<ReceiptDetailsResponse[]>(receiptsApi.list(patientId, encounterId, settlementId, startDate, endDate));
    } catch (error: any) {
      throw new Error("영수증 목록 조회 실패", error.status);
    }
  }
  /**
   * 영수증 취소
   * @param id - 영수증 ID
   * @param requestBody - 취소 요청 데이터 (cancelReason 포함)
   */
  static async cancelReceipt(id: string, requestBody: ReceiptCancelRequest): Promise<void> {
    const validatedId = validateId(id, "receiptId");
    try {
      return await ApiClient.post<void>(receiptsApi.cancel(validatedId), requestBody);
    } catch (error: any) {
      throw new Error("영수증 취소 실패", error.status);
    }
  }
  /**
   * 영수증 환불
   * @param id - 영수증 ID
   * @param requestBody - 환불 요청 데이터 (refundReason 포함)
   */
  static async refundReceipt(id: string, requestBody: ReceiptRefundRequest): Promise<void> {
    const validatedId = validateId(id, "receiptId");
    try {
      return await ApiClient.post<void>(receiptsApi.refund(validatedId), requestBody);
    } catch (error: any) {
      throw new Error("영수증 환불 실패", error.status);
    }
  }
}