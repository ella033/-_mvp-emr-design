import type { Encounter } from "../chart/encounter-types";
import type { Patient } from "../patient-types";
import type { ReceiptAdjustment } from "./receipt-adjustment-types";
import type { PaymentInfo } from "./payments-info-types";
import { ReceiptSettlement } from "./receipt-settlement-types";
import { ReceiptType } from "@/constants/common/common-enum";

export interface ReceiptInfo {
  /**
   * @description 영수증 ID
   * @example 1
   */
  receiptId: number;
  /** @description 환자 ID */
  patientId: number;
  /** @description 환자명 */
  patientName: string;
  /** @description 최종 청구 금액 */
  finalAmount: number;
  /** @description 할당 금액 */
  allocatedAmount: number;
}

export interface ReceiptDetailsBase {
  /**
   * @description 진료(Encounter) ID
   * @example 1
   */
  encounterId: string;
  /**
   * @description 영수증 타입
   * @example ORIGINAL
   * @enum {string}
   */
  receiptType: ReceiptType;
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

}

export interface ReceiptDetails extends ReceiptDetailsBase {
  /**
   * @description 영수증 ID
   * @example 1
   */
  id: string;
  /**
* Format: date-time
* @description 영수증 발행일시
* @example 2025-01-15T09:30:00.000Z
*/
  receiptDate: string;
  /**
 * @description 생성자 ID
 * @example 1
 */
  createId: number;
  /**
   * Format: date-time
   * @description 생성 일시
   * @example 2025-01-15T09:30:00.000Z
   */
  createDateTime: string;
}

export interface ReceiptDetailsResponse extends ReceiptDetails {
  /** @description 환자 정보 */
  patient?: Patient;
  /** @description 진료 정보 */
  encounter?: Encounter;
  /** @description 정산 정보 */
  receiptSettlements?: ReceiptSettlement[];
  /** @description RECEIPT 시점 조정 내역 (할인, 감면, 보험) */
  adjustments?: ReceiptAdjustment[];
  /**
   * @description 이미 수납된 금액
   * @example 5000
   */
  paidAmount?: number;
  /**
   * @description 미수납 잔액
   * @example 15000
   */
  remainingAmount?: number;
  /**
   * @description 완납 여부
   * @example false
   */
  isFullyPaid?: boolean;
  /**
   * @description 해당 영수증의 미수금 잔액
   * @example 15000
   */
  receivableBalance?: number;
  /**
   * @description 환자의 크레딧 잔액 (전체)
   * @example 5000
   */
  patientCreditBalance?: number;
  /**
   * @description 수납 가능 여부 (완납되지 않았고 잔액이 있으면 true)
   * @example true
   */
  canSettle?: boolean;
  /** @description 결제 정보 (이 영수증과 연결된 정산의 결제 목록) */
  payments?: PaymentInfo[];
  /**
   * @description 합산 수납 여부 (여러 영수증이 하나의 정산에 포함된 경우 true)
   * @example false
   */
  isCombinedPayment?: boolean;
  /**
   * @description 카드 단말기 결제 여부 (연결된 카드 결제 중 하나라도 approvalNo가 있으면 true)
   * @example true
   */
  isTerminalCardPayment?: boolean;
  /**
   * @description 현금 단말기 결제 여부 (연결된 현금 결제 중 하나라도 approvalNo가 있으면 true)
   * @example false
   */
  isTerminalCashPayment?: boolean;
}
export interface CancelApprovalInfo {
  paymentId: string;
  cancelApprovalNo?: string;
  cancelApprovalDate?: string;
}
export interface ReceiptCancelRequest {
  /**
   * @description 취소 사유
   * @example "고객 요청"
   */
  cancelReason: string;
  cancelApprovalInfo?: CancelApprovalInfo[]
}

export interface ReceiptRefundRequest {
  /**
   * @description 환불 사유
   * @example "결제 오류"
   */
  refundReason: string;
}


