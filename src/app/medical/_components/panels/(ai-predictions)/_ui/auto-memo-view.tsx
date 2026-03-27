"use client";

import React from "react";
import { Loader2, Ear, Stethoscope, BrainCircuit, ClipboardList } from "lucide-react";
import type { AutoMemoViewProps } from "./_contracts/view-props";

export function AutoMemoView({ isLoading, isAggregating, result }: AutoMemoViewProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        자동 메모 생성 중...
      </div>
    );
  }

  if (isAggregating) {
    return (
      <div className="border rounded-md p-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin text-amber-600" />
        AI 메모 생성 중...
      </div>
    );
  }

  if (!result?.soap) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-sm font-semibold text-foreground">자동 메모 (SOAP)</div>
      <div className="border rounded-md p-2 space-y-1.5">
        <div className="space-y-1 text-xs">
          <div className="flex items-start gap-1">
            <Ear size={12} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <span className="font-medium text-red-600">S: </span>
              <span className="text-foreground/80">{result.soap.subjective}</span>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <Stethoscope size={12} className="flex-shrink-0 mt-0.5 text-blue-600" />
            <div>
              <span className="font-medium text-blue-600">O: </span>
              <span className="text-foreground/80">{result.soap.objective}</span>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <BrainCircuit size={12} className="flex-shrink-0 mt-0.5 text-green-600" />
            <div>
              <span className="font-medium text-green-600">A: </span>
              <span className="text-foreground/80">{result.soap.assessment}</span>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <ClipboardList size={12} className="flex-shrink-0 mt-0.5 text-purple-600" />
            <div>
              <span className="font-medium text-purple-600">P: </span>
              <span className="text-foreground/80">{result.soap.plan}</span>
            </div>
          </div>
        </div>

        {result.fullText && (
          <p className="text-[10px] text-muted-foreground border-t pt-1 mt-1">
            {result.fullText}
          </p>
        )}
      </div>
    </div>
  );
}
