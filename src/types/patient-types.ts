import { ChronicDisease } from "./chart/chronic-disease";
import { Encounter } from "@/types/chart/encounter-types";
import type { VitalSignMeasurement } from "./vital/vital-sign-measurement-types";
import type { PatientIdType, ConsentPrivacyType } from "@/constants/common/common-enum";
import type { EligibilityCheck } from "./eligibility-checks-types";

// ================================ 환자 정보 폼 ================================
export type PatientFormType = {
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  phone: string;
  zipcode: string;
  address: string;
  address2: string;
  memo: string;
  familyName: string;
  familyPhone: string;
  gender: number;
  purpose: string;
  visitType: string;
  insuranceType: number;
  schedule: string;
  roomPanel: string;
  date: string;
  time: string;
  family: string;
  vitals: { [key: string]: string };
};

// ================================ 환자 기본 ================================
export interface PatientBase {
  name: string;
  rrn: string | null;
  gender: number | null;
  phone1: string;
  phone2: string | null;
  address1: string | null;
  address2: string | null;
  zipcode: string | null;
  idNumber: string | null;
  idType: PatientIdType | null;
  patientType: number | null; // PatientType enum: 0=GENERAL(일반내국인), 1=FOREIGN(외국인), 2=OTHER(기타)
  /** 환자 그룹 ID (number | null) */
  groupId: number | null;
  birthDate: string | null;
  chronicDisease?: ChronicDisease | null;
  memo?: string | null;
  symptom?: string | null;
  clinicalMemo?: string | null;
  visitRoute?: string | null;
  recommender?: string | null;
  doctorId?: number | null;
  isActive: boolean;
  isTemporary: boolean;
  hospitalId?: number | null;
  receptionMemo?: string;
  patientNo?: number | null;
  /** 본인확인 예외 여부 */
  identityOptional?: boolean | null;
  /** 본인확인일 */
  identityVerifiedAt?: Date | string | null;
}

// ================================ 환자 정보 ================================
export interface Patient extends PatientBase {
  id: number;
  uuid: string;
  hospitalId: number;
  loginId: string | null;
  password: string | null;
  rrnView: string | null;
  rrnHash: string | null;
  lastEncounterDate: Date | null;
  nextAppointmentDateTime: Date | null;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  consent: Consent | null;
  vitalSignMeasurements: VitalSignMeasurement[];
  fatherRrn: string;
  identityVerifiedAt: Date | null;
  identityOptional?: boolean | null;
  eligibilityCheck: EligibilityCheck;
}

// ================================ 환자 차트 ================================
export interface PatientChart extends Patient {
  encounters: Encounter[]; // encounter 목록
}

// ================================ 환자 생성 ================================
export interface CreatePatientRequest extends PatientBase { }
export interface CreatePatientResponse {
  id: number;
  patientNo: number;
}

// ================================ 환자 수정 ================================
export interface UpdatePatientRequest extends Partial<PatientBase> { }
export interface UpdatePatientResponse extends Patient { }

// ================================ 환자 삭제 ================================
export interface DeletePatientRequest { }
export interface DeletePatientResponse {
  id: number;
}

export interface AppointmentPatient {
  id: number;
  name: string;
  rrn: string;
  phone: string;
  birthDate: string;
  gender: string;
  age?: number;
  patientNo: number;
}

export interface Consent {
  privacy: ConsentPrivacyType;
  marketing: boolean;
}

// ================================ 환자 목록(검색) ================================
export interface PatientsListResponse {
  items: Patient[];
  /**
   * 커서 기반 페이지네이션용 커서
   * - 백엔드 구현에 따라 number/string/null 모두 가능
   */
  nextCursor?: number | string | null;
  hasNextPage?: boolean;
  totalCount?: number;
}

// ================================ 환자 목록(검색) Query ================================
export interface PatientsListQueryParams {
  take?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  search?: string;
  cursor?: number | string | null;
  /**
   * 기간 조건(옵션)
   * - API가 지원하는 경우 beginDate/endDate로 전달
   */
  beginDate?: string;
  endDate?: string;
  /**
   * 추가 필터(JSON) / 그룹 등 (옵션)
   */
  filter?: Record<string, any> | string;
  groupId?: number | string;
  /**
   * 만성질환 플래그 (옵션)
   * - 여러 개일 경우 쉼표(,)로 구분: "hypertension,diabetes,highCholesterol"
   */
  chronicFlags?: string;
  [key: string]: any;
}