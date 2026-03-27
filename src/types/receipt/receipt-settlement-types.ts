import { SettlementCategory } from "@/constants/common/common-enum";
import type { PaymentInfo } from "./payments-info-types";
import type { ReceiptInfo } from "./receipt-details-types";
export interface SettlementInfo {
  /**
   * @description 정산 ID
   * @example 1
   */
  id: string;

  /**
   * Format: date-time
   * @description 정산 일시
   * @example 2025-01-15T09:30:00.000Z
   */
  settlementDate: string;
  /**
   * @description 정산 카테고리
   * @example INITIAL
   */
  settlementCategory: SettlementCategory;
}

export interface ReceiptSettlement {
  /**
   * @description ReceiptSettlement ID
   * @example 1
   */
  id: string;
  /** @description 정산 정보 */
  settlement: SettlementInfo;
}

export interface SettlementCancelRequest {
  /**
   * @description 취소 사유
   * @example "고객 요청"
   */
  cancelReason: string;
}

export interface SettlementRefundRequest {
  /**
   * @description 환불 사유
   * @example "결제 오류"
   */
  refundReason: string;
}


export interface SettlementDetailResponse {
  /**
   * @description 정산 ID
   * @example 1
   */
  id: number;
  /**
   * Format: date-time
   * @description 정산 일시
   * @example 2025-01-15T09:30:00.000Z
   */
  settlementDate: string;
  /**
   * @description 정산 카테고리
   * @example INITIAL
   */
  settlementCategory: SettlementCategory;
  /** @description 총 금액 */
  totalAmount: number;
  /** @description 카드 금액 */
  cardAmount: number;
  /** @description 현금 금액 */
  cashAmount: number;
  /** @description 미수금 금액 */
  receivablesAmount: number;
  /** @description 활성 여부 */
  isActive: boolean;
  /** @description 취소 여부 */
  isCanceled: boolean;
  /** @description 취소 일시 */
  canceledAt?: Record<string, never> | null;
  /** @description 원본 정산 ID */
  parentSettlementId?: Record<string, never> | null;
  /** @description 영수증 목록 */
  receipts: ReceiptInfo[];
  /** @description 결제 목록 */
  payments: PaymentInfo[];
}



