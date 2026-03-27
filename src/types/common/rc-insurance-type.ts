import {
  보험구분,
  보험구분상세,
  차상위보험구분,
  만성질환관리제,
  보훈등급,
  본인부담구분코드,
  피보험자와의관계,
} from "@/constants/common/common-enum";
import type { EligibilityCheck } from "../eligibility-checks-types";

/**
 * 만성질환 관리 이력
 */
export interface ChronicCtrlMngHist {
  // TODO: 만성질환 관리 이력 관련 필드들 추가
}

/**
 * 보험 정보 인터페이스
 * C# RcInsuranceInfo 클래스와 동일한 구조
 */
export interface InsuranceInfo {
  // 기본 정보
  isBaby: boolean;
  fatherRrn: string;
  patientId: string;

  // 보험구분 관련
  uDeptDetail: 보험구분상세;
  차상위보험구분: 차상위보험구분;

  // 공단 정보
  unionCode: string;
  unionName: string;

  // 자보 관련
  자보사고번호: string;
  paymentGuaranteeNumber: string;
  paymentAwardDate: Date;
  paymentLostDate: Date;
  insuranceCompany: string;

  // 카드 및 가족 정보
  cardNumber: string;
  father: string;
  relation: 피보험자와의관계;

  // 임신 관련
  is임신부: boolean;
  is난임치료: boolean;

  // 만성질환 관리
  is만성질환관리: boolean;
  만성질환관리제: 만성질환관리제;
  is의원급만성질환관리제: boolean;


  // 보훈 관련
  보훈여부: boolean;
  veteranGrade: 보훈등급;

  // 산재 관련
  산재후유: boolean;

  // 본인부담 관련
  ori본인부담구분코드: 본인부담구분코드;
  cfcd: 본인부담구분코드;


  // 차상위 관련
  차상위승인일: Date;
  차상위종료일: Date;
  차상위특정기호: string;

  // DisReg 관련
  modifyItemList: string[];
  identityOptional: boolean;
  /**
   * 추가자격사항 정보만 담고 있는 필드
   * add-disreg.tsx와 add-disreg-modal.tsx에서 수정된 추가자격사항 필드들만 추출하여 저장
   * (예: 산정특례암등록대상자1, 산정특례화상등록대상자 등)
   */
  extraQualification?: Record<string, any>;
  eligibilityCheck: EligibilityCheck;
  // 만성질환 관리 이력
  chronicCtrlMngHist: ChronicCtrlMngHist;

  // Computed 필드들 (C# computed property와 동일)
  uDept: 보험구분;
  만성질환관리제ForBinding: string;
  veteranGradeForBinding: string;
  본인부담구분코드ForDisplay: string;
  차상위보험구분Description: string;
}
