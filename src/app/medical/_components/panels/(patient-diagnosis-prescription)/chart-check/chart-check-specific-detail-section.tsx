"use client";

import { useEncounterStore } from "@/store/encounter-store";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";

export function ChartCheckSpecificDetailSection() {
  const { draftStatementSpecificDetail, setDraftStatementSpecificDetail } =
    useEncounterStore();

  if (draftStatementSpecificDetail.length === 0) {
    return (
      <div className="px-2 py-1 text-[12px] text-[var(--text-secondary)]">
        등록된 특정내역이 없습니다.
      </div>
    );
  }

  const handleRemove = (code: string) => {
    setDraftStatementSpecificDetail(
      draftStatementSpecificDetail.filter(
        (d: SpecificDetail) => d.code !== code
      )
    );
  };

  return (
    <div className="border-t border-[var(--border-primary)]">
      <div className="px-2 py-1 text-[13px] text-[var(--gray-400)] font-[500] bg-[var(--bg-tertiary)]">
        등록된 특정내역
      </div>
      <div className="max-h-[150px] overflow-y-auto">
        {draftStatementSpecificDetail.map((detail: SpecificDetail) => (
          <div
            key={detail.code}
            className="flex items-center gap-2 px-2 py-1 text-[12px] text-[var(--gray-200)] font-[400] border-b border-[var(--border-primary)] last:border-b-0"
          >
            <span className="font-mono shrink-0">
              {detail.code}
            </span>
            <span className="shrink-0">
              {detail.name}
            </span>
            <span className="truncate flex-1">
              {detail.content}
            </span>
            <button
              onClick={() => handleRemove(detail.code)}
              className="shrink-0 text-red-400 hover:text-red-600 text-[12px] px-1"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
