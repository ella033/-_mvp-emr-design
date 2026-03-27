"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DestructionTableProps {
  data: any[];
  documentType: string;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  patientName: string;
  onPatientNameChange: (value: string) => void;
  onDestruct: () => void;
  onBulkDestruct: () => void;
  isDestructPending?: boolean;
  isBulkDestructPending?: boolean;
  totalCount: number;
}

const CLAIM_COLUMNS = [
  { id: "visitDate", header: "진료일자" },
  { id: "chartNo", header: "차트번호" },
  { id: "patientName", header: "환자명" },
  { id: "receiptNumber", header: "명일련번호" },
  { id: "insuranceType", header: "보험구분" },
  { id: "subscriberName", header: "가입자명" },
  { id: "visitType", header: "진료형태" },
  { id: "claimType", header: "청구구분" },
  { id: "doctorName", header: "진료의" },
  { id: "progress", header: "상태" },
];

const REPORT_COLUMNS = [
  { id: "applicationNumber", header: "신청번호" },
  { id: "writerName", header: "작성자" },
  { id: "writtenAt", header: "작성일" },
  { id: "itemCount", header: "항목수" },
  { id: "memo", header: "메모" },
  { id: "transmissionStatus", header: "전송상태" },
];

function getColumns(documentType: string) {
  if (documentType === "CLAIM") return CLAIM_COLUMNS;
  return REPORT_COLUMNS;
}

export function DestructionTable({
  data,
  documentType,
  selectedIds,
  onSelectChange,
  patientName,
  onPatientNameChange,
  onDestruct,
  onBulkDestruct,
  isDestructPending = false,
  isBulkDestructPending = false,
  totalCount,
}: DestructionTableProps) {
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const dataColumns = getColumns(documentType);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectChange(data.map((item) => item.id));
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedIds, id]);
    } else {
      onSelectChange(selectedIds.filter((sid) => sid !== id));
    }
  };

  return (
    <div className="flex flex-col gap-[12px] pt-0 h-full overflow-hidden">
      <div className="flex items-center justify-between h-[32px]">
        <span className="text-[12px] font-bold text-[#292A2D] px-1">
          총 {totalCount.toLocaleString()}건
        </span>
        <div className="flex items-center gap-4">
          {documentType === "CLAIM" && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#292A2D] whitespace-nowrap">환자명</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="환자 검색"
                  value={patientName}
                  onChange={(e) => onPatientNameChange(e.target.value)}
                  className="h-[32px] w-[240px] pl-8 text-[13px] bg-white border-slate-200 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-[32px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-[12px] px-4 rounded"
              onClick={onBulkDestruct}
              disabled={totalCount === 0 || isBulkDestructPending}
            >
              {isBulkDestructPending ? "처리 중" : "기간 내 전체 파기"}
            </Button>
            <Button
              className="h-[32px] bg-[#1e1b4b] hover:bg-[#1e1b4b]/90 text-white text-[12px] px-4 rounded"
              onClick={onDestruct}
              disabled={selectedIds.length === 0 || isDestructPending}
            >
              {isDestructPending ? "처리 중" : "선택 파기"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col overflow-auto rounded-[6px] bg-white relative">
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-20 flex min-w-full w-max bg-[#f4f4f5] text-[13px] font-medium text-slate-700"
          style={{ height: '28px' }}
        >
          <div
            className="px-2 pl-4 flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ width: '40px', flex: 'none' }}
          >
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
              className="w-4 h-4"
            />
          </div>
          {dataColumns.map((column, index) => (
            <div
              key={column.id}
              className={`px-2 flex items-center justify-center ${
                index === dataColumns.length - 1 ? "pr-4" : ""
              } whitespace-nowrap overflow-hidden text-ellipsis`}
              style={{ flex: 1 }}
            >
              {column.header}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="w-full relative flex-1">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 bg-white min-h-[100px]">
              파기 대상 문서가 없습니다.
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className="flex w-full hover:bg-slate-50 transition-colors items-center text-[13px] text-slate-700"
                style={{ height: '28px' }}
              >
                <div className="px-2 pl-4 flex items-center justify-center" style={{ width: '40px' }}>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                    aria-label={`Select ${item.id}`}
                    className="w-4 h-4"
                  />
                </div>
                {dataColumns.map((column, index) => (
                  <div
                    key={column.id}
                    className={`px-2 flex items-center justify-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                      index === dataColumns.length - 1 ? "pr-4" : ""
                    }`}
                  >
                    {item[column.id] ?? ""}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
