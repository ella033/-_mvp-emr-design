"use client";

import type { LoginHistoryEntry } from "@/types/user-sessions";
import {
  AccessLogsColumn,
  AccessLogsTable,
  type AccessLogsTableEvent,
} from "./access-logs-table";

type AccessLogsHistoryTableProps = {
  isLoading: boolean;
  fetchError: string | null;
  filteredLogs: LoginHistoryEntry[];
  onResetToday: () => void;
  columns: AccessLogsColumn<LoginHistoryEntry>[];
  onEvent?: (event: AccessLogsTableEvent<LoginHistoryEntry>) => void;
};

export function AccessLogsHistoryTable({
  isLoading,
  fetchError,
  filteredLogs,
  onResetToday,
  columns,
  onEvent,
}: AccessLogsHistoryTableProps) {
  return (
    <AccessLogsTable<LoginHistoryEntry>
      isLoading={isLoading}
      error={fetchError}
      rows={filteredLogs}
      columns={columns}
      rowKey={(row) => `${row.createdAt}-${row.ipAddress}-${row.userName}`}
      emptyMessage="조건에 맞는 접속 기록이 없습니다."
      loadingMessage="접속 기록을 불러오는 중입니다..."
      errorActionLabel="오늘 날짜로 다시 시도"
      onErrorAction={onResetToday}
      onEvent={onEvent}
    />
  );
}
