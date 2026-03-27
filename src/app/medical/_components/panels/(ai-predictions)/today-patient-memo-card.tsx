"use client";

import React from "react";
import { StickyNote } from "lucide-react";
import { useReceptionStore } from "@/store/common/reception-store";

export function TodayPatientMemoCard() {
  const receptionMemo = useReceptionStore(
    (s) => s.currentRegistration?.memo,
  );

  const receptionMemoText = (receptionMemo ?? "").trim();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
        <StickyNote size={14} className="text-amber-500" />
        접수 메모
      </div>
      <div className="border rounded-md p-2 text-xs">
        {receptionMemoText ? (
          <span className="text-foreground">{receptionMemoText}</span>
        ) : (
          <span className="text-muted-foreground">접수메모가 없습니다</span>
        )}
      </div>
    </div>
  );
}
