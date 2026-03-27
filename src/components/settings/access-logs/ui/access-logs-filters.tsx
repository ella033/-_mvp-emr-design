"use client";

import { CalendarIcon, Search } from "lucide-react";

type QuickRangeKey = "today" | "7d" | "1m" | "3m" | "6m";

type AccessLogsFiltersProps = {
  from: string;
  to: string;
  activeRange: QuickRangeKey;
  quickRanges: { key: QuickRangeKey; label: string }[];
  userQuery: string;
  deviceFilter: string;
  deviceOptions: string[];
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  onQuickRange: (key: QuickRangeKey) => void;
  onChangeUserQuery: (value: string) => void;
  onChangeDeviceFilter: (value: string) => void;
};

export function AccessLogsFilters({
  from,
  to,
  activeRange,
  quickRanges,
  userQuery,
  deviceFilter,
  deviceOptions,
  onChangeFrom,
  onChangeTo,
  onQuickRange,
  onChangeUserQuery,
  onChangeDeviceFilter,
}: AccessLogsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-800 shrink-0">
          조회 기간
        </span>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
          <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="date"
            value={from}
            onChange={(event) => onChangeFrom(event.target.value)}
            className="w-36 bg-transparent outline-none"
          />
        </label>
        <span className="text-slate-400">-</span>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
          <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="date"
            value={to}
            onChange={(event) => onChangeTo(event.target.value)}
            className="w-36 bg-transparent outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {quickRanges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => onQuickRange(range.key)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                activeRange === range.key
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-slate-800 shrink-0 ml-4">
          사용자
        </span>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
          <Search className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="search"
            value={userQuery}
            onChange={(event) => onChangeUserQuery(event.target.value)}
            placeholder="이름 또는 사용자 ID 검색"
            className="w-56 bg-transparent outline-none placeholder:text-slate-400"
          />
        </label>
        <select
          value={deviceFilter}
          onChange={(event) => onChangeDeviceFilter(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-inner outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        >
          <option value="all">전체</option>
          {deviceOptions.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
