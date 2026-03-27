"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { KstDateRangeCalendarInput } from "@/components/ui/kst-date-range-calendar-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import { StatusBadge } from "@/app/claims/material-report/_components/status-badge";
import type { PreparationReportListItem } from "@/types/claims/preparation-report";

type ReportListPanelProps = {
  reports: PreparationReportListItem[];
  selectedReportId: string | null;
  checkedReportIds: Set<string>;
  startDate: string;
  endDate: string;
  onDateRangeChange: (
    field: "startDate" | "endDate",
    value: string
  ) => void;
  onSelectReport: (reportId: string) => void;
  onToggleReport: (reportId: string, checked: boolean) => void;
  onToggleAllReports: (checked: boolean) => void;
  isLoading: boolean;
};

export default function ReportListPanel({
  reports,
  selectedReportId,
  checkedReportIds,
  startDate,
  endDate,
  onDateRangeChange,
  onSelectReport,
  onToggleReport,
  onToggleAllReports,
  isLoading,
}: ReportListPanelProps) {
  const totalReports = reports.length;
  const checkedCount = checkedReportIds.size;
  const hasReports = totalReports > 0;
  const isAllChecked = hasReports && checkedCount === totalReports;
  const isIndeterminate = hasReports && checkedCount > 0 && !isAllChecked;

  const headerChecked = isAllChecked
    ? true
    : isIndeterminate
      ? "indeterminate"
      : false;

  return (
    <div className="flex h-full w-[420px] flex-col gap-3 border-r border-border bg-white p-3 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-[14px] font-semibold text-[#171719]">
          조회 기간
        </span>
        <KstDateRangeCalendarInput
          startUtcIso={startDate}
          endUtcIso={endDate}
          onChange={(next) => {
            if (next.startUtcIso)
              onDateRangeChange("startDate", next.startUtcIso);
            if (next.endUtcIso)
              onDateRangeChange("endDate", next.endUtcIso);
          }}
          className="gap-2"
          inputClassName="h-8 w-[120px] text-[13px] border-[#DBDCDF] text-[#46474C] focus:ring-1 focus:ring-[#180F38]"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-[6px]">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-[#F4F4F5] hover:bg-[#F4F4F5] h-[28px] border-none">
              <TableHead className="w-[40px] px-[8px]">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={headerChecked}
                    onCheckedChange={(checked) =>
                      onToggleAllReports(Boolean(checked))
                    }
                    disabled={!hasReports}
                    className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[110px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
                작성일자
              </TableHead>
              <TableHead className="w-[120px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
                신청번호
              </TableHead>
              <TableHead className="w-[60px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
                건수
              </TableHead>
              <TableHead className="w-[100px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
                송신상태
              </TableHead>
              <TableHead className="text-[12px] font-semibold text-[#292A2D] text-center px-2">
                메모
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="border-none">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[13px] text-[#989BA2]"
                >
                  목록을 불러오는 중입니다.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && reports.length === 0 && (
              <TableRow className="border-none">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[13px] text-[#989BA2]"
                >
                  작성된 내역서가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {reports.map((report) => {
              const isChecked = checkedReportIds.has(report.id);
              const isSent = report.sendStatus === SendStatus.Sent;

              return (
                <TableRow
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className={cn(
                    "cursor-pointer border-none h-[32px] hover:bg-[#F8F8F9]",
                    "bg-white"
                  )}
                >
                  <TableCell className="px-[8px] py-0">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          onToggleReport(report.id, Boolean(checked));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-0">
                    {report.createdAt}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-0">
                    {report.applicationNumber}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-0">
                    {report.itemCount}건
                  </TableCell>
                  <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-0">
                    <StatusBadge status={isSent ? "sent" : "pending"} />
                  </TableCell>
                  <TableCell className="text-[13px] text-[#46474C] px-2 py-0 truncate max-w-[150px]">
                    {report.memo || ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
