"use client";

import React from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsultationViewProps } from "./_contracts/view-props";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-gray-500 bg-gray-50",
};

export function ConsultationView({
  items,
  checkedItems,
  isApplying,
  animateIcon,
  onToggle,
  onApply,
}: ConsultationViewProps) {
  const hasItems = items.length > 0;

  return (
    <div className="border-[1.5px] border-dashed border-slate-400 bg-slate-50/40 rounded-md p-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-semibold text-foreground/70">
          <Sparkles size={12} className={animateIcon ? "animate-[sparkle_3s_ease-in-out_infinite]" : undefined} />
          예상 진찰
        </div>
        {hasItems && (
          <button
            type="button"
            className="px-2 py-0.5 text-[10px] font-medium text-foreground/70 bg-muted hover:bg-slate-200 border rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onApply}
            disabled={isApplying}
          >
            {isApplying ? (
              <span className="flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                적용 중...
              </span>
            ) : (
              "이대로 적용하기"
            )}
          </button>
        )}
      </div>
      {hasItems ? (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onToggle(idx)}
              className="flex items-center gap-1.5 text-xs cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-slate-200/60 transition-colors"
            >
              <span className="font-medium">{item.code}</span>
              <span>{item.name}</span>
              <span
                className={cn(
                  "px-1 rounded text-[10px]",
                  CONFIDENCE_STYLE[item.confidence] ?? CONFIDENCE_STYLE.low,
                )}
              >
                {item.confidence}
              </span>
              <span className="flex-1" />
              <span
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-colors",
                  checkedItems.has(idx)
                    ? "bg-slate-500 border-slate-500 text-white"
                    : "bg-transparent border-slate-300",
                )}
              >
                {checkedItems.has(idx) && <Check size={10} strokeWidth={3} />}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">진찰 예측 결과가 없습니다</div>
      )}
    </div>
  );
}
