import type { LoginHistoryEntry, OnlineUserSession } from "@/types/user-sessions";

export type QuickRangeKey = "today" | "7d" | "1m" | "3m" | "6m";

export const quickRanges: { key: QuickRangeKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "7d", label: "일주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
];

export type { LoginHistoryEntry, OnlineUserSession };
