"use client";

import DailyReceiptList from "./_components/daily-receipt-list";
import { useDailyReceipt } from "@/hooks/registration/page/use-daily-receipt";

export default function DailyReceiptPage() {
  const {
    selectedDate,
    setSelectedDate,
    gridHeaders,
    setGridHeaders,
    gridRows,
    totalCount,
    isLoading,
    summaryStats,
    summaryConfig,
    onSummaryCalculated,
    handleExportToExcel,
    handleExportPdf,
    gridContainerRef,
  } = useDailyReceipt();

  return (
    <DailyReceiptList
      selectedDate={selectedDate}
      onSelectedDateChange={setSelectedDate}
      gridHeaders={gridHeaders}
      setGridHeaders={setGridHeaders}
      gridRows={gridRows}
      totalCount={totalCount}
      isLoading={isLoading}
      summaryStats={summaryStats}
      summaryConfig={summaryConfig}
      onSummaryCalculated={onSummaryCalculated}
      onExportToExcel={handleExportToExcel}
      onExportPdf={handleExportPdf}
      gridContainerRef={gridContainerRef}
    />
  );
}

