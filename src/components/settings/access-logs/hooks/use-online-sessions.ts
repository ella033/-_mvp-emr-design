import { useState, useCallback, useEffect } from "react";
import { accessLogsApi } from "../api/access-logs.api";
import type { OnlineUserSession } from "../model";

export const useOnlineSessions = (isActiveTab: boolean) => {
  const [onlineSessions, setOnlineSessions] = useState<OnlineUserSession[]>([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [loggingOutId, setLoggingOutId] = useState<string | null>(null);

  // UI state for confirmation dialog
  const [pendingLogoutSession, setPendingLogoutSession] = useState<OnlineUserSession | null>(null);

  const fetchOnlineSessions = useCallback(
    async (options?: { isCancelled?: () => boolean }) => {
      setIsOnlineLoading(true);
      setOnlineError(null);
      try {
        const data = await accessLogsApi.getOnlineSessions();
        if (options?.isCancelled?.()) return;
        setOnlineSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (options?.isCancelled?.()) return;
        console.error(error);
        setOnlineError(
          "현재 접속 현황을 불러오지 못했어요. 다시 시도해주세요."
        );
        setOnlineSessions([]);
      } finally {
        if (!options?.isCancelled?.()) {
          setIsOnlineLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isActiveTab) return;
    let isCancelled = false;
    void fetchOnlineSessions({ isCancelled: () => isCancelled });
    return () => {
      isCancelled = true;
    };
  }, [isActiveTab, fetchOnlineSessions]);

  const handleLogout = async (sessionId: string) => {
    setLoggingOutId(sessionId);
    try {
      await accessLogsApi.logoutSession(sessionId);
      await fetchOnlineSessions();
    } catch (error) {
      console.error(error);
      setOnlineError("접속 해제에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoggingOutId(null);
    }
  };

  return {
    onlineSessions,
    isOnlineLoading,
    onlineError,
    loggingOutId,
    pendingLogoutSession,
    setPendingLogoutSession,
    fetchOnlineSessions,
    handleLogout
  };
};
