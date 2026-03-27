"use client";

import React from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SymptomDiseaseViewProps } from "./_contracts/view-props";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-gray-500 bg-gray-50",
};

export function SymptomDiseaseView({
  suggestions,
  fallbackDiseases,
  showFallback,
  isPending,
  symptomText,
  checkedItems,
  hasItems,
  animateIcon,
  onToggle,
  onApply,
}: SymptomDiseaseViewProps) {
  return (
    <div className="space-y-1.5">
      <div className="border-[1.5px] border-dashed border-blue-400 bg-blue-50/40 rounded-md p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-700">
            <Sparkles size={12} className={animateIcon ? "animate-[sparkle_3s_ease-in-out_infinite]" : undefined} />
            예상 상병
          </div>
          {hasItems ? (
            <button
              type="button"
              className="px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded transition-colors cursor-pointer"
              onClick={onApply}
            >
              이대로 진단하기
            </button>
          ) : null}
        </div>

        {symptomText && isPending && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            분석 중...
          </div>
        )}

        {/* 증상 입력 시: 실시간 LLM 추천 (상위 5개, 체크박스) */}
        {suggestions?.length ? (
          <div className="space-y-1">
            {suggestions.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                onClick={() => onToggle(idx)}
                className="flex items-center gap-1.5 text-xs cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-blue-100/60 transition-colors"
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
                <span className="text-muted-foreground text-[10px] truncate flex-1">
                  — {item.reason}
                </span>
                <span
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-colors",
                    checkedItems.has(idx)
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-transparent border-blue-300",
                  )}
                >
                  {checkedItems.has(idx) && <Check size={10} strokeWidth={3} />}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* LLM 추천이 없을 때: AI 순위 또는 진료이력 기반 fallback */}
        {showFallback && fallbackDiseases && (
          <div className="space-y-1">
            {fallbackDiseases.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onToggle(idx)}
                className="flex items-center gap-1.5 text-xs cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-blue-100/60 transition-colors"
              >
                <span className="font-medium">{item.code}</span>
                <span>{item.name}</span>
                <span className={cn("px-1 rounded text-[10px]", CONFIDENCE_STYLE.medium)}>
                  이력기반
                </span>
                <span className="flex-1" />
                <span
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-colors",
                    checkedItems.has(idx)
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-transparent border-blue-300",
                  )}
                >
                  {checkedItems.has(idx) && <Check size={10} strokeWidth={3} />}
                </span>
              </div>
            ))}
          </div>
        )}

        {!hasItems && !isPending && (
          <div className="text-xs text-muted-foreground">상병 예측 결과가 없습니다</div>
        )}
      </div>
    </div>
  );
}
