/**
 * 혜택(감액) API 타입
 * type=DISCOUNT일 때 config는 target, unit, value 필수
 */

import type { BenefitTarget, BenefitUnit } from "@/constants/common/common-enum";

/** 혜택(감액) 타입 */
export type BenefitType = "DISCOUNT";

/** DISCOUNT 타입 시 필수 config */
export interface BenefitDiscountConfig {
  /** 적용 대상 (common-enum BenefitTarget) */
  target: BenefitTarget;
  /** 단위 (common-enum BenefitUnit: WON=원, PERCENT=%) */
  unit: BenefitUnit;
  /** 값 (WON이면 0 이상, PERCENT면 0~100) */
  value: number;
}

export type BenefitConfig = BenefitDiscountConfig;

/** Benefit 생성 요청 (그룹 연동 없이 단독 생성 가능) */
export interface CreateBenefitRequest {
  name: string;
  type: BenefitType;
  config: BenefitDiscountConfig;
}

/** Benefit 수정 요청 (Create와 동일한 형태) */
export type UpdateBenefitRequest = CreateBenefitRequest;

/** Benefit API 응답 - 목록/상세 */
export interface Benefit {
  id: number;
  hospitalId: number;
  name: string;
  type: string;
  config: BenefitConfig;
  createId: number | null;
  createDateTime: string | null;
  updateId: number | null;
  updateDateTime: string | null;
  deleteId: number | null;
  deleteDateTime: string | null;
  patientGroups?: BenefitPatientGroupRef[];
}

/** Benefit 응답 내 환자그룹 참조 */
export interface BenefitPatientGroupRef {
  id: number;
  name: string;
}
