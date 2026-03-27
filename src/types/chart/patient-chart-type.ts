import type { Encounter } from "./encounter-types";
import type { ChronicDisease } from "./chronic-disease";
import type {
  보험구분상세,
  청구,
  초재진,
} from "@/constants/common/common-enum";
export interface PatientChartQuery {
  id: number;
  keyword?: string;
  isFavoriteOnly?: boolean;
  receptionType?: number;
  isClaim?: 청구 | null;
  insuranceType?: number;
  orderFilters?: number[];
  /** @description 조회 시작일시 (UTC, ISO 8601: YYYY-MM-DDTHH:mm:ssZ) */
  beginDate?: string;
  /** @description 조회 종료일시 (UTC, ISO 8601: YYYY-MM-DDTHH:mm:ssZ) */
  endDate?: string;
  limit?: number;
  cursor?: number;
}
// 환자 차트 관련 타입 정의

export interface PatientChart {
  id: number;
  uuid: string;
  loginId: string | null;
  password: string | null;
  name: string;
  rrn: string;
  rrnView: string;
  rrnHash: string;
  patientType: number;
  idType: number;
  idNumber: string;
  groupId: number | null;
  birthDate: string;
  gender: number;
  phone1: string;
  phone2: string;
  address1: string;
  address2: string;
  zipcode: string;
  chronicDisease: ChronicDisease;
  createId: number;
  createDateTime: string;
  updateId: number;
  updateDateTime: string;
  isActive: boolean;
  isTemporary: boolean;
  encounters: Encounter[];
  nextCursor: string;
  hasNextPage: boolean;
  totalCount: number;
}

export interface PatientChartFilter {
  insuranceTypes: 보험구분상세[];
  receptionTypes: 초재진[];
  isClaimValues: boolean[];
}
