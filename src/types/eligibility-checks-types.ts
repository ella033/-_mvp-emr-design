import { components } from "@/generated/api/types";

/**
 * EligibilityCheck 타입 정의
 * API 응답 형식에 맞춘 타입
 */
export type EligibilityCheck = {
  id?: string;
  rrnHash?: string;
  /** 공단 원본 데이터 (RawEligibilityCheckResponse 타입) */
  rawData?: Record<string, never> | null;
  /** 파싱된 데이터 (공단 원본 키를 키로 사용, 한글 필드명을 값으로 매핑) */
  parsedData?: components["schemas"]["EligibilityCheckResponseDto"];
  /** 수정된 파싱 데이터 (parsedData 기반 커스텀 데이터) */
  modifiedParsedData?: Record<string, never> | null;
  /** 자격조회 일시 */
  checkDateTime?: string;
  createId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
  deleteId?: number | null;
  deleteDateTime?: string | null;
};

