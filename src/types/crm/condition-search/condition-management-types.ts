// CRM 조건 관리 타입 정의

// 공통 타입
export type AgeConditionMode = "include" | "exclude";

export interface AgeCondition {
  mode: AgeConditionMode;
  min: number;
  max: number;
}

export interface AppointmentCondition {
  existed: boolean;
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  appointmentTypeIds: number[];
  months?: number;
}

export interface PrescriptionCondition {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  claimCodes: string[];
  months?: number;
}

export interface RecentVisitCondition {
  visited: boolean;
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  months?: number;
}

export interface TargetConditionsDto {
  gender?: "male" | "female";
  birthYear?: "even" | "odd";
  age?: AgeCondition;
  appointmentCondition?: AppointmentCondition;
  prescription?: PrescriptionCondition;
  recentVisit?: RecentVisitCondition;
  patientGroupIds?: number[];
  insuranceTypes?: number[];
}

// 조건 목록 조회 응답
export interface ConditionListResponseDto {
  id: number;
  name: string;
  createdAt: string;
}

// 조건 생성 요청
export interface CreateConditionDto {
  name: string;
  conditions: TargetConditionsDto;
}

// 조건 생성 응답
export interface CreateConditionResponseDto {
  id: number;
}

// 조건 상세 조회 응답
export interface ConditionDetailResponseDto {
  id: number;
  conditions: TargetConditionsDto;
}

// 조건 삭제 응답
export interface DeleteConditionResponseDto {
  id: number;
}
