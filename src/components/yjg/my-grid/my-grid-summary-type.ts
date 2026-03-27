import type { MyGridHeaderType, MyGridRowType, MyGridCellType } from "./my-grid-type";

// Summary 설정 타입
export interface SummaryColumnConfig {
  headerKey: string;
  aggregationType?: "sum" | "avg" | "count" | "min" | "max" | "custom";
  customValue?: string | number;
  mergeStart?: boolean;
  mergeSpan?: number;
  mergeLabel?: string;
  align?: "left" | "center" | "right";
}

export interface SummaryRowConfig {
  columns: SummaryColumnConfig[];
  label?: string;
  labelColumnKey?: string;
}

// 추가 정보 행 타입
export interface ExcelExportExtraRow {
  type: "inline" | "grid"; // inline: "라벨: 값" 한 줄에, grid: 헤더/값 위아래 분리
  data: { label: string; value: string | number | null }[];
}

// Excel Export 설정 타입
export interface ExcelExportConfig {
  fileName?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  includeSummary?: boolean;
  summaryPosition?: "top" | "bottom"; // top: 헤더 아래에 배치, bottom: 데이터 아래에 배치
  columnWidths?: Record<string, number>;
  extraRows?: ExcelExportExtraRow[]; // 추가 정보 행 (상단에 배치)
}

// CSV Export 설정 타입
export interface CsvExportConfig {
  fileName?: string;
  includeSummary?: boolean;
  summaryPosition?: "top" | "bottom";
}

// PDF Export 설정 타입 (jspdf-autotable 방식)
export interface PdfExportConfig {
  fileName?: string;
  orientation?: "portrait" | "landscape";
  pageSize?: "a4" | "a3" | "letter" | "legal";
  includeSummary?: boolean;
  summaryPosition?: "top" | "bottom";
  // 스타일 옵션
  fontSize?: number;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  summaryBackgroundColor?: string;
  margin?: number; // mm 단위
  // extraRows 지원
  extraRows?: ExcelExportExtraRow[];
  // blob 반환 옵션 (true일 경우 파일 다운로드 대신 blob 반환)
  returnBlob?: boolean;
}

export interface MergedCellInfo {
  startKey: string;
  span: number;
  label: string;
}