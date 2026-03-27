/**
 * 동의서(Consents) - "리스트 조회" 전용 타입
 *
 * API 예:
 * - GET /api/consents?take=20&sortBy=createDateTime&filter=...
 *
 * 주의:
 * - 예시에 없는 queryParam은 보내지 않아도 됨
 * - filter는 URL 인코딩된 JSON 문자열로 전달되는 케이스가 있어 string도 허용
 */

/** 동의서 리스트 상태 */
export enum ConsentListStatus {
  PENDING = "PENDING", // 서명 대기
  SIGNED = "SIGNED", // 서명 완료
  REVOKED = "REVOKED", // 철회
  VOIDED = "VOIDED", // 무효
}

/** 정렬 방향 */
export type ConsentSortOrder = "asc" | "desc";

/** /consents list 조회 시 filter로 보낼 수 있는 객체(서버에서 JSON string으로 받는 경우가 많음) */
export type ConsentsListFilter = Record<string, unknown>;

/**
 * 동의서 리스트 조회 Query Param
 * - 예시에 없는 값은 보내지 않아도 됨
 */
export interface GetConsentsListParams {
  /** 페이지 커서 */
  cursor?: number;
  /** 페이지 크기 */
  take?: number;
  /** 정렬 기준 (예: createDateTime) */
  sortBy?: string;
  /** 정렬 방향 */
  sortOrder?: ConsentSortOrder;

  /**
   * 필터 (예: {"status":"active"})
   * - 실제 요청에서는 URL 인코딩된 JSON 문자열로 들어오는 케이스가 있어 string도 허용
   */
  filter?: string | ConsentsListFilter;

  /** 환자 ID로 필터링 */
  patientId?: number;

  /** 동의서 상태로 필터링 */
  status?: ConsentListStatus;

  /**
   * 검색어(Like 검색)
   * - 백엔드 스펙에 따라 patientName 등으로 매핑될 수 있음
   */
  search?: string;

  /**
   * 조회 시작/종료일(UTC 기준)
   * - 서버 스펙에 따라 ISO 8601 문자열(예: 2026-02-12T00:00:00.000Z)로 전달
   */
  startDate?: string;
  endDate?: string;
}

/** 동의서 리스트 아이템(Response DTO) */
export interface ConsentListItemDto {
  id: number;
  patientId: number;
  patientName: string;
  patientNo: number;
  patientAge: number;
  patientGender: number;
  patientPhone1: string;
  encounterId: number | null;
  consentTemplateId: number;
  templateTitle: string;
  templateCode: string;
  status: ConsentListStatus;
  templateVersion: number;
  signedAt: string | null;
  /**
   * 서명 데이터(이미지 URL 등)
   * - SIGNED인데 []로 오거나, PENDING/VOIDED 등에서 null로 오는 케이스 존재
   */
  signatureData: string[] | null;
  createDateTime: string;
  updateDateTime: string;
}

/** 동의서 리스트 조회 Response */
export interface ConsentsListResponse {
  items: ConsentListItemDto[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

