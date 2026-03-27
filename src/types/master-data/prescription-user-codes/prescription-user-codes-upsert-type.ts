import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import type { DetailType } from "./prescription-user-code-type";

export type PrescriptionUserCodesUpsertType = {
  type: number | null;
  userCodeId: number | null;
  typePrescriptionLibraryId: number | null;
  code: string;
  applyDate: string; // ISO 8601 형식
  endDate: string; // ISO 8601 형식
  paymentMethod: number;
  isNormalPrice: boolean;
  diseaseLink: DiseaseLinkType[];
  specificDetail: SpecificDetail[];
  specimenDetail: SpecimenDetail[];
  receiptPrintLocation: number;
  isIncomeTaxDeductionExcluded: boolean;
  isVerbal: boolean;
  isActive: boolean;
  itemType: string;
  codeType: number;
  name: string; // 한글명칭
  nameEn: string; // 영문명칭
  externalLabExaminationId?: string; // 외부 검사소 검사 ID
  externalLabHospitalMappingId?: string; // 외부 검사소 병원 매핑 ID
  medicalUserCode?: MedicalUserCodeType;
  drugUserCode?: DrugUserCodeType;
  materialUserCode?: MaterialUserCodeType;
  details: DetailType[];
};

export type DiseaseLinkType = {
  id: number;
  code: string;
  name: string;
};

export type MedicalUserCodeType = {
  isAgeAdditionExcluded: boolean;
  isNightHolidayExcluded: boolean;
  isExamResultViewExcluded: boolean;
  isPathologyNuclearAdditionExcluded: boolean;
};

export type DrugUserCodeType = {
  inOutType: number;
  dose: number;
  days: number;
  times: number;
  usage: string;
  decimalPoint: number;
  injectionLink: InjectionLinkType[];
  exceptionCode: string;
  doseCondition: DoseConditionType[];
  administrationRoute: string; // 투여경로(내복, 외용, 주사, 기타)
  specializationType: string; // 전문_일반(전문의약품 or 일반의약품)
  manufacturerName: string; // 제약사
  specification: string; // 규격
  unit: string; // 단위
};

export type InjectionLinkType = {
  id: number;
  code: string;
  name: string;
};

export type DoseConditionType = {
  type: number; // 조건별투여량 (type=1:체중, type=2:연령)
  doseRanges: DoseRangeType[];
};

export type DoseRangeType = {
  lt: number; // 미만
  gte: number; // 이상
  value: number; // 투여량
};

export type MaterialUserCodeType = {
  dose: number;
  importCompany: string; // 수입업소
  manufacturerName: string; // 제조사
  material: string; // 재료
  specification: string; // 규격
  unit: string; // 단위
};
