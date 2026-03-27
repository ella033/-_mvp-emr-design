"use client";

import React from "react";
import { AlertTriangle, Sparkles, Loader2, Check } from "lucide-react";
import { TimelineIcon, type TimelineItemType } from "./timeline-icon";
import { cn } from "@/lib/utils";
import type { AiPrescriptionViewProps } from "./_contracts/view-props";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-gray-500 bg-gray-50",
};

export function AiPrescriptionView({
  prescriptionItems,
  warnings,
  summaryText,
  checkedItems,
  isApplying,
  onToggle,
  onApply,
}: AiPrescriptionViewProps) {
  return (
    <div className="space-y-2">
      {summaryText && (
        <p className="text-xs text-foreground/80 leading-relaxed">
          {summaryText}
        </p>
      )}

      {/* 예상 처방 */}
      {prescriptionItems.length > 0 ? (
        <div className="border-[1.5px] border-dashed border-amber-400 bg-amber-50/40 rounded-md p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
              <Sparkles size={12} style={{ animation: "sparkle 2s ease-in-out infinite" }} />
              예상 처방
            </div>
            <button
              type="button"
              className="px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  처방 중...
                </span>
              ) : (
                "이대로 처방하기"
              )}
            </button>
          </div>
          <div className="space-y-1">
            {prescriptionItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onToggle(idx)}
                className="flex items-center gap-1.5 text-xs cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-amber-100/60 transition-colors"
              >
                <TimelineIcon
                  type={item.type as TimelineItemType}
                  size={12}
                />
                <span className="font-medium">{item.name}</span>
                <span
                  className={cn(
                    "px-1 rounded text-[10px]",
                    CONFIDENCE_STYLE[item.confidence] ?? CONFIDENCE_STYLE.low,
                  )}
                >
                  {item.confidence}
                </span>
                <span className="text-muted-foreground text-[10px] truncate flex-1">
                  — {item.reason}
                </span>
                <span
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-colors",
                    checkedItems.has(idx)
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-transparent border-amber-300",
                  )}
                >
                  {checkedItems.has(idx) && <Check size={10} strokeWidth={3} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-[1.5px] border-dashed border-amber-400 bg-amber-50/40 rounded-md p-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 mb-1">
            <Sparkles size={12} />
            예상 처방
          </div>
          <div className="text-xs text-muted-foreground">처방 예측 결과가 없습니다</div>
        </div>
      )}

      {warnings?.length > 0 && (
        <div className="space-y-0.5">
          {warnings.map((warning, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1 text-xs text-red-600"
            >
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
