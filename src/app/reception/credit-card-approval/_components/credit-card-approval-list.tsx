"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import InputDateRangeWithMonth from "@/components/ui/input-date-range-with-month";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { PdfExportMode } from "@/constants/common/common-enum";

type ContextMenuState = {
  x: number;
  y: number;
  visible: boolean;
  row: MyGridRowType | null;
};

type CreditCardApprovalListProps = {
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  searchKeyword: string;
  onSearchKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  gridHeaders: MyGridHeaderType[];
  setGridHeaders: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  gridRows: MyGridRowType[];
  totalCount: number;
  isLoading: boolean;
  onContextMenu: (
    contextMenu: ContextMenuState,
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>,
    selectedRows: Set<MyGridRowType>,
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<MyGridRowType>>>,
    setLastSelectedRow: React.Dispatch<React.SetStateAction<MyGridRowType | null>>
  ) => React.ReactNode;
  onExportToExcel: () => void;
  onExportPdf: (mode: PdfExportMode) => void;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
};

export default function CreditCardApprovalList({
  dateRange,
  onDateRangeChange,
  searchKeyword,
  onSearchKeywordChange,
  onSearch,
  onKeyDown,
  gridHeaders,
  setGridHeaders,
  gridRows,
  totalCount,
  isLoading,
  onContextMenu,
  onExportToExcel,
  onExportPdf,
  gridContainerRef,
}: CreditCardApprovalListProps) {
  return (
    <div
      className="flex w-full h-full flex-col gap-2 px-2 py-2"
      data-testid="credit-card-page"
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--fg-main)]">
          신용카드 승인내역
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

      <section className="flex flex-col gap-2 bg-[var(--bg-main)] p-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-3 text-sm text-[var(--fg-main)]"
            data-testid="credit-card-date-range"
          >
            <InputDateRangeWithMonth
              fromValue={dateRange.from}
              toValue={dateRange.to}
              onChange={onDateRangeChange}
              className="flex-wrap"
            />
          </div>

          <div className="relative w-[260px]">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-300)] cursor-pointer"
              onClick={onSearch}
            />
            <Input
              data-testid="credit-card-search-input"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="차트번호, 환자명, 승인번호"
              className="h-8 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
      </section>

      <section
        ref={gridContainerRef}
        className="flex flex-1 flex-col overflow-hidden rounded border border-[var(--border-2)]"
      >
        <div className="flex-1 min-h-0">
          <MyGrid
            testId="credit-card-grid"
            headers={gridHeaders}
            onHeadersChange={setGridHeaders}
            data={gridRows}
            totalCount={totalCount}
            isLoading={isLoading}
            onContextMenu={onContextMenu}
          />
        </div>
      </section>
    </div>
  );
}
