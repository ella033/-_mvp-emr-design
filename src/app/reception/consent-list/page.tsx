"use client";

import ConsentList from "./_components/consent-list";
import { useConsentList } from "@/hooks/registration/page/use-consent-list";

export default function ConsentListPage() {
  const {
    dateRange,
    setDateRange,
    searchKeyword,
    setSearchKeyword,
    handleSearch,
    handleKeyDown,
    gridHeaders,
    setGridHeaders,
    fittingScreen,
    gridRows,
    totalCount,
    isLoading,
    gridContainerRef,
  } = useConsentList();

  return (
    <ConsentList
      dateRange={dateRange}
      onDateRangeChangeAction={setDateRange}
      searchKeyword={searchKeyword}
      onSearchKeywordChangeAction={setSearchKeyword}
      onSearchAction={handleSearch}
      onKeyDownAction={handleKeyDown}
      gridHeaders={gridHeaders}
      setGridHeadersAction={setGridHeaders}
      fittingScreen={fittingScreen}
      gridRows={gridRows}
      totalCount={totalCount}
      isLoading={isLoading}
      gridContainerRef={gridContainerRef}
    />
  );
}


