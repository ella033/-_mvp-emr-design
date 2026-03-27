"use client";

import { useMemo, useRef, useCallback } from "react";
import { convertUTCtoKST } from "@/lib/date-utils";
import { SettingPageColumn } from "../commons/setting-page-table";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface AccessLogItem {
  id: string;
  executedAt: string;
  menuName?: string; // variant="general"
  encounterId?: string; // variant="medical"
  patients?: { id: number; name: string }[];
  action: string;
  userName?: string;
  ipAddress?: string;
  [key: string]: any;
}

interface AccessLogsTableProps {
  data: AccessLogItem[];
  variant: "general" | "medical";
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalCount: number;
}

export function AccessLogsTable({
  data,
  variant,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  totalCount,
}: AccessLogsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    const cols: SettingPageColumn<AccessLogItem>[] = [
      {
        id: "executedAt",
        header: variant === "medical" ? "진료 일시" : "수행 일시",
        align: "center",
        render: (row) =>
          row.executedAt ? convertUTCtoKST(row.executedAt, "YYYY-MM-DD HH:mm:ss") : "-",
      },
      {
        id: "userName",
        header: "사용자",
        align: "center",
        render: (row) => row.userName || "-",
      },
      {
        id: "ipAddress",
        header: "IP주소",
        align: "center",
        render: (row) => (
          <span className="">{row.ipAddress || "-"}</span>
        ),
      },
    ];

    if (variant === "general") {
      cols.push({
        id: "menuName",
        header: "메뉴명",
        align: "center",
        render: (row) => row.menuName || "-",
      });
    }

    cols.push(
      {
        id: "patientName",
        header: "환자명",
        align: "center",
        render: (row) => {
          let patientName = "-";
          if (row.patients && row.patients.length > 0) {
            const firstPatient = row.patients[0];
            if (row.patients.length === 1 && firstPatient) {
              patientName = firstPatient.name;
            } else if (firstPatient) {
              patientName = `${firstPatient.name} 외 ${row.patients.length - 1}명`;
            }
          }
          return (
            <span
              className=""
              title={row.patients?.map((p) => p.name).join(", ") || patientName}
            >
              {patientName}
            </span>
          );
        },
      },
      {
        id: "action",
        header: "수행 업무",
        align: "center",
        render: (row) => row.action,
      }
    );

    return cols;
  }, [variant]);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    
    // threshold 100px
    if (scrollHeight - scrollTop <= clientHeight + 100) {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle empty data
  if (data.length === 0) {
      return (
        <div className="flex flex-col gap-2 pt-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">
                총 0건 (최신순)
                </span>
            </div>
            <div className="flex h-full flex-col overflow-hidden rounded-[6px] border border-slate-200">
             <div className="flex h-full items-center justify-center text-sm text-slate-500 bg-white">
                조회된 내역이 없습니다.
             </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-2 pt-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-900">
          총 {totalCount}건 (최신순)
        </span>
      </div>

      <div 
        ref={parentRef}
        className="flex h-full flex-col overflow-auto rounded-[6px] bg-white relative"
        onScroll={handleScroll}
      >
         {/* Sticky Header */}
         <div 
            className="sticky top-0 z-20 flex min-w-full w-max bg-[#f4f4f5] text-[13px] font-medium text-slate-700"
         >
            {columns.map((column, index) => (
                <div
                    key={column.id}
                    className={`px-2 h-[28px] flex items-center justify-center ${index === 0 ? "pl-4" : ""} ${
                    index === columns.length - 1 ? "pr-4" : ""
                    } whitespace-nowrap overflow-hidden text-ellipsis`}
                    style={{ 
                        flex: 1,
                    }}
                >
                    {column.header}
                </div>
            ))}
         </div>

         {/* Virtualized Rows container */}
         <div
            className="w-full relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
         >
           {virtualItems.map((virtualRow) => {
             const row = data[virtualRow.index];
             return (
               <div
                 key={row.id}
                 className="absolute top-0 left-0 flex w-full ] hover:bg-slate-50 transition-colors items-center text-[13px] text-slate-700"
                 style={{
                   height: '28px',
                   transform: `translateY(${virtualRow.start}px)`,
                 }}
               >
                 {columns.map((column, colIndex) => (
                   <div
                     key={column.id}
                     className={`px-2 flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis ${colIndex === 0 ? "pl-4" : ""} ${
                       colIndex === columns.length - 1 ? "pr-4" : ""
                     }`}
                     style={{ 
                        flex: 1
                     }}
                   >
                     {column.render(row, { emit: () => {} })}
                   </div>
                 ))}
               </div>
             );
           })}
         </div>

         {isFetchingNextPage && (
            <div className="sticky bottom-0 z-10 flex justify-center p-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
                데이터를 더 불러오는 중...
            </div>
         )}
      </div>
    </div>
  );
}
