"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { VitalSignTrendEntry } from "@/types/chart/ai-prediction-types";

interface VitalTrendChartProps {
  trends: VitalSignTrendEntry[];
}

const LINE_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#16a34a", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

const TREND_ICON: Record<string, string> = {
  increasing: "▲",
  decreasing: "▼",
  stable: "―",
};

const TREND_COLOR: Record<string, string> = {
  increasing: "text-red-500",
  decreasing: "text-blue-500",
  stable: "text-muted-foreground",
};

function fmtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

function fmtDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

export function VitalTrendChart({ trends }: VitalTrendChartProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Display all if none selected, otherwise only the selected one
  const visibleTrends = useMemo(() => {
    if (!selectedCode) return trends;
    return trends.filter((t) => t.itemCode === selectedCode);
  }, [trends, selectedCode]);

  // Build unified chart data: each date is a row, each vital item is a column
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();

    for (const trend of visibleTrends) {
      for (const m of trend.measurements) {
        if (!dateMap.has(m.date)) {
          dateMap.set(m.date, {});
        }
        dateMap.get(m.date)![trend.itemCode] = m.value;
      }
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));
  }, [visibleTrends]);

  if (trends.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border rounded-md shadow-md p-1.5 text-[10px]">
        <div className="font-medium mb-0.5">{fmtDateFull(label)}</div>
        {payload.map((entry: any, idx: number) => {
          const trend = trends.find((t) => t.itemCode === entry.dataKey);
          return (
            <div key={idx} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span>{trend?.itemName ?? entry.dataKey}</span>
              <span className="font-medium">{entry.value}</span>
              {trend?.unit && (
                <span className="text-muted-foreground">{trend.unit}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">
        검사 추이
      </div>

      {/* Item selector chips */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedCode(null)}
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full border transition-colors",
            !selectedCode
              ? "bg-primary text-primary-foreground border-primary"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          전체
        </button>
        {trends.map((t, idx) => (
          <button
            key={t.itemCode}
            onClick={() =>
              setSelectedCode(selectedCode === t.itemCode ? null : t.itemCode)
            }
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full border transition-colors flex items-center gap-0.5",
              selectedCode === t.itemCode
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }}
            />
            {t.itemName}
            {t.latestValue != null && (
              <span className="font-medium">
                {t.latestValue}
              </span>
            )}
            {t.trend && (
              <span className={cn("text-[9px]", TREND_COLOR[t.trend])}>
                {TREND_ICON[t.trend]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="border rounded-md" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -10, bottom: 8 }}
          >
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={9}
              tickFormatter={fmtDate}
              tick={{ fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={9}
              tick={{ fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />

            {visibleTrends.map((trend) => {
              const color = LINE_COLORS[
                trends.findIndex((t) => t.itemCode === trend.itemCode) %
                  LINE_COLORS.length
              ];
              return (
                <Line
                  key={trend.itemCode}
                  type="monotone"
                  dataKey={trend.itemCode}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={{ fill: color, r: 2.5 }}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 1.5 }}
                  isAnimationActive={false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
