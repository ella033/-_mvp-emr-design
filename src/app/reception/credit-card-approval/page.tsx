"use client";

import CreditCardApprovalList from "./_components/credit-card-approval-list";
import { useCreditCardApproval } from "@/hooks/registration/page/use-credit-card-approval";

export default function CreditCardApprovalPage() {
  const {
    dateRange,
    setDateRange,
    searchKeyword,
    setSearchKeyword,
    handleSearch,
    handleKeyDown,
    gridHeaders,
    setGridHeaders,
    gridRows,
    filteredData,
    isLoading,
    handleContextMenu,
    handleExportToExcel,
    handleExportPdf,
    gridContainerRef,
  } = useCreditCardApproval();

  return (
    <CreditCardApprovalList
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      searchKeyword={searchKeyword}
      onSearchKeywordChange={setSearchKeyword}
      onSearch={handleSearch}
      onKeyDown={handleKeyDown}
      gridHeaders={gridHeaders}
      setGridHeaders={setGridHeaders}
      gridRows={gridRows}
      totalCount={filteredData.length}
      isLoading={isLoading}
      onContextMenu={handleContextMenu}
      onExportToExcel={handleExportToExcel}
      onExportPdf={handleExportPdf}
      gridContainerRef={gridContainerRef}
    />
  );
}
