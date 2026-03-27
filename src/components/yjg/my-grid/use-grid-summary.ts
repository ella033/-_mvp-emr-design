import { useMemo } from "react";
import type { MyGridHeaderType, MyGridRowType, MyGridCellType } from "./my-grid-type";
import type { SummaryRowConfig, SummaryColumnConfig, MergedCellInfo } from "./my-grid-summary-type";

interface UseGridSummaryProps {
  headers: MyGridHeaderType[];
  data: MyGridRowType[];
  config: SummaryRowConfig;
}

interface UseGridSummaryResult {
  summaryData: Record<string, number | string>;
  mergedCells: MergedCellInfo[];
  getSummaryCells: () => MyGridCellType[];
}

/**
 * Grid Summary Row를 위한 내부 훅
 */
export function useGridSummary({
  headers,
  data,
  config,
}: UseGridSummaryProps): UseGridSummaryResult {
  // 병합 셀 정보 계산
  const mergedCells = useMemo<MergedCellInfo[]>(() => {
    const merged: MergedCellInfo[] = [];

    config.columns.forEach((col) => {
      if (col.mergeStart && col.mergeSpan && col.mergeSpan > 1) {
        merged.push({
          startKey: col.headerKey,
          span: col.mergeSpan,
          label: col.mergeLabel || "",
        });
      }
    });

    return merged;
  }, [config.columns]);

  // Summary 데이터 계산
  const summaryData = useMemo<Record<string, number | string>>(() => {
    const result: Record<string, number | string> = {};

    config.columns.forEach((colConfig) => {
      const header = headers.find((h) => h.key === colConfig.headerKey);
      if (!header) return;

      // 병합된 셀인 경우 (시작점이 아닌)
      const isMergedChild = mergedCells.some((merged) => {
        if (merged.startKey === colConfig.headerKey) return false;
        const startIndex = headers.findIndex((h) => h.key === merged.startKey);
        const currentIndex = headers.findIndex((h) => h.key === colConfig.headerKey);
        return currentIndex > startIndex && currentIndex < startIndex + merged.span;
      });

      if (isMergedChild) {
        result[colConfig.headerKey] = "";
        return;
      }

      // 병합 시작점인 경우
      if (colConfig.mergeStart) {
        result[colConfig.headerKey] = colConfig.mergeLabel || config.label || "합계";
        return;
      }

      // 커스텀 값이 있는 경우
      if (colConfig.customValue !== undefined) {
        result[colConfig.headerKey] = colConfig.customValue;
        return;
      }

      // 집계 타입에 따른 계산
      const values = data
        .map((row) => {
          const cell = row.cells.find((c) => c.headerKey === colConfig.headerKey);
          if (!cell) return null;
          const numValue = parseFloat(String(cell.value));
          return isNaN(numValue) ? null : numValue;
        })
        .filter((v): v is number => v !== null);

      if (values.length === 0) {
        result[colConfig.headerKey] = 0;
        return;
      }

      switch (colConfig.aggregationType) {
        case "sum":
          result[colConfig.headerKey] = values.reduce((a, b) => a + b, 0);
          break;
        case "avg":
          result[colConfig.headerKey] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case "count":
          result[colConfig.headerKey] = values.length;
          break;
        case "min":
          result[colConfig.headerKey] = Math.min(...values);
          break;
        case "max":
          result[colConfig.headerKey] = Math.max(...values);
          break;
        default:
          result[colConfig.headerKey] = values.reduce((a, b) => a + b, 0);
      }
    });

    return result;
  }, [headers, data, config, mergedCells]);

  // Summary 셀 생성 함수
  const getSummaryCells = useMemo(() => {
    return (): MyGridCellType[] => {
      const visibleHeaders = headers.filter((h) => h.visible !== false);

      return visibleHeaders.map((header) => {
        const colConfig = config.columns.find((c) => c.headerKey === header.key);
        const value = summaryData[header.key];

        const isMergedChild = mergedCells.some((merged) => {
          if (merged.startKey === header.key) return false;
          const startIndex = visibleHeaders.findIndex((h) => h.key === merged.startKey);
          const currentIndex = visibleHeaders.findIndex((h) => h.key === header.key);
          return currentIndex > startIndex && currentIndex < startIndex + merged.span;
        });

        const cell: MyGridCellType = {
          headerKey: header.key,
          value: isMergedChild ? null : (value ?? ""),
          inputType: colConfig?.mergeStart ? "text" : (colConfig?.aggregationType ? "textNumber" : "text"),
          textNumberOption: colConfig?.aggregationType
            ? { showComma: true }
            : undefined,
          align: colConfig?.mergeStart
            ? (colConfig.align || "left")
            : (colConfig?.align || "right"),
        };

        return cell;
      });
    };
  }, [headers, summaryData, mergedCells, config.columns]);

  return {
    summaryData,
    mergedCells,
    getSummaryCells,
  };
}

/**
 * textNumber 타입 컬럼들을 자동으로 감지하여 SummaryRowConfig를 생성
 */
export function createAutoSummaryConfig(
  headers: MyGridHeaderType[],
  data: MyGridRowType[],
  options?: {
    aggregationType?: "sum" | "avg" | "count" | "min" | "max";
    labelColumnKey?: string;
    label?: string;
    mergeNonNumericColumns?: boolean;
    align?: "left" | "center" | "right";
  }
): SummaryRowConfig {
  const visibleHeaders = headers.filter((h) => h.visible !== false);
  const columns: SummaryColumnConfig[] = [];

  const firstRow = data[0];
  if (!firstRow) {
    return { columns, label: options?.label || "합계" };
  }

  let mergeStartIndex = -1;
  let consecutiveNonNumeric = 0;

  visibleHeaders.forEach((header) => {
    const cell = firstRow.cells.find((c) => c.headerKey === header.key);
    const isTextNumber = cell?.inputType === "textNumber";

    if (isTextNumber) {
      if (options?.mergeNonNumericColumns && consecutiveNonNumeric > 0 && mergeStartIndex >= 0) {
        const mergeConfig = columns[mergeStartIndex];
        if (mergeConfig) {
          mergeConfig.mergeStart = true;
          mergeConfig.mergeSpan = consecutiveNonNumeric;
          mergeConfig.mergeLabel = options?.label || "합계";
          if (options?.align) {
            mergeConfig.align = options.align;
          }
        }
      }

      columns.push({
        headerKey: header.key,
        aggregationType: options?.aggregationType || "sum",
      });

      mergeStartIndex = -1;
      consecutiveNonNumeric = 0;
    } else {
      if (mergeStartIndex === -1) {
        mergeStartIndex = columns.length;
      }
      consecutiveNonNumeric++;

      columns.push({
        headerKey: header.key,
        customValue: "",
      });
    }
  });

  if (options?.mergeNonNumericColumns && consecutiveNonNumeric > 0 && mergeStartIndex >= 0) {
    const mergeConfig = columns[mergeStartIndex];
    if (mergeConfig) {
      mergeConfig.mergeStart = true;
      mergeConfig.mergeSpan = consecutiveNonNumeric;
      mergeConfig.mergeLabel = options?.label || "합계";
      if (options?.align) {
        mergeConfig.align = options.align;
      }
    }
  }

  return {
    columns,
    label: options?.label || "합계",
    labelColumnKey: options?.labelColumnKey,
  };
}