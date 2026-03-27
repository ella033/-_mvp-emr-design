import {
  PrescriptionType,
  PrescriptionSubType,
  InOut,
  DecimalPoint,
  ConsignmentAgency,
} from "@/constants/master-data-enum";
import { PaymentMethod } from "@/constants/common/common-enum";
import type {
  DiseaseLinkType,
  DoseConditionType,
  InjectionLinkType,
} from "./prescription-user-codes/prescription-user-codes-upsert-type";
import type { PrescriptionLibraryDetailType } from "./prescription-libraries/prescription-library-type";
import type { SpecificDetail } from "../chart/specific-detail-code-type";
import type { SpecimenDetail } from "../chart/specimen-detail-code-type";
import type { ReceiptPrintLocation } from "@/constants/common/common-enum";

export type MasterDataDetailType = {
  type: PrescriptionType | null;
  subType: PrescriptionSubType | null;
  prescriptionLibraryDetails: PrescriptionLibraryDetailType[];
  prescriptionLibraryId: number | null;
  isActive: boolean;
  userCodeId: number | null;
  userCode: string;
  claimCode: string;
  applyDate: string;
  endDate: string;
  krName: string;
  enName: string;
  paymentMethod: PaymentMethod;
  isPossiblePayRate30: boolean;
  isPossiblePayRate50: boolean;
  isPossiblePayRate80: boolean;
  isPossiblePayRate90: boolean;
  isPossiblePayRate100: boolean;
  isNormalPrice: boolean;
  itemType: string;
  codeType: number;
  receiptPrintLocation: ReceiptPrintLocation;
  diseaseLink: DiseaseLinkType[];
  specificDetail: SpecificDetail[];
  specimenDetail: SpecimenDetail[];
  priceDetails: PriceDetailType[];
  isVerbal: boolean;
  isIncomeTaxDeductionExcluded: boolean;
  externalLabExaminationId?: string; // 외부 검사소 검사 ID
  externalLabHospitalMappingId?: string; // 외부 검사소 병원 매핑 ID
  externalLabName?: string; // 수탁기관
  externalLabExaminationCode?: string; // 수탁사코드
  externalLabUbCode?: string; // 표준코드
  externalLabExaminationName?: string; // 수탁사 검사 명칭
  isSystemExternalLab?: boolean; // 시스템 제공 수탁기관 여부
  drugMasterData?: DrugMasterDataDetailType;
  materialMasterData?: MaterialMasterDataDetailType;
  medicalMasterData?: MedicalMasterDataDetailType;
};

type DrugMasterDataDetailType = {
  // 라이브러리에는 있고 사용자코드에 없는 항목 시작
  activeIngredientCode: string;
  classificationNo: string;
  // 라이브러리에는 있고 사용자코드에 없는 항목 끝
  inOutType: InOut; // 원내외구분
  administrationRoute: string; // 투여경로(내복, 외용, 주사, 기타)
  specializationType: string; // 전문_일반(전문의약품 or 일반의약품)
  manufacturerName: string; // 제약사
  specification: string; // 규격
  unit: string; // 단위
  dose: number; // 투여량(용량)
  decimalPoint: DecimalPoint; // 소수점자리 (1:그대로, 2:올림, 3:반올림, 4:단위처리0.5, 5:단위올림0.5)
  days: number; // 투여일수(일투수)
  times: number; // 일투여횟수(일수)
  usage: string; // 용법: 코드 or 프리 텍스트
  injectionLink: InjectionLinkType[]; // 주사연결코드
  exceptionCode: string; // 예외코드
  doseCondition: DoseConditionType[]; // 연령/체중별 투여량 조건
};

type MaterialMasterDataDetailType = {
  material: string; // 재료
  manufacturerName: string; // 제조사
  importCompany: string; // 수입업소
  specification: string; // 규격
  unit: string; // 단위
  dose: number; // 투여량(용량)
};

type MedicalMasterDataDetailType = {
  consignmentAgency: ConsignmentAgency; // 위탁기관
  isAgeAdditionExcluded: boolean; // 나이가산제외여부
  isNightHolidayExcluded: boolean; // 야간공휴가산제외여부
  isExamResultViewExcluded: boolean; // 검사결과 보기 제외
  isPathologyNuclearAdditionExcluded: boolean; // 병리가산/핵의학 가산 제외
};

export type PriceDetailType = {
  tempId: string; // UI를 위해 임시로 사용하는 ID
  price: number; // 조회만 가능한 데이터 - 보험가(상한)
  additionalPrice: number; // 조회만 가능한 데이터 - 가산금
  id?: number; // 업데이트 시에만 존재
  applyDate: string; // ISO 8601 형식
  normalPrice: number; // 일반가
  actualPrice: number; // 실거래가
};
