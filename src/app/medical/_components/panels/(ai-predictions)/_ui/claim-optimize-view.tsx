"use client";

import React from "react";
import { Loader2, OctagonAlert, TriangleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaimOptimizeViewProps } from "./_contracts/view-props";

const SEVERITY_STYLE: Record<string, string> = {
  error: "text-red-600 bg-red-50",
  warning: "text-amber-600 bg-amber-50",
  info: "text-blue-600 bg-blue-50",
};

const SEVERITY_ICON: Record<string, React.ElementType> = {
  error: OctagonAlert,
  warning: TriangleAlert,
  info: Info,
};

export function ClaimOptimizeView({ isLoading, isAggregating, result }: ClaimOptimizeViewProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        청구 분석 중...
      </div>
    );
  }

  if (isAggregating) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin text-amber-600" />
        AI 청구 분석 중...
      </div>
    );
  }

  if (!result?.issues?.length) return null;

  const badge = result.estimatedRisk ? (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
        result.estimatedRisk === "high"
          ? "bg-red-100 text-red-700"
          : result.estimatedRisk === "medium"
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700",
      )}
    >
      위험도 {result.estimatedRisk === "high" ? "높음" : result.estimatedRisk === "medium" ? "중간" : "낮음"}
    </span>
  ) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground">청구 체크</div>
        {badge}
      </div>
      <div className="border rounded-md p-2 space-y-1.5">

        {result.summaryText && (
          <p className="text-xs text-foreground/80">{result.summaryText}</p>
        )}

        <div className="space-y-1">
          {result.issues.slice(0, 5).map((issue, idx) => (
            <div
              key={idx}
              className={cn(
                "text-xs rounded p-1",
                SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE.info,
              )}
            >
              <div className="flex items-center gap-1">
                {(() => {
                  const SevIcon = SEVERITY_ICON[issue.severity] ?? Info;
                  return <SevIcon size={12} className="flex-shrink-0" />;
                })()}
                <span className="font-medium">{issue.message}</span>
              </div>
              {issue.suggestedFix && (
                <div className="text-[10px] opacity-80 mt-0.5 ml-3">
                  → {issue.suggestedFix}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
