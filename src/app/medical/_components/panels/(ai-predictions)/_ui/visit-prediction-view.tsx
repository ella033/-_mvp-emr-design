"use client";

import React from "react";
import { Loader2, CalendarDays, MessageSquareText, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisitPredictionViewProps } from "./_contracts/view-props";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "text-green-700 bg-green-50",
  medium: "text-amber-700 bg-amber-50",
  low: "text-gray-600 bg-gray-50",
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

export function VisitPredictionView({ isLoading, isAggregating, result }: VisitPredictionViewProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        내원 예측 중...
      </div>
    );
  }

  if (isAggregating) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin text-amber-600" />
        AI 내원 예측 중...
      </div>
    );
  }

  if (!result?.predictedNextVisit) return null;

  const badge = (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          CONFIDENCE_STYLE[result.confidence] ?? CONFIDENCE_STYLE.low,
        )}
      >
        {result.confidence}
      </span>
      {result.suggestAppointment && (
        <span className="text-[10px] text-primary font-medium">
          예약 권장
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground">다음 내원 예측</div>
        {badge}
      </div>
      <div className="border rounded-md p-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs">
          <CalendarDays size={12} className="flex-shrink-0 text-primary" />
          <span className="font-semibold text-foreground">
            {formatDate(result.predictedNextVisit)}
          </span>
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <MessageSquareText size={10} className="flex-shrink-0 mt-0.5" />
          <span>{result.reason}</span>
        </div>

        {result.prescriptionEndDate && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Pill size={10} className="flex-shrink-0" />
            약 소진 예상: {formatDate(result.prescriptionEndDate)}
          </div>
        )}
      </div>
    </div>
  );
}
