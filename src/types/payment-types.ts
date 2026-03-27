/**
 * 결제 관련 타입 정의
 */

import type { ReceiptAdjustmentBase } from "./receipt/receipt-adjustment-types";
import type { ReceiptDetailsResponse } from "./receipt/receipt-details-types";
import { CashApprovalMethod } from "@/constants/common/common-enum";
/**
 * 결제 데이터 인터페이스
 */
export interface PaymentData {
  totalMedicalFee: number;
  claimAmount: number;
  patientCopay: number;
  nonCovered: number;
  receivables: number;
  discount: number;
  grantAmount: number;
  healthMaintenanceFee: number;
  deductionTotal: number;
  cutPrice: number;
  adjustments?: ReceiptAdjustmentBase[];
}

export interface AdjustmentValues {
  discount: number;
  healthMaintenanceFee: number;
  grantAmount: number;
  adjustments: ReceiptAdjustmentBase[];
}

/**
 * 결제 수단 데이터 인터페이스
 */
export interface PaymentMethodData {
  isCardChecked: boolean;
  isCashChecked: boolean;
  cardAmount: string;
  cashAmount: string;
  accountAmount: string; // 계좌이체금액 (transferAmount)
  installment: string;
  isCashReceiptChecked: boolean;
  cashReceiptAmount: string;
  approvalMethod?: CashApprovalMethod;
  approvalNumber: string;
  receiptData?: ReceiptDetailsResponse[];
  receiptIds?: string[];
}

/**
 * 결제 원천 타입
 */
export type PaymentSource = "CARD" | "CASH";

/**
 * 결제 수단 타입
 */
export type PaymentMethod = "DIRECT" | "KAKAO" | "NAVER" | "TOSS" | "PAYCO" | "SAMSUNG";

/**
 * 결제 목록 조회 파라미터
 */
export interface PaymentsListParams {
  settlementId?: string;
  paymentSource?: PaymentSource;
  paymentMethod?: PaymentMethod;
  receiptId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  includedCanceled?: boolean;
}

export interface CancelPaymentRequest {
  cancelApprovalNo: string;
  cancelApprovalDate: Date;
}