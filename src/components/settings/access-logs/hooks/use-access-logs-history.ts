import { useState, useMemo, useEffect } from "react";
import { accessLogsApi } from "../api/access-logs.api";
import type { LoginHistoryEntry, QuickRangeKey } from "../model";
import { formatDateInput } from "../ui/access-logs-utils";

export const useAccessLogsHistory = () => {
  const [from, setFrom] = useState(() => formatDateInput(new Date()));
  const [to, setTo] = useState(() => formatDateInput(new Date()));
  const [activeRange, setActiveRange] = useState<QuickRangeKey>("today");
  const [userQuery, setUserQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [logs, setLogs] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const userIdParam = useMemo(() => {
    const trimmed = userQuery.trim();
    return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
  }, [userQuery]);

  const applyQuickRange = (key: QuickRangeKey) => {
    const now = new Date();
    const start = new Date(now);

    if (key === "7d") {
      start.setDate(now.getDate() - 7);
    } else if (key === "1m") {
      start.setMonth(now.getMonth() - 1);
    } else if (key === "3m") {
      start.setMonth(now.getMonth() - 3);
    } else if (key === "6m") {
      start.setMonth(now.getMonth() - 6);
    }

    setActiveRange(key);
    setFrom(formatDateInput(start));
    setTo(formatDateInput(now));
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchLogs = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await accessLogsApi.getLoginHistory({
          from,
          to,
          userId: userIdParam,
        });
        if (isCancelled) return;
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        if (isCancelled) return;
        console.error(error);
        setFetchError("접속 기록을 불러오지 못했어요. 다시 시도해주세요.");
        setLogs([]);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (from && to) {
      void fetchLogs();
    }

    return () => {
      isCancelled = true;
    };
  }, [from, to, userIdParam]);

  const nameFilter = useMemo(() => userQuery.trim().toLowerCase(), [userQuery]);

  const deviceOptions = useMemo(() => {
    const devices = new Set<string>();
    logs.forEach((log) => {
      if (log.deviceInfo?.device) devices.add(log.deviceInfo.device);
    });
    return Array.from(devices);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const sorted = [...logs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted.filter((log) => {
      const matchesUser =
        !nameFilter ||
        (log.userName || "-").toLowerCase().includes(nameFilter) ||
        log.ipAddress.toLowerCase().includes(nameFilter);
      const matchesDevice =
        deviceFilter === "all" || log.deviceInfo?.device === deviceFilter;
      return matchesUser && matchesDevice;
    });
  }, [deviceFilter, logs, nameFilter]);

  return {
    from, setFrom,
    to, setTo,
    activeRange, setActiveRange,
    userQuery, setUserQuery,
    deviceFilter, setDeviceFilter,
    logs,
    isLoading,
    fetchError,
    applyQuickRange,
    filteredLogs,
    deviceOptions,
    userIdParam
  };
};
