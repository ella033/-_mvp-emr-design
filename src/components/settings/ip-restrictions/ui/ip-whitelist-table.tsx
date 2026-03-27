"use client";

import { useMemo } from "react";

import type { IpWhitelistEntry } from "@/types/ip-restrictions";
import {
  SettingPageTable,
  type SettingPageColumn,
} from "../../commons/setting-page-table";

type IpWhitelistTableProps = {
  rows: IpWhitelistEntry[];
  isLoading: boolean;
  error: string | null;
  allSelected: boolean;
  selectedIds: Set<number>;
  onToggleAll: () => void;
  onToggleRow: (id: number) => void;
  onRetry: () => void;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function IpWhitelistTable({
  rows,
  isLoading,
  error,
  allSelected,
  selectedIds,
  onToggleAll,
  onToggleRow,
  onRetry,
}: IpWhitelistTableProps) {
  const columns = useMemo<SettingPageColumn<IpWhitelistEntry>[]>(
    () => [
      {
        id: "select",
        header: (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900"
            aria-label="전체 선택"
          />
        ),
        width: "64px",
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={(event) => {
              event.stopPropagation();
              onToggleRow(row.id);
            }}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900"
            aria-label={`${row.ipAddress} 선택`}
          />
        ),
      },
      {
        id: "ipAddress",
        header: "IP 주소",
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.ipAddress}</span>
        ),
      },
      {
        id: "memo",
        header: "메모",
        render: (row) => (row.memo && row.memo.trim() !== "" ? row.memo : "-"),
      },
      {
        id: "createdAt",
        header: "등록일시",
        render: (row) => formatDateTime(row.createDateTime),
      },
    ],
    [allSelected, selectedIds, onToggleAll, onToggleRow]
  );

  return (
    <SettingPageTable<IpWhitelistEntry>
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id.toString()}
      emptyMessage="등록된 IP가 없습니다. IP 주소를 등록해 제한을 적용해보세요."
      loadingMessage="허용 IP를 불러오는 중입니다..."
      errorActionLabel="다시 시도"
      onErrorAction={onRetry}
    />
  );
}
