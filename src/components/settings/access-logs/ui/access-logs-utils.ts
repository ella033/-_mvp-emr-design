"use client";

import type { SessionDeviceInfo } from "@/types/user-sessions";

export const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

export const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const buildDeviceLabel = (info?: SessionDeviceInfo | null) => {
  const parts = [info?.device, info?.platform, info?.browser].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "-";
};
