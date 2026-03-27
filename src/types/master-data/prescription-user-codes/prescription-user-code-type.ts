import type { MedicalUserCodeType } from "./user-code/medical-user-code-type";
import type { DrugUserCodeType } from "./user-code/drug-user-code-type";
import type { MaterialUserCodeType } from "./user-code/material-user-code-type";
import type { PrescriptionLibraryType } from "../prescription-libraries/prescription-library-type";
import type {
  DiseaseLinkType,
} from "./prescription-user-codes-upsert-type";
import type { PrescriptionType } from "@/constants/master-data-enum";
import type { PaymentMethod } from "@/constants/common/common-enum";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";

export type PrescriptionUserCodeType = {
  id: number;
  type: PrescriptionType; // 처방구분 (1:수가, 2:약가, 3:재료대)
  typePrescriptionLibraryId: number;
  hospitalId: number;
  code: string;
  name: string;
  nameEn: string;
  applyDate: string;
  endDate: string | null;
  paymentMethod: PaymentMethod;
  isNormalPrice: boolean;
  diseaseLink: DiseaseLinkType[];
  specificDetail: SpecificDetail[];
  specimenDetail: SpecimenDetail[];
  receiptPrintLocation: number;
  isIncomeTaxDeductionExcluded: boolean;
  isVerbal: boolean;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  isActive: boolean;
  itemType: string;
  codeType: number;
  medicalUserCode: MedicalUserCodeType | undefined;
  drugUserCode: DrugUserCodeType | undefined;
  materialUserCode: MaterialUserCodeType | undefined;
  details: DetailType[];
  library: PrescriptionLibraryType;
  isSystemExternalLab?: boolean; // 수탁검사여부
  externalLabExaminationId?: string; // 외부 검사소 검사 ID
  externalLabHospitalMappingId?: string; // 외부 검사소 병원 매핑 ID
  externalLabName?: string; // 수탁기관
  externalLabExaminationCode?: string; // 수탁사코드
  externalLabUbCode?: string; // 표준코드
  externalLabExaminationName?: string; // 수탁사 검사 명칭
  externalLabExamination?: {
    id: string;
    externalLabId: string;
    examinationCode: string;
    claimCode: string | null;
    name: string;
    ename: string;
    type: string;
    spcCode: string;
    spcName: string;
    ubCode?: string;
    ubClaimCode?: string;
    description: string | null;
    createId: number | null;
    createDateTime: string;
    updateId: number | null;
    updateDateTime: string | null;
  };
  externalLabHospitalMapping?: {
    id: string;
    hospitalId: number;
    externalLabId: string;
    externalLabHospitalId: string | null;
    isEnabled: boolean;
    createId: number;
    createDateTime: string;
    updateId: number | null;
    updateDateTime: string | null;
  };
};

export type DetailType = {
  id?: number; // 업데이트 시에만 존재
  applyDate: string; // ISO 8601 형식
  normalPrice: number; // 일반가
  actualPrice: number; // 실거래가
};
