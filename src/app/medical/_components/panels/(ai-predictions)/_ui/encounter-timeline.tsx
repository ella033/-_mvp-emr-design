"use client";

import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ICON_CONFIG, ICON_COLOR, type TimelineItemType } from "./timeline-icon";
import type {
  TimelineEntry,
  AiPrediction,
  DiseaseHistoryEntry,
  RankedDisease,
} from "@/types/chart/ai-prediction-types";

interface EncounterTimelineProps {
  timeline: TimelineEntry[];
  aiPrediction?: AiPrediction | null;
  diseaseHistory?: DiseaseHistoryEntry[];
  rankedDiseases?: RankedDisease[];
}

function fmtDate(dateStr: string, showDay = false): string {
  try {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    if (showDay) return `${mm}.${dd}`;
    const yy = String(d.getFullYear()).slice(2);
    return `${yy}.${mm}`;
  } catch {
    return dateStr;
  }
}

type ItemType = TimelineItemType;

interface RowItem {
  name: string;
  type: ItemType;
}

function buildGrid(
  timeline: TimelineEntry[],
  predictionItems: { name: string; type: string }[],
) {
  const today = new Date().toISOString().split("T")[0] as string;

  const occurrences: { name: string; type: ItemType; date: string; predicted: boolean }[] = [];

  for (const entry of timeline) {
    for (const item of entry.items) {
      for (const name of item.topItems) {
        occurrences.push({ name, type: item.type as ItemType, date: entry.date, predicted: false });
      }
    }
  }

  for (const item of predictionItems) {
    occurrences.push({ name: item.name, type: item.type as ItemType, date: today, predicted: true });
  }

  const dateSet = new Set<string>();
  for (const o of occurrences) dateSet.add(o.date);
  const dates = Array.from(dateSet).sort();

  const seenItems = new Map<string, RowItem>();
  for (const o of occurrences) {
    const key = `${o.type}::${o.name}`;
    if (!seenItems.has(key)) seenItems.set(key, { name: o.name, type: o.type });
  }

  const typeOrder: ItemType[] = ["drug", "injection", "exam", "xray", "treatment", "material"];
  const rows = Array.from(seenItems.values()).sort((a, b) =>
    typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type),
  );

  const presenceMap = new Map<string, { predicted: boolean }>();
  for (const o of occurrences) {
    const key = `${o.type}::${o.name}::${o.date}`;
    const existing = presenceMap.get(key);
    if (!existing) {
      presenceMap.set(key, { predicted: o.predicted });
    } else if (!o.predicted) {
      existing.predicted = false;
    }
  }

  // For each row, find first and last date index where it appears
  const rowSpan = new Map<string, { first: number; last: number }>();
  for (const o of occurrences) {
    const rk = `${o.type}::${o.name}`;
    const di = dates.indexOf(o.date);
    const existing = rowSpan.get(rk);
    if (!existing) {
      rowSpan.set(rk, { first: di, last: di });
    } else {
      if (di < existing.first) existing.first = di;
      if (di > existing.last) existing.last = di;
    }
  }

  return { dates, rows, presenceMap, rowSpan, today };
}

const MIN_COL_W = 36; // minimum px per date column

/** Cursor-following tooltip */
function CursorTooltip({ text, x, y }: { text: string; x: number; y: number }) {
  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999] bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md shadow-md whitespace-nowrap animate-in fade-in-0 zoom-in-95"
      style={{ left: x + 12, top: y - 8 }}
    >
      {text}
    </div>,
    document.body,
  );
}

export function EncounterTimeline({
  timeline,
  aiPrediction,
  diseaseHistory,
  rankedDiseases,
}: EncounterTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);

  const filteredTimeline = useMemo(() => {
    if (!selectedDisease) return timeline;
    return timeline
      .filter((entry) => entry.diseases?.includes(selectedDisease))
      .map((entry) => ({
        ...entry,
        items: entry.diseaseItems?.[selectedDisease] ?? entry.items,
      }));
  }, [timeline, selectedDisease]);

  const sortedDiseaseHistory = useMemo(() => {
    if (!diseaseHistory || diseaseHistory.length === 0) return [];
    if (rankedDiseases && rankedDiseases.length > 0) {
      const rankMap = new Map(rankedDiseases.map((d, i) => [d.code, i]));
      return [...diseaseHistory].sort((a, b) => {
        const ra = rankMap.get(a.code) ?? Number.MAX_SAFE_INTEGER;
        const rb = rankMap.get(b.code) ?? Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return b.encounterCount - a.encounterCount;
      });
    }
    return [...diseaseHistory].sort((a, b) => b.encounterCount - a.encounterCount);
  }, [diseaseHistory, rankedDiseases]);

  const predictionItems = useMemo(
    () =>
      aiPrediction?.todayPredictedItems?.map((item) => ({
        name: item.name,
        type: item.type,
      })) ?? [],
    [aiPrediction],
  );

  const { dates, rows, presenceMap, rowSpan, today } = useMemo(
    () => buildGrid(filteredTimeline, predictionItems),
    [filteredTimeline, predictionItems],
  );

  // Measure grid container width with ResizeObserver
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    scrollRef.current = node;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerW(entry.contentRect.width);
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Responsive column width: fill container, but never smaller than MIN_COL_W
  const colW = dates.length > 0
    ? Math.max(MIN_COL_W, Math.floor(containerW / dates.length))
    : MIN_COL_W;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [dates, colW]);

  const handleRowMouseMove = useCallback((e: React.MouseEvent, idx: number, name: string) => {
    setTooltip({ text: name, x: e.clientX, y: e.clientY });
    setHoveredRow(idx);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredRow(null);
  }, []);

  if (rows.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2 text-center">
        진료 이력이 없습니다.
      </div>
    );
  }

  const showDay = dates.length > 0 && dates.length <= 30;
  const ROW_H = 24;
  const gridW = dates.length * colW;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-semibold text-foreground">
        진료 타임라인
      </div>

      {sortedDiseaseHistory.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedDisease(null)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
              selectedDisease === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            전체
          </button>
          {sortedDiseaseHistory.map((d) => (
            <button
              key={d.code}
              onClick={() =>
                setSelectedDisease((prev) => (prev === d.code ? null : d.code))
              }
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] border transition-colors truncate max-w-[160px]",
                selectedDisease === d.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted",
              )}
              title={`${d.code} ${d.name} (${d.encounterCount}회)`}
            >
              {d.code} {d.name}
            </button>
          ))}
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <div className="flex">
          {/* Y-axis: item names (sticky left) */}
          <div className="flex-shrink-0 border-r bg-background z-10">
            <div className="border-b" style={{ height: ROW_H }} />
            {rows.map((row, idx) => {
              const config = ICON_CONFIG[row.type];
              const Icon = config?.icon;
              return (
                <div
                  key={`${row.type}-${row.name}-${idx}`}
                  className="flex items-center gap-1 px-1.5 border-b last:border-b-0 cursor-default transition-colors"
                  style={{
                    height: ROW_H,
                    backgroundColor: hoveredRow === idx ? config?.bgVar : undefined,
                  }}
                  onMouseMove={(e) => handleRowMouseMove(e, idx, row.name)}
                  onMouseLeave={handleRowMouseLeave}
                >
                  {Icon && (
                    <div
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: config?.bgVar }}
                    >
                      <Icon
                        className={cn("flex-shrink-0", ICON_COLOR)}
                        style={{ width: 10, height: 10 }}
                      />
                    </div>
                  )}
                  <span className="text-[10px] text-foreground/80 truncate max-w-[72px]">
                    {row.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scrollable grid area (horizontal only) */}
          <div ref={measureRef} className="overflow-x-auto flex-1">
            <div style={{ width: gridW }}>
              {/* X-axis: date headers */}
              <div className="flex" style={{ height: ROW_H }}>
                {dates.map((date) => (
                  <div
                    key={date}
                    className={cn(
                      "flex items-center justify-center text-[9px] cursor-default",
                      date === today
                        ? "text-amber-600 font-semibold bg-amber-50/50"
                        : "text-muted-foreground",
                    )}
                    style={{ width: colW }}
                    onMouseMove={(e) => setTooltip({ text: date, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {date === today ? (
                      <span className="flex flex-wrap items-center justify-center gap-0.5">
                        <span className="whitespace-nowrap">오늘</span>
                        <span className="text-[7px] text-amber-500 font-normal whitespace-nowrap">(예측)</span>
                      </span>
                    ) : fmtDate(date, showDay)}
                  </div>
                ))}
              </div>

              {/* Grid rows with timeline lines */}
              {rows.map((row, rowIdx) => {
                const config = ICON_CONFIG[row.type];
                const Icon = config?.icon;
                const rk = `${row.type}::${row.name}`;
                const span = rowSpan.get(rk);
                const lineColor = config?.dotColor ?? "#6b7280";
                const hasLine = span != null && span.first < span.last;

                return (
                  <div
                    key={`${row.type}-${row.name}-${rowIdx}`}
                    className="relative flex cursor-default transition-colors"
                    style={{
                      height: ROW_H,
                      backgroundColor: hoveredRow === rowIdx ? config?.bgVar : undefined,
                    }}
                    onMouseMove={(e) => handleRowMouseMove(e, rowIdx, row.name)}
                    onMouseLeave={handleRowMouseLeave}
                  >
                    {/* Timeline connecting line */}
                    {hasLine && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 opacity-30"
                        style={{
                          left: span.first * colW + colW / 2,
                          width: (span.last - span.first) * colW,
                          height: 2,
                          backgroundColor: lineColor,
                        }}
                      />
                    )}

                    {/* Date cells with dots */}
                    {dates.map((date) => {
                      const key = `${row.type}::${row.name}::${date}`;
                      const presence = presenceMap.get(key);
                      const isToday = date === today;

                      return (
                        <div
                          key={date}
                          className={cn(
                            "relative flex items-center justify-center",
                            isToday && !presence && "bg-amber-50/30",
                          )}
                          style={{ width: colW, height: ROW_H }}
                        >
                          {presence && (
                            presence.predicted ? (
                              <div
                                className="relative z-[1] w-4 h-4 rounded-full border-[1.5px] border-dashed border-amber-400 bg-amber-100 animate-pulse flex items-center justify-center"
                              >
                                {Icon && (
                                  <Icon
                                    className={ICON_COLOR}
                                    style={{ width: 8, height: 8 }}
                                  />
                                )}
                              </div>
                            ) : (
                              <div
                                className="relative z-[1] w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center"
                                style={{ backgroundColor: config?.bgVar, borderColor: config?.dotColor }}
                              >
                                {Icon && (
                                  <Icon
                                    className={ICON_COLOR}
                                    style={{ width: 8, height: 8 }}
                                  />
                                )}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cursor-following tooltip */}
      {tooltip && <CursorTooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
