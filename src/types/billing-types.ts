import type { PaymentInfo, PaymentInfoRequest } from "./receipt/payments-info-types";
import type { ReceiptAdjustment, ReceiptAdjustmentBase } from "./receipt/receipt-adjustment-types";
import type { ReceiptDetailsBase, ReceiptDetailsResponse } from "./receipt/receipt-details-types";
import { SettlementCategory, type ReceiptType } from "@/constants/common/common-enum";

interface BillingCredit {
  receiptIndex: number;
  // 크레딧 발급 금액
  creditIssueAmount: number;
  // 크레딧 사용 금액
  creditUseAmount: number;
}

interface ReceiptAllocation {
  /**
   * @description 영수증 배열 인덱스 (0부터 시작)
   */
  receiptIndex: number;
  /**
   * @description 할당 금액
   */
  allocatedAmount: number;
}

interface BillingReceiptDetails {
  /**
   * @description 진료(Encounter) ID
   * @example 1
   */
  encounterId: string;
  /**
   * Format: date-time
   * @description 수납일시 - 상황에 따라 진료일과 수납일의 Date가 다른 경우는 값 싣어 보내기
   * @example 2025-01-15T09:30:00.000Z
   */
  receiptDate?: string;
  /**
   * @description 총 진료비
   * @example 100000
   */
  totalMedicalFee: number;
  /**
   * @description 보험 청구액
   * @example 80000
   */
  insuranceClaim: number;
  /**
   * @description 급여 본인부담금
   * @example 15000
   */
  insuranceCopay: number;
  /**
   * @description 비급여 본인부담금
   * @example 5000
   */
  nonInsuranceCopay: number;
  /**
   * @description 선별급여 본인부담금
   * @example 0
   */
  selectiveCopay: number;
  /**
   * @description 총 본인부담금
   * @example 20000
   */
  totalCopay: number;
  /**
   * @description 할인
   * @example 0
   */
  discount: number;
  /**
   * @description 지원금
   * @example 0
   */
  grantAmount: number;
  /**
   * @description 절감액
   * @example 0
   */
  cutPrice: number;
  /**
   * @description 최종 청구 금액
   * @example 20000
   */
  finalAmount: number;
  /**
   * @description 영수증 메모
   * @example 영수증 메모 내용
   */
  receiptMemo?: string;

  adjustments?: ReceiptAdjustmentBase[];
}
interface BillingSettlementResponse {

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
  /**
   * @description 병원 ID
   * @example 1
   */
  hospitalId?: number;
}
export interface BillingSettlementRequest {
  /**
   * @description 병원 ID
   * @example 1
   */
  hospitalId: number;
  /**
   * @description 영수증 할당 정보 (receiptIndex: receipts 배열의 인덱스, allocatedAmount: 할당 금액)
   */
  receiptAllocations: ReceiptAllocation[];
  /**
 * @description 크레딧 할당 정보 (각 영수증마다 creditIssueAmount와 creditUseAmount 포함, receiptAllocations와 동일한 개수)
 */
  creditAllocations?: BillingCredit[] | [];
  /**
   * @description 결제 정보
   */
  payments: PaymentInfoRequest[];
}
/**
 * 환자 정보 (진료별 수납 전 정보)
 */
interface EncounterPatientInfo {
  /**
   * @description 환자 ID
   * @example 1
   */
  id: number;
  /**
   * @description 환자의 미수금 잔액 (전체)
   * @example 30000
   */
  receivableBalance: number;
  /**
   * @description 환자의 크레딧 잔액 (전체)
   * @example 5000
   */
  creditBalance: number;
}

/**
 * 영수증 정보 (진료별 수납 전 정보)
 */
interface EncounterReceiptInfo {
  /**
   * @description 영수증 ID
   * @example 1
   */
  receiptId: number;
  /**
   * @description 환자 ID
   * @example 1
   */
  patientId: number;
  /**
   * @description 환자명
   * @example 홍길동
   */
  patientName: string;
  /**
   * @description 영수액
   * @example 20000
   */
  finalAmount: number;
  /**
   * @description 이미 수납된 금액
   * @example 5000
   */
  paidAmount: number;
}

/**
 * 진료별 수납 전 정보
 */
interface EncounterSettlementInfo {
  /**
   * @description 진료 ID
   * @example 1
   */
  encounterId: number;
  /**
   * @description 환자 정보
   */
  patient: EncounterPatientInfo;
  /**
   * @description 영수증 목록 (영수증이 없는 경우 빈 배열)
   */
  receipts: EncounterReceiptInfo[];
  /**
   * @description 수납 가능 여부 (영수증이 있고 완납되지 않았으면 true)
   * @example true
   */
  canSettle: boolean;
}

/**
 * 진료별 수납 전 정보 응답
 */
export interface EncounterBillingSettlementInfo {
  /**
   * @description 진료별 수납 전 정보 목록
   */
  encounters: EncounterSettlementInfo[];
}


export interface BillingRequest {
  receipts: BillingReceiptDetails[];
  settlement: BillingSettlementRequest;
}

export interface BillingResponse {
  receipts: ReceiptDetailsResponse[];
  settlement: BillingSettlementResponse[];
  payments: PaymentInfo[];
  summary: {
    receiptCount: number;
    totalAllocatedAmount: number;
    totalPaymentAmount: number;
    totalReceivableAmount: number;
  }
}