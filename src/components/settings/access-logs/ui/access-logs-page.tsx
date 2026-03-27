"use client";

import { useMemo, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import { AccessLogsTabs } from "./access-logs-tabs";
import { AccessLogsFilters } from "./access-logs-filters";
import { AccessLogsHistoryTable } from "./access-logs-history-table";
import { AccessLogsOnlineTable } from "./access-logs-online-table";
import {
  buildDeviceLabel,
  formatDateInput,
  formatDateTime,
} from "./access-logs-utils";
import type {
  AccessLogsColumn,
  AccessLogsTableEvent,
} from "./access-logs-table";
import MyPopup from "@/components/yjg/my-pop-up";
import { useAccessLogsHistory } from "../hooks/use-access-logs-history";
import { useOnlineSessions } from "../hooks/use-online-sessions";
import { quickRanges } from "../model";
import type { LoginHistoryEntry, OnlineUserSession } from "../model";

export function AccessLogsPage() {
  const [activeTab, setActiveTab] = useState<"history" | "online">("history");

  const {
    from, setFrom,
    to, setTo,
    activeRange, setActiveRange,
    userQuery, setUserQuery,
    deviceFilter, setDeviceFilter,
    isLoading,
    fetchError,
    applyQuickRange,
    filteredLogs,
    deviceOptions,
  } = useAccessLogsHistory();

  const {
    onlineSessions,
    isOnlineLoading,
    onlineError,
    loggingOutId,
    pendingLogoutSession,
    setPendingLogoutSession,
    fetchOnlineSessions,
    handleLogout
  } = useOnlineSessions(activeTab === "online");

  const historyColumns: AccessLogsColumn<LoginHistoryEntry>[] = useMemo(
    () => [
      {
        id: "createdAt",
        header: "접속일시",
        align: "center",
        render: (row) => (
          <span className="inline-flex max-w-full items-center justify-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {formatDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        id: "userName",
        header: "사용자",
        align: "center",
        render: (row) => (
          <span className="inline-flex max-w-full items-center justify-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-slate-600">
            {row.userName}
          </span>
        ),
      },
      {
        id: "ipAddress",
        header: "IP 주소",
        align: "center",
        render: (row) => (
          <span className="inline-flex max-w-full items-center justify-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-slate-900">
            {row.ipAddress}
          </span>
        ),
      },
      {
        id: "device",
        header: "접속기기",
        align: "center",
        render: (row) => (
          <span className="inline-flex max-w-full items-center justify-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-slate-900">
            {buildDeviceLabel(row.deviceInfo)}
          </span>
        ),
      },
    ],
    []
  );

  const onlineColumns: AccessLogsColumn<OnlineUserSession>[] = useMemo(
    () => [
      {
        id: "user",
        header: "사용자",
        align: "center",
        render: (row) => (
          <div className="flex flex-col items-center">
            <span className="font-semibold text-slate-900">{row.userName}</span>
          </div>
        ),
      },
      {
        id: "device",
        header: "접속기기",
        align: "center",
        render: (row) => (
          <span className="inline-flex items-center justify-center">
            {buildDeviceLabel(row.deviceInfo)}
          </span>
        ),
      },
      {
        id: "lastActivity",
        header: "최종 활동",
        align: "center",
        render: (row) => (
          <span className="inline-flex items-center justify-center">
            {formatDateTime(row.loginAt)}
          </span>
        ),
      },
      {
        id: "ip",
        header: "IP",
        align: "center",
        render: (row) => (
          <span className="inline-flex items-center justify-center">
            {row.ipAddress}
          </span>
        ),
      },
      {
        id: "actions",
        header: "관리",
        align: "center",
        render: (row, { emit }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              emit({ type: "action", actionId: "logout", row });
            }}
            disabled={loggingOutId === row.sessionId}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOutId === row.sessionId ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            접속 해제
          </button>
        ),
      },
    ],
    [loggingOutId]
  );

  const handleOnlineEvent = (
    event: AccessLogsTableEvent<OnlineUserSession>
  ) => {
    if (event.type === "action") {
      if (event.actionId === "logout") {
        setPendingLogoutSession(event.row);
      }
      if (event.actionId === "retry") {
        void fetchOnlineSessions();
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]">
      <SettingPageHeader
        title="접속 기록"
        tooltipContent="병원 대표자는 모든 기능에 접근하고 관리할 수 있습니다."
      />
      <section className="flex flex-row lg:flex-row gap-[20px] w-full min-h-[500px] lg:min-h-[600px] flex-1 overflow-hidden">
        <SectionLayout
          className="!pt-[6px]"
          body={
            <>
              <AccessLogsTabs activeTab={activeTab} onChange={setActiveTab} />
              {activeTab === "history" ? (
                <>
                  <AccessLogsFilters
                    from={from}
                    to={to}
                    activeRange={activeRange}
                    quickRanges={quickRanges}
                    userQuery={userQuery}
                    deviceFilter={deviceFilter}
                    deviceOptions={deviceOptions}
                    onChangeFrom={(value) => {
                      setFrom(value);
                      setActiveRange("today");
                    }}
                    onChangeTo={(value) => {
                      setTo(value);
                      setActiveRange("today");
                    }}
                    onQuickRange={applyQuickRange}
                    onChangeUserQuery={setUserQuery}
                    onChangeDeviceFilter={setDeviceFilter}
                  />

                  <div className="flex h-full flex-col overflow-hidden rounded-[6px] border border-slate-200">
                    <div className="relative flex-1 overflow-auto">
                      <AccessLogsHistoryTable
                        isLoading={isLoading}
                        fetchError={fetchError}
                        filteredLogs={filteredLogs}
                        onResetToday={() => {
                          setFrom(formatDateInput(new Date()));
                          setTo(formatDateInput(new Date()));
                          setActiveRange("today");
                        }}
                        columns={historyColumns}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col overflow-hidden rounded-[6px] border border-slate-200">
                  <div className="relative flex-1 overflow-auto">
                    <AccessLogsOnlineTable
                      isOnlineLoading={isOnlineLoading}
                      onlineError={onlineError}
                      onlineSessions={onlineSessions}
                      columns={onlineColumns}
                      onEvent={handleOnlineEvent}
                    />
                  </div>
                </div>
              )}
            </>
          }
        />
      </section>

      <MyPopup
        isOpen={Boolean(pendingLogoutSession)}
        onCloseAction={() => setPendingLogoutSession(null)}
        title="접속 해제 확인"
        width="350px"
        height="250px"
      >
        <div className="flex flex-col gap-4 p-2 text-sm text-slate-800">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-900">
              접속 해제 하시겠어요?
            </span>
            <span className="text-slate-600">
              아래 세션의 접속을 종료합니다.
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">사용자</span>
              <span className="font-semibold text-slate-900">
                {pendingLogoutSession?.userName || "알 수 없음"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">IP</span>
              <span className="font-semibold text-slate-900">
                {pendingLogoutSession?.ipAddress || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">접속기기</span>
              <span className="font-semibold text-slate-900">
                {buildDeviceLabel(pendingLogoutSession?.deviceInfo)}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingLogoutSession(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                if (!pendingLogoutSession) return;
                void handleLogout(pendingLogoutSession.sessionId);
                setPendingLogoutSession(null);
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              확인
            </button>
          </div>
        </div>
      </MyPopup>
    </div>
  );
}
