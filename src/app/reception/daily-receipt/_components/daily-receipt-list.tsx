"use client";

import { CalendarIcon } from "lucide-react";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,

} from "@/components/yjg/my-grid/my-grid-type";
import type { SummaryRowConfig } from "@/components/yjg/my-grid/my-grid-summary-type";
import { Input } from "@/components/ui/input";
import MyGridSummaryRow from "@/components/yjg/my-grid/my-grid-summary-row";
import { PdfExportMode } from "@/constants/common/common-enum";

type SummaryStat = {
  label: string;
  value: number;
  isCritical?: boolean;
};

type DailyReceiptListProps = {
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  gridHeaders: MyGridHeaderType[];
  setGridHeaders: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  gridRows: MyGridRowType[];
  totalCount: number;
  isLoading: boolean;
  summaryStats: SummaryStat[];
  summaryConfig: SummaryRowConfig;
  onSummaryCalculated: (data: Record<string, number | string>) => void;
  onExportToExcel: () => void;
  onExportPdf: (mode: PdfExportMode) => void;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
};

export default function DailyReceiptList({
  selectedDate,
  onSelectedDateChange,
  gridHeaders,
  setGridHeaders,
  gridRows,
  totalCount,
  isLoading,
  summaryStats,
  summaryConfig,
  onSummaryCalculated,
  onExportToExcel,
  onExportPdf,
  gridContainerRef,
}: DailyReceiptListProps) {
  return (
    <div
      className="flex w-full h-full flex-col gap-2 px-2 py-2"
      data-testid="daily-receipt-page"
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--fg-main)]">
          일별 수납 내역
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            style={{ backgroundColor: "var(--bg-main)" }}
            className="rounded border border-[var(--border-2)] px-4 py-1 text-sm font-semibold text-[var(--fg-main)]"
            onClick={onExportToExcel}
          >
            엑셀
          </button>
          <button
            type="button"
            style={{
              backgroundColor: "var(--main-color)",
              color: "var(--fg-invert)",
            }}
            className="rounded px-4 py-1 text-sm font-semibold"
            onClick={() => onExportPdf(PdfExportMode.PREVIEW)}
          >
            출력
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-2 bg-[var(--bg-main)] pb-2 pt-2 pl-1 pr-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="date"
                data-testid="daily-receipt-date-input"
                value={selectedDate}
                onChange={(e) => onSelectedDateChange(e.target.value)}
                className="h-7 w-[110px] pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3 text-sm text-[var(--fg-main)]">
            {summaryStats.map((stat, index) => (
              <span
                key={stat.label}
                className="flex items-center gap-1 text-[var(--gray-400)]"
              >
                <span>{stat.label}</span>
                <strong
                  className="font-semibold"
                  style={
                    stat.isCritical ? { color: "var(--negative)" } : undefined
                  }
                >
                  {stat.value}명
                </strong>
                {index !== summaryStats.length - 1 && (
                  <span className="text-[var(--gray-200)]">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={gridContainerRef}
        className="flex flex-1 flex-col overflow-hidden rounded border border-[var(--border-2)]"
      >
        <div className="flex-1 min-h-0">
          <MyGrid
            testId="daily-receipt-grid"
            headers={gridHeaders}
            onHeadersChange={setGridHeaders}
            data={gridRows}
            totalCount={totalCount}
            isLoading={isLoading}
            actionRowBottom={
              gridRows.length > 0 ? (
                <MyGridSummaryRow
                  headers={gridHeaders}
                  data={gridRows}
                  config={summaryConfig}
                  onSummaryCalculated={onSummaryCalculated}
                />
              ) : null
            }
          />
        </div>
      </section>
    </div>
  );
}
