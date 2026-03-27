/**
 * 일일 마감 환자 정보 타입 정의
 */

import type { 보험구분상세 } from "@/constants/common/common-enum";

/**
 * 보험구분 라벨
 */
export type InsuranceTypeLabel = "의료보험" | "의료급여" | "산재보험" | "자동차보험" | "기타";

/**
 * 일일 마감 환자 DTO
 */
export interface DailyClosingPatient {
  /**
   * 차트번호 (환자 ID)
   */
  patientId: number;
  /**
   * 환자 이름
   */
  patientName: string;
  /**
   * 접수시간 (HH:MM)
   */
  receptionTime: string;
  /**
   * 수납시간 (HH:MM)
   */
  receiptTime: string;
  /**
   * 보험구분 라벨
   */
  insuranceType: 보험구분상세;
  /**
   * 카드 금액
   */
  cardAmount: number;
  /**
   * 현금 금액
   */
  cashAmount: number;
  /**
   * 계좌이체 금액
   */
  transferAmount: number;
  /**
   * 영수액 합계 (카드+현금+계좌이체, 환불 시 음수 가능)
   */
  receiveAmount: number;
  /**
   * 총 진료비
   */
  totalMedicalFee: number;
  /**
   * 급여 총액 (청구액+급여본인부담금+선별급여본인부담금)
   */
  insuranceTotalAmount: number;
  /**
   * 청구액
   */
  insuranceClaim: number;
  /**
   * 본인부담금 (급여본인부담금+선별급여본인부담금+비급여)
   */
  totalCopay: number;
  /**
   * 비급여
   */
  nonInsuranceCopay: number;
  /**
   * 감액 (할인)
   */
  discount: number;
  /**
   * 지원금
   */
  grantAmount: number;
  /**
   * 건강생활유지비 (건생비)
   */
  healthMaintenanceFee?: number;
  /**
   * 미수 발생금
   */
  receivableIssueAmount: number;
  /**
   * 미수 회수금
   */
  receivableCollectionAmount: number;
  /**
   * 환불 발생금
   */
  refundIssueAmount: number;
  /**
   * 환불 완료금
   */
  refundCompleteAmount: number;
  /**
   * 크레딧 발생금
   */
  creditIssueAmount: number;
  /**
   * 크레딧 사용금
   */
  creditUseAmount: number;
  /**
   * 절사액
   */
  cutPrice: number;
  /**
   * 검증 통과 여부
   */
  isValid: boolean;
  /**
   * 검증 실패 시 에러 메시지 목록
   */
  validationErrors: string[];
}

export interface DailyClosingSummary {
  totalPatients: number;
  healthInsurance: number;
  medicalBenefit: number;
  general: number;
  unpaid: number;
}

export interface DailyClosing {

  patients: DailyClosingPatient[];

  statistics: DailyClosingSummary;
}

