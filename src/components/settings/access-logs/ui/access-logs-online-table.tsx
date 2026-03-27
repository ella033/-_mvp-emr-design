"use client";

import type { OnlineUserSession } from "@/types/user-sessions";
import {
  AccessLogsColumn,
  AccessLogsTable,
  type AccessLogsTableEvent,
} from "./access-logs-table";

type AccessLogsOnlineTableProps = {
  isOnlineLoading: boolean;
  onlineError: string | null;
  onlineSessions: OnlineUserSession[];
  columns: AccessLogsColumn<OnlineUserSession>[];
  onEvent?: (event: AccessLogsTableEvent<OnlineUserSession>) => void;
};

export function AccessLogsOnlineTable({
  isOnlineLoading,
  onlineError,
  onlineSessions,
  columns,
  onEvent,
}: AccessLogsOnlineTableProps) {
  return (
    <AccessLogsTable<OnlineUserSession>
      isLoading={isOnlineLoading}
      error={onlineError}
      rows={onlineSessions}
      columns={columns}
      rowKey={(row) => row.sessionId}
      emptyMessage="현재 접속 중인 세션이 없습니다."
      loadingMessage="현재 접속 현황을 불러오는 중입니다..."
      errorActionLabel="다시 시도"
      onErrorAction={() =>
        onEvent?.({
          type: "action",
          actionId: "retry",
          row: onlineSessions[0] ?? ({} as OnlineUserSession),
        })
      }
      onEvent={onEvent}
    />
  );
}
