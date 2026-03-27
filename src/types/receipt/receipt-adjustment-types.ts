import { AdjustmentType } from "@/constants/common/common-enum";

export interface ReceiptAdjustmentBase {
  /**
   * @description 조정 타입
   * @example DISCOUNT
   * @enum {string}
   */
  adjustmentType: AdjustmentType;
  /**
   * @description 조정 금액
   * @example 5000
   */
  amount: number;
  /**
   * @description 할인 타입 (DISCOUNT인 경우)
   * @example PROMOTION
   */
  discountType?: string;
  /**
 * @description 감면 타입 (GRANT인 경우)
 * @example MEDICAL_AID
 */
  grantType?: string;
  /**
 * @description 사유
 * @example 영수증 할인
 */
  reason?: string;
}


export interface ReceiptAdjustment {
  /**
   * @description Adjustment ID
   * @example 1
   */
  id: string;
  /**
   * @description 영수증 ID
   * @example 1
   */
  receiptId: string;
  /**
   * @description 정산 ID
   * @example 1
   */
  settlementId?: string;
  /**
   * @description 승인 문서 번호 (GRANT인 경우)
   * @example DOC-2025-001
   */
  approvalDocumentNo?: string;
  /**
   * @description 승인자 (GRANT인 경우)
   * @example 관리자
   */
  approvedBy?: string;
  /**
   * @description 보험 타입 (INSURANCE인 경우)
   * @example HEALTH_INSURANCE
   */
  insuranceType?: string;
  /**
   * @description 보험 청구 번호 (INSURANCE인 경우)
   * @example INS-2025-001
   */
  insuranceClaimNo?: string;

  /**
   * Format: date-time
   * @description 생성 일시
   * @example 2025-01-15T09:30:00.000Z
   */
  createDateTime: string;
  /**
   * @description 생성자 ID
   * @example 1
   */
  createId?: number;
}

