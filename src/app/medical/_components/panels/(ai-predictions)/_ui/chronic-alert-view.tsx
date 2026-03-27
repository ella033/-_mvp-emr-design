"use client";

import React from "react";
import { Loader2, FlaskConical, HeartPulse, Pill, CalendarClock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChronicAlertViewProps } from "./_contracts/view-props";

const SEVERITY_STYLE: Record<string, string> = {
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-blue-600 bg-blue-50 border-blue-200",
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  overdue_exam: { label: "검사 지연", icon: FlaskConical },
  vital_trend: { label: "바이탈 추세", icon: HeartPulse },
  medication_adjust: { label: "약물 조절", icon: Pill },
  follow_up: { label: "추적관찰", icon: CalendarClock },
};

export function ChronicAlertView({ isLoading, isAggregating, result }: ChronicAlertViewProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        만성질환 분석 중...
      </div>
    );
  }

  if (isAggregating) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin text-amber-600" />
        AI 분석 중...
      </div>
    );
  }

  if (!result?.alerts?.length) return null;

  const badge = result.managementScore !== undefined ? (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
        result.managementScore >= 80
          ? "bg-green-100 text-green-700"
          : result.managementScore >= 50
            ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700",
      )}
    >
      관리점수 {result.managementScore}
    </span>
  ) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground">만성질환 관리 알림</div>
        {badge}
      </div>
      <div className="border rounded-md p-2 space-y-1.5">

        {result.summaryText && (
          <p className="text-xs text-foreground/80">{result.summaryText}</p>
        )}

        <div className="space-y-1">
          {result.alerts.slice(0, 5).map((alert, idx) => {
            const catConfig = CATEGORY_CONFIG[alert.category];
            const CatIcon = catConfig?.icon ?? AlertCircle;
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-1.5 text-xs rounded p-1 border",
                  SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.low,
                )}
              >
                <CatIcon size={14} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium opacity-70">
                      {catConfig?.label ?? alert.category}
                    </span>
                  </div>
                  <div className="font-medium">{alert.message}</div>
                  {alert.suggestedAction && (
                    <div className="text-[10px] opacity-80 mt-0.5">
                      → {alert.suggestedAction}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
