/* cSpell:disable */
// ─── PCI 점검 결과 타입 (BE encounter response에서 제공) ───

/** PCI 점검 결과의 개별 항목 (encounter.pciCheckResultData 배열 원소) */
export interface PciCheckResult {
  /** 코드분류 (1:수가, 2:준용수가, 3:보험등재약, etc.) */
  cdclf: string;
  /** 코드상세 (청구코드) */
  cddtl: string;
  /** 점검대상 (E:환자정보, D:상병, P:처방) */
  pspissno: string;
  /** 처방순번 */
  inpseq: number;
  /** 메시지코드 */
  msgid: string;
  /** 점검메시지 */
  msgnm: string;
  /** 메시지분류 (0:필수, 1:권고, 2:선택) */
  msgclf: string;
  /** 메시지유형 (S:상병, O:기타, G:고시, R:결과지, T:특정내역, Q:일투) */
  msgtyp: string;
  /** 메시지정보분류 (ResultInfo 호출 시 msgseq로 사용) */
  msginfclf: string;
  /** 병원코드상세 */
  ifmcddtl: string;
  /** 처방명 */
  cddsp: string;
}

// ─── ResultInfo API 응답 (msgtyp S/O) ───

export interface PciResultInfoItem {
  /** 코드 */
  cd: string;
  /** 국제코드 */
  icd: string;
  /** 명칭 */
  cdnm: string;
}

export interface PciResultInfoResponse {
  results: PciResultInfoItem[];
}

// ─── ResultGosi API 응답 (msgtyp G) ───

export interface PciResultGosiItem {
  /** 코드 */
  cd: string;
  /** 시행일자 */
  dt: string;
  /** 상세내용 */
  dtl: string;
}

export interface PciResultGosiResponse {
  results: PciResultGosiItem[];
}

// ─── FE → BE 요청 DTO (상세 조회용) ───

export interface PciResultInfoBody {
  msgid: string;
  ordymd: string;
  msgseq: string;
  msgtyp: string;
  chkclf: string;
}

export interface PciResultGosiBody {
  msgid: string;
}

// ─── UI 분류 ───

/** 메시지분류 (msgclf) → UI 표시 */
export type CheckSeverity = "required" | "recommended" | "optional";

/** msgclf → CheckSeverity 변환 */
export function toCheckSeverity(msgclf: string): CheckSeverity {
  switch (msgclf) {
    case "0":
      return "required";
    case "1":
      return "recommended";
    case "2":
      return "optional";
    default:
      return "optional";
  }
}

/** CheckSeverity → 한글 라벨 */
export function getSeverityLabel(severity: CheckSeverity): string {
  switch (severity) {
    case "required":
      return "필수";
    case "recommended":
      return "권고";
    case "optional":
      return "선택";
  }
}
