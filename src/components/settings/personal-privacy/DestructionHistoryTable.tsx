"use client";

import { convertUTCtoKST } from "@/lib/date-utils";

export interface DestructionHistoryItem {
  id: string;
  destroyedAt: string; // 파기 일시
  documentType: string; // 문서 종류
  count: number; // 파기 건수
  reason: string; // 파기 사유
  destroyerName: string; // 담당자
}

interface DestructionHistoryTableProps {
  data: DestructionHistoryItem[];
}

export function DestructionHistoryTable({
  data,
}: DestructionHistoryTableProps) {
  const columns = [
    { id: "destroyedAt", header: "파기 일시" },
    { id: "documentType", header: "문서 종류" },
    { id: "count", header: "파기 건수" },
    { id: "reason", header: "파기 사유" },
    { id: "destroyerName", header: "담당자" },
  ];

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      <div className="flex h-full flex-col overflow-auto rounded-[6px]  bg-white relative">
        {/* Sticky Header */}
        <div 
          className="sticky top-0 z-20 flex min-w-full w-max  bg-[#f4f4f5] text-[13px] font-medium text-slate-700"
          style={{ height: '28px' }}
        >
          {columns.map((column, index) => (
            <div
              key={column.id}
              className={`px-2 flex items-center justify-center ${index === 0 ? "pl-4" : ""} ${
                index === columns.length - 1 ? "pr-4" : ""
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
              조회된 내역이 없습니다.
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className="flex w-full  hover:bg-slate-50 transition-colors items-center text-[13px] text-slate-700"
                style={{ height: '28px' }}
              >
                <div className="px-2 pl-4 flex items-center justify-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-600">
                  {item.destroyedAt ? convertUTCtoKST(item.destroyedAt, "YYYY-MM-DD HH:mm:ss") : '-'}
                </div>
                <div className="px-2 flex items-center justify-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-900">
                  {item.documentType}
                </div>
                <div className="px-2 flex items-center justify-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-red-600 font-bold">
                  {item.count.toLocaleString()}건
                </div>
                <div className="px-2 flex items-center justify-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-700">
                  {item.reason}
                </div>
                <div className="px-2 pr-4 flex items-center justify-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-900">
                  {item.destroyerName}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
