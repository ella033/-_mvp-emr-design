/* cSpell:disable */
import type { PciCheckResult } from "@/types/pci/pci-types";
import {
  type CheckSeverity,
  toCheckSeverity,
} from "@/types/pci/pci-types";

// ─── 자체점검 결과 타입 (encounter.chartCheckResultData) ───

/** 자체점검 개별 점검상세 항목 */
export interface SelfCheckDetail {
  /** 구분 (예: "차트점검.상병", "차트점검.처방", "차트점검.특정내역", "차트점검.기타") */
  구분: string;
  /** 점검 이름 (예: "법정감염병점검", "용량0점검") */
  점검: string;
  /** 설명 메시지 */
  설명: string;
  /** 인라인 상세 데이터 (PCI와 달리 API 호출 없이 포함됨) */
  상세내역: Record<string, unknown>[];
  /** 특정내역코드 (해당하는 경우) */
  특정내역코드?: string;
}

/** encounter.chartCheckResultData 전체 구조 */
export interface SelfCheckResultData {
  점검상세s: SelfCheckDetail[];
}

// ─── 통합 점검 항목 (PCI + 자체) ───

/** PCI와 자체점검을 하나의 리스트로 표시하기 위한 통합 타입 */
export interface UnifiedCheckItem {
  /** 점검 출처 */
  source: "pci" | "self";
  /** 고유 식별자 */
  id: string;
  /** 구분 badge (필수/권고/선택) */
  severity: CheckSeverity;
  /** 항목 (환자/상병/처방/특정내역/기타) */
  category: string;
  /** 청구코드 */
  code: string;
  /** 명칭 */
  name: string;
  /** 내용 */
  message: string;
  /** PCI 원본 데이터 (상세 조회 API 호출용) */
  pciItem?: PciCheckResult;
  /** 자체점검 원본 데이터 (인라인 상세내역 포함) */
  selfCheckItem?: SelfCheckDetail;
}

// ─── 변환 함수 ───

/** "차트점검.상병" → "상병" 추출 */
function parseSelfCheckCategory(구분: string): string {
  const dotIndex = 구분.indexOf(".");
  return dotIndex >= 0 ? 구분.slice(dotIndex + 1) : 구분;
}

/** PCI 점검대상(pspissno) → 한글 라벨 */
function pciCategoryLabel(pspissno: string): string {
  switch (pspissno) {
    case "E":
      return "환자";
    case "D":
      return "상병";
    case "P":
      return "처방";
    default:
      return pspissno;
  }
}

/** PCI 항목 → 통합 타입 변환 */
export function pciToUnified(
  item: PciCheckResult,
  idx: number,
): UnifiedCheckItem {
  return {
    source: "pci",
    id: `pci-${item.msgid}-${idx}`,
    severity: toCheckSeverity(item.msgclf),
    category: pciCategoryLabel(item.pspissno),
    code: item.cddtl || "-",
    name: item.cddsp || "-",
    message: item.msgnm,
    pciItem: item,
  };
}

/** 자체점검 항목 → 통합 타입 변환 */
export function selfCheckToUnified(
  item: SelfCheckDetail,
  idx: number,
): UnifiedCheckItem {
  // 상세내역의 첫 항목에서 청구코드 또는 상병코드 추출
  const firstDetail = item.상세내역[0];
  const code =
    (firstDetail?.["청구코드"] as string) ??
    (firstDetail?.["상병코드"] as string) ??
    "-";

  return {
    source: "self",
    id: `self-${idx}`,
    severity: "recommended", // 자체점검은 "권고" 고정 (추후 변경 가능)
    category: parseSelfCheckCategory(item.구분),
    code,
    name: item.점검,
    message: item.설명,
    selfCheckItem: item,
  };
}
