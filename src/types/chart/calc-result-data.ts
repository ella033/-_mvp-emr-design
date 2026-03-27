import type { 정액정률구분 } from "@/constants/common/common-enum";
import type { ReceiptPrintLocation } from "@/constants/common/common-enum";
export interface CalcResultData {
  본인부담: PatientBurden;
  진료일시: string;
  처방내역s: PrescriptionDetail[];
  점수당단가: number;
  종별가산율: number;
  영수증내역s: 영수증내역[];
  항목별내역s: ItemDetail[];
  본인부담금액: PatientBurdenAmount;
  원외약본인부담: OutpatientBurden;
}

export interface PatientBurden {
  구분: string;
  금액: number;
  비율: BurdenRatio;
  설명: string;
  특정기호: string;
}

export interface BurdenRatio {
  장애기금: number;
  본인부담률: number;
  본인부담액: number;
  특수촬영률: number;
  요루장루비율: number;
  정신요법비율: number;
  정액정률구분: 정액정률구분;
  투약총액비율: number;
  본인부담추가비율: number;
  만성질환진찰료비율: number;
  장기지속형주사제비율: number;
}

export interface PrescriptionDetail {
  금액: number;
  단가: number;
  란구분: number;
  보험가: number;
  아이디: number;
  일반가: number;
  자보가: number;
  성분코드: string;
  일투여량: number;
  청구코드: string;
  투여일수: number;
  항목구분: string;
  본인부담금: number;
  본인부담률: number;
  사용자코드: string;
  원내외구분: number;
  상대가치점수: number;
  수납방법구분: number;
  종별가산율적용금액: number;
}

export interface ItemDetail {
  항목구분: string;
  란구분: number;
  비급여금: number;
  공단부담금: number;
  본인부담금: number;
  전액본인부담금: number;
}

/** 영수증내역s 배열의 한 항목 */
export interface 영수증내역 {
  영수증출력위치: ReceiptPrintLocation;
  비급여금: number;
  공단부담금: number;
  본인부담금: number;
  전액본인부담금: number;
}

export interface PatientBurdenAmount {
  비급여총액: number;
  원외약총액: number;
  투약료총액: number;
  요양급여차액: number;
  정신치료총액: number;
  본인부담금총액: number;
  특수촬영비총액: number;
  총액100분의100미만: number;
  요양급여비용총액1: number;
  만성질환진찰료총액: number;
  요루장루치료재료총액: number;
  본인부담금총액100분의100: number;
  요양급여비용본인부담금: number;
  장기지속형주사제비총액: number;
  본인일부부담금100분의100미만: number;
}

export interface OutpatientBurden {
  구분: string;
  금액: number;
  비율: BurdenRatio;
  설명: string;
  특정기호: string;
}

/** 진료비 계산 테이블/상세용 항목 한 건 */
export interface BillItem {
  category: string;
  subCategory?: string;
  selfPayment: number;
  corporationPayment: number;
  fullSelfPayment: number;
  nonBenefit: number;
}
