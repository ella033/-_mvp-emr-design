import { InsuranceInfo } from "./rc-insurance-type";
import { PatientStatus } from "./patient-status-type";
import { VitalSignItem } from "../vital/vital-sign-items-types";
import type {
  ConsentPrivacyType,
  DetailCategoryType,
  PatientIdType,
  ServiceType,
  주간야간휴일구분,
  접수상태,
  초재진,
} from "@/constants/common/common-enum";
import type { EligibilityCheck } from "../eligibility-checks-types";
import type { CalcResultData } from "../chart/calc-result-data";
import type { RegistrationPaymentInfo } from "../registration-types";
import type { CreateOrderRequest } from "../chart/order-types";

// ================================ 환자 기본 정보 (화면 표시용) ================================
export interface RcPatientBaseInfo {
  // 기본 정보
  isNewPatient: boolean;
  patientId: string;  //고유 아이디(환자번호x 테이블 기준 고유환자번호) patientNumber -> patientId로 변경
  patientNo: number; //환자차트번호
  name: string;
  birthday: Date;
  gender: number;
  age: number;
  rrn: string;
  fatherRrn: string;
  eligibilityCheck: EligibilityCheck;
  // 주소 정보
  zipcode: string;
  address: string;
  address2: string;

  // 연락처
  phone1: string;
  phone2: string;

  // 메모 및 방문 정보
  patientMemo: string;
  receptionMemo: string;
  clinicalMemo: string;
  lastVisit: Date | null;
  nextAppointmentDateTime: Date | null;

  // 외국인 정보
  idNumber: string | null;
  idType: PatientIdType | null;

  isActive: boolean;
  hospitalId?: number | null;

  // 진료실 정보
  facilityId: number;
  roomPanel: string; // 진료실 패널 (Registration에서 추가)
  mainDoctorId?: number | null; //주치의 아이디 - 당장 쓸 계획은 x(hosptial_patient의 doctorId)
  // 의사 정보
  doctorId?: number | null; // 의사 ID

  // 가족 정보
  family: FamilyReceptionInfoType[];

  // 동의 정보
  isPrivacy: ConsentPrivacyType; // 개인정보제공동의여부
  recvMsg: number; // 수신여부
  // 당일 바이탈 입력여부
  isVitalToday: boolean;
  
  // 사진
  isExistPhoto: boolean;
  photoPath: string;

  identityOptional: boolean; // 본인확인여부
  identityVerifiedAt?: Date | null; // 본인확인일
  email: string;
  /** 환자 그룹 ID (number | null) */
  groupId: number | null;

  // 내원 경로
  admissiveChannel: number; // 내원경로
  recommender: string;
  // 수정 이력
  modifyItemList: string[];
}

// ================================ 접수 정보 (화면 표시용) ================================
export interface RcReceptionInfo {
  // 기본 접수 정보
  patientId: string;
  receptionId: number;
  facilityId: number;
  status: 접수상태;

  // 검진 및 진료 정보
  checkup: ServiceType | null; // 건강검진유형
  detailCategory: DetailCategoryType; // 진료상세구분
  timeCategory: 주간야간휴일구분; // 주간야간휴일구분

  // 진찰 정보
  receptionType: 초재진; // 초재진
  exceptionCode: string | null; //환자예외코드

  // 할인 정보
  discountOrder: number; // 감액표기순서
  discountLibraryNo: number;

  appointmentId: number | null;
  encounters:
  | {
    id: string;
    encounterDateTime: string;
    calcResultData: CalcResultData | null;
  }[]
  | null;
  paymentInfo?: {
    totalAmount: number;
    payments: RegistrationPaymentInfo[];
  };
  /** @description 영수증 존재 여부 */
  hasReceipt?: boolean;
  /** @description 추가접수 시 기준 접수의 ID (status가 대기/진료중일 때만 설정) */
  previousRegistrationId?: string | null;
  /** @description 예약접수 전환 시 기준 접수의 ID (다음에 위치할 registrationId) */
  nextRegistrationId?: string| null;
  // 수정 이력
  modifyItemList: string[];
}

// ================================ 생체 측정 정보 ================================
export interface RcBioMeasurementsInfo {
  // Vital 정보
  vital: VitalReceptionInfoType[];

  // BST 정보 (미구현)
  bst?: any[]; // BST 타입 필요시 추가

  // 수정 이력
  modifyItemList: string[];
}

// ================================ 가족 정보 ================================
export interface FamilyReceptionInfoType {
  id: number | null;
  patientFamilyId: number;
  name: string;
  birthDate: string;
  relation: number;
  rrn: string;
  phone1: string;
  phone2: string;
}

// ================================ 활력징후 정보 ================================
export interface VitalReceptionInfoType {
  id: string | null;
  measurementDateTime: string;
  itemId: number;
  value: string;
  memo: string;
  vitalSignItem: VitalSignItem;
}

export type VerbalOrdersInfo = CreateOrderRequest[];

// ================================ 접수 구조 (통합) ================================
export interface Reception {
  // 기본 접수 정보
  receptionDateTime: Date;

  // 환자 상태
  patientStatus: PatientStatus;

  // 화면 표시용 정보들
  patientBaseInfo: RcPatientBaseInfo;
  insuranceInfo: InsuranceInfo;
  receptionInfo: RcReceptionInfo;
  bioMeasurementsInfo: RcBioMeasurementsInfo;
  verbalOrdersInfo?: VerbalOrdersInfo;

  // 원본 Registration ID (삭제 시 사용)
  originalRegistrationId: string;
}
