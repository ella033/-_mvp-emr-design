import type {
  DetailCategoryType,
  ServiceType,
  주간야간휴일구분,
  초재진,
  보험구분상세,
  접수상태,
  PaymentProvider,
  PaymentSource,
} from "@/constants/common/common-enum";
import type { Patient } from "./patient-types";
import type { EligibilityCheck } from "./eligibility-checks-types";
import type { CalcResultData } from "./chart/calc-result-data";
import type { ProhibitedDrug } from "./prohibited-drugs-type";

interface appointmentExternalPlatform {
  id: number;
  externalPlatformId: number;
  externalPlatform: { platformCode: string };
}

// reception-types에도 사용됨
export interface RegistrationPaymentInfo {
  paymentSource: PaymentSource;
  /**
   * @description 결제 방법
   * @example DIRECT
   */
  paymentMethod: PaymentProvider;
  /**
   * @description 결제 금액
   * @example 20000
   */
  amount: number;
  paymentCreateTime: Date;
}
// ================================ 접수 기본 ================================
export interface RegistrationBase {
  hospitalId: number;
  patientId: number;
  receptionDateTime: string;
  memo?: string;
  insuranceType: 보험구분상세;
  certificateNo?: string;
  insuredPerson?: string;
  providerCode?: string;
  providerName?: string;
  exemptionCode?: string;
  receptionType: 초재진; //초재진
  patientRoute?: Record<string, any>;
  roomPanel?: string;
  status: 접수상태;
  doctorId?: number | null;
  facilityId?: number | null;
  exceptionCode?: string | null; //예외코드
  timeCategory?: 주간야간휴일구분; //주간야간공휴일
  serviceType?: ServiceType | null; //검진기타
  detailCategory?: DetailCategoryType | null;
  position: string;
  /**
   * 추가자격사항 정보만 담고 있는 필드
   * add-disreg.tsx와 add-disreg-modal.tsx에서 수정된 추가자격사항 필드들만 추출하여 저장
   * (예: 산정특례암등록대상자1, 산정특례화상등록대상자 등)
   */
  extraQualification?: Record<string, any>;
  encounters?:
  | {
    id: string;
    encounterDateTime: string;
    calcResultData: CalcResultData | null;
  }[]
  | null;
}

// ================================ 접수 정보 ================================
export interface Registration extends RegistrationBase {
  id: string;
  createdId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
  patient?: Patient;
  eligibilityCheck?: EligibilityCheck;
  appointment?: appointmentExternalPlatform;
  paymentInfo?: { totalAmount: number, payments: RegistrationPaymentInfo[] }
  hasReceipt?:boolean;
  // 처방금지 약품
  prohibitedDrugs?: ProhibitedDrug[] | null;
  isNewPatient?: boolean;
  treatingStartedAt?:string | null;
}

// ================================ 접수 생성 ================================
export interface CreateRegistrationRequest extends RegistrationBase {
  eligibilityCheckId?: number | null;
  appointmentId?: number | null;
  // 해당 접수 바로 뒤 position 생성
  previousRegistrationId?: string | null;
  nextRegistrationId?: string|null;
}
export interface CreateRegistrationResponse {
  id: string;
}

// ================================ 접수 수정 ================================
export interface UpdateRegistrationRequest extends Partial<RegistrationBase> {
  eligibilityCheckId?: number | null;
}
export interface UpdateRegistrationResponse extends Registration { }

// ================================ 접수 삭제 ================================
export interface DeleteRegistrationRequest { }
export interface DeleteRegistrationResponse {
  id: string;
}
