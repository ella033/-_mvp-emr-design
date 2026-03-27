"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import InputDateRangeWithMonth from "@/components/ui/input-date-range-with-month";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";

type ConsentListProps = {
  dateRange: { from: string; to: string };
  onDateRangeChangeAction: (range: { from: string; to: string }) => void;
  searchKeyword: string;
  onSearchKeywordChangeAction: (keyword: string) => void;
  onSearchAction: () => void;
  onKeyDownAction: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  gridHeaders: MyGridHeaderType[];
  setGridHeadersAction: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  fittingScreen: boolean;
  gridRows: MyGridRowType[];
  totalCount: number;
  isLoading: boolean;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
};

export default function ConsentList({
  dateRange,
  onDateRangeChangeAction,
  searchKeyword,
  onSearchKeywordChangeAction,
  onSearchAction,
  onKeyDownAction,
  gridHeaders,
  setGridHeadersAction,
  fittingScreen,
  gridRows,
  totalCount,
  isLoading,
  gridContainerRef,
}: ConsentListProps) {
  return (
    <div
      className="flex w-full h-full flex-col gap-2 px-2 py-2"
      data-testid="consent-list-page"
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--fg-main)]">
          동의서 서명내역
        </h2>
      </header>

      <section className="flex flex-col gap-2 bg-[var(--bg-main)] p-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-3 text-sm text-[var(--fg-main)]"
            data-testid="consent-list-date-range"
          >
            <InputDateRangeWithMonth
              fromValue={dateRange.from}
              toValue={dateRange.to}
              onChange={onDateRangeChangeAction}
              className="flex-wrap"
            />
          </div>

          <div className="relative w-[260px]">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-300)] cursor-pointer"
              onClick={onSearchAction}
            />
            <Input
              data-testid="consent-list-search-input"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChangeAction(e.target.value)}
              onKeyDown={onKeyDownAction}
              placeholder="차트번호, 환자명, 동의서명"
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
            testId="consent-list-grid"
            headers={gridHeaders}
            onHeadersChange={setGridHeadersAction}
            data={gridRows}
            totalCount={totalCount}
            isLoading={isLoading}
            isRowSelectByCheckbox
            fittingScreen={fittingScreen}
          />
        </div>
      </section>
    </div>
  );
}

