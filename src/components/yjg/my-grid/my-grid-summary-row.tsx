import React, { useMemo, useEffect } from "react";
import type { MyGridHeaderType, MyGridRowType, MyGridCellType } from "./my-grid-type";
import type { SummaryRowConfig, MergedCellInfo } from "./my-grid-summary-type";
import { useGridSummary } from "./use-grid-summary";
import { cn } from "@/lib/utils";
import { getHeaderDefaultWidth, getStickyStyle } from "./my-grid-util";
import { MyTooltip } from "../my-tooltip";
import { TOOLTIP_CLASS } from "../common/constant/class-constants";

interface MyGridSummaryRowProps {
  headers: MyGridHeaderType[];
  data: MyGridRowType[];
  config: SummaryRowConfig;
  isRowSelectByCheckbox?: boolean;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  className?: string;
  onSummaryCalculated?: (
    summaryData: Record<string, number | string>,
    mergedCells: MergedCellInfo[]
  ) => void;
}

const ROW_HEIGHT_MAP = {
  xs: 24,
  sm: 28,
  default: 32,
  lg: 36,
  xl: 40,
};

export default function MyGridSummaryRow({
  headers,
  data,
  config,
  isRowSelectByCheckbox = false,
  size = "default",
  className,
  onSummaryCalculated,
}: MyGridSummaryRowProps) {
  // 내부에서 훅 호출 - 기존 MyGridRow 패턴과 동일
  const { summaryData, mergedCells, getSummaryCells } = useGridSummary({
    headers,
    data,
    config,
  });

  const summaryCells = useMemo(() => getSummaryCells(), [getSummaryCells]);

  // summaryData, mergedCells 변경 시 외부에 전달 (Excel export 등에서 사용)
  useEffect(() => {
    if (onSummaryCalculated) {
      onSummaryCalculated(summaryData, mergedCells);
    }
  }, [summaryData, mergedCells, onSummaryCalculated]);

  const visibleHeaders = useMemo(
    () => headers.filter((h) => h.visible !== false),
    [headers]
  );

  // 병합된 셀 정보를 빠르게 조회하기 위한 Map
  const mergedCellMap = useMemo(() => {
    const map = new Map<string, { isMerged: boolean; isStart: boolean; span: number; label: string }>();

    mergedCells.forEach((merged) => {
      const startIndex = visibleHeaders.findIndex((h) => h.key === merged.startKey);
      if (startIndex === -1) return;

      for (let i = 0; i < merged.span; i++) {
        const header = visibleHeaders[startIndex + i];
        if (header) {
          map.set(header.key, {
            isMerged: true,
            isStart: i === 0,
            span: merged.span,
            label: merged.label,
          });
        }
      }
    });

    return map;
  }, [visibleHeaders, mergedCells]);

  // 병합 셀의 전체 너비 계산
  const getMergedWidth = (startKey: string, span: number): number => {
    const startIndex = visibleHeaders.findIndex((h) => h.key === startKey);
    if (startIndex === -1) return 0;

    let totalWidth = 0;
    for (let i = 0; i < span; i++) {
      const header = visibleHeaders[startIndex + i];
      if (header) {
        totalWidth += header.width ?? getHeaderDefaultWidth(header.name);
      }
    }
    return totalWidth;
  };

  const rowHeight = ROW_HEIGHT_MAP[size] || ROW_HEIGHT_MAP.default;

  return (
    <div
      className={cn(
        "flex w-full border-t-2 border-[var(--grid-border)]",
        "bg-[var(--grid-header-bg)] font-semibold",
        className
      )}
      style={{ height: `${rowHeight}px`, minWidth: "max-content" }}
    >
      {/* 체크박스 컬럼 공간 확보 */}
      {isRowSelectByCheckbox && (
        <div
          className="flex items-center justify-center bg-[var(--grid-header-bg)]"
          style={{ width: "40px", minWidth: "40px" }}
        />
      )}

      {visibleHeaders.map((header) => {
        const cell = summaryCells.find((c) => c.headerKey === header.key);
        const mergedInfo = mergedCellMap.get(header.key);

        // 병합된 셀이고 시작점이 아니면 렌더링하지 않음
        if (mergedInfo?.isMerged && !mergedInfo.isStart) {
          return null;
        }

        const width = mergedInfo?.isStart
          ? getMergedWidth(header.key, mergedInfo.span)
          : (header.width ?? getHeaderDefaultWidth(header.name));

        const displayValue = mergedInfo?.isStart
          ? mergedInfo.label
          : formatSummaryValue(cell?.value);

        return (
          <SummaryCell
            key={header.key}
            header={header}
            headers={visibleHeaders}
            value={displayValue}
            width={width}
            isMerged={!!mergedInfo?.isStart}
            align={mergedInfo?.isStart ? "center" : (cell?.align || header.align || "right")}
          />
        );
      })}
    </div>
  );
}

interface SummaryCellProps {
  header: MyGridHeaderType;
  headers: MyGridHeaderType[];
  value: string | number | null | undefined;
  width: number;
  isMerged: boolean;
  align: "left" | "center" | "right";
}

function SummaryCell({
  header,
  headers,
  value,
  width,
  isMerged,
  align,
}: SummaryCellProps) {
  const alignClass = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[align];

  const stickyStyle = getStickyStyle(headers, header);

  return (
    <div
      className={cn(
        "flex items-center px-2",
        "bg-[var(--grid-summary-bg)] text-[var(--grid-header-fg)]",
        "border-r border-[var(--grid-border)]",
        alignClass
      )}
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        ...stickyStyle,
      }}
    >
      <MyTooltip
        align="start"
        delayDuration={500}
        content={
          <pre className={TOOLTIP_CLASS}>{String(value ?? "")}</pre>
        }
      >
        <span className="truncate text-[12px]">
          {value ?? ""}
        </span>
      </MyTooltip>
    </div>
  );
}

// 숫자 포맷팅 헬퍼 함수
function formatSummaryValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numValue = typeof value === "number" ? value : parseFloat(String(value));

  if (isNaN(numValue)) {
    return String(value);
  }

  // 소수점 처리 및 천단위 콤마
  const formatted = numValue.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatted;
}