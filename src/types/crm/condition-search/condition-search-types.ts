// CRM 조건 검색 타입 정의

import type { TargetConditionsDto } from "./condition-management-types";

// 조건 검색 요청 DTO는 TargetConditionsDto를 그대로 사용
export type ConditionSearchRequest = TargetConditionsDto;

// 조건 검색 응답 DTO
export interface ConditionSearchResponse {
  items: ConditionSearchPatient[];
  totalCount: number;
}

// 조건 검색 결과 환자 정보
export interface ConditionSearchPatient {
  id: number;
  patientNo?: number | null;
  name: string;
  birthDate: string;
  gender: number;
  phone1: string;
  lastEncounterDate?: string;
}
