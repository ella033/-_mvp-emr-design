/**
 * 백신 라이브러리 간격 타입
 * 1: 개월(Month)
 * 2: 주(Week)
 */
export enum VaccinationIntervalType {
  MONTH = 1,
  WEEK = 2,
}

/**
 * 백신 라이브러리 상세 정보
 */
export interface VaccinationLibraryDetail {
  /** 상세 정보 ID */
  id: number;
  /** 백신 라이브러리 ID */
  vaccinationLibraryId: number;
  /** 백신 단계 (1, 2, 3, ...) */
  step: number;
  /** 간격 타입 (1: 개월, 2: 주) */
  intervalType: VaccinationIntervalType;
  /** 간격 값 */
  intervalValue: number;
}

/**
 * 백신 라이브러리 정보
 */
export interface VaccinationLibrary {
  /** 백신 라이브러리 ID */
  id: number;
  /** 백신 코드 */
  code: string;
  /** 백신 이름 */
  name: string;
  /** 백신 단계 수 */
  stepCount: number;
  /** 백신 상세 정보 배열 */
  details: VaccinationLibraryDetail[];
}
