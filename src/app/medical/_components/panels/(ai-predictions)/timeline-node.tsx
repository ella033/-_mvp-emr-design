"use client";

import React, { useState } from "react";
import { TimelineIcon, type TimelineItemType } from "./timeline-icon";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/types/chart/ai-prediction-types";

interface TimelineNodeProps {
  date: string;
  items: TimelineItem[];
  isPrediction?: boolean;
}

export function TimelineNode({ date, items, isPrediction = false }: TimelineNodeProps) {
  const [showPopover, setShowPopover] = useState(false);

  // Format date as YY.MM.DD
  const formattedDate = (() => {
    try {
      const d = new Date(date);
      const yy = String(d.getFullYear()).slice(2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yy}.${mm}.${dd}`;
    } catch {
      return date;
    }
  })();

  return (
    <div
      className="relative flex flex-col items-center min-w-[60px]"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      {/* Date label */}
      <span
        className={cn(
          "text-[10px] mb-1 whitespace-nowrap",
          isPrediction
            ? "text-amber-600 font-semibold"
            : "text-muted-foreground",
        )}
      >
        {isPrediction ? "오늘" : formattedDate}
      </span>

      {/* Node dot */}
      <div
        className={cn(
          "relative w-3 h-3 rounded-full z-10",
          isPrediction
            ? "bg-amber-400 ring-2 ring-amber-200 animate-pulse"
            : "bg-primary",
        )}
      />

      {/* Icons below dot */}
      <div className="flex gap-0.5 mt-1">
        {items.map((item, idx) => (
          <TimelineIcon
            key={`${item.type}-${idx}`}
            type={item.type as TimelineItemType}
            size={12}
          />
        ))}
      </div>

      {/* Hover popover */}
      {showPopover && items.length > 0 && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-popover border rounded-md shadow-md p-2 min-w-[160px] text-xs">
          <div className="font-medium mb-1">
            {isPrediction ? "AI 예측 (오늘)" : formattedDate}
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-1 py-0.5">
              <TimelineIcon
                type={item.type as TimelineItemType}
                size={12}
              />
              <div>
                <span className="text-muted-foreground">
                  {item.count}건
                </span>
                {item.topItems.length > 0 && (
                  <div className="text-[10px] text-muted-foreground/80">
                    {item.topItems.join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
