"use client";

import { useEncounterStore } from "@/store/encounter-store";
import { ChartCheckItem } from "./chart-check-item";
import { ChartCheckSpecificDetailSection } from "./chart-check-specific-detail-section";
import { NoneSelectedPatient } from "../../../widgets/none-patient";

export default function ChartCheckPanel() {
  const { selectedEncounter, pciCheckResults, clearPciCheckResults } =
    useEncounterStore();

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  const encounterDate = selectedEncounter.encounterDateTime
    ? selectedEncounter.encounterDateTime.replace(/-/g, "").slice(0, 8)
    : "";

  if (pciCheckResults.length === 0) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="text-[12px] text-gray-400">
          점검 결과가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-[var(--text-primary)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0">
        <span className="text-[13px] text-[var(--gray-400)] font-[500]">
          총 {pciCheckResults.length}건
        </span>
        <button
          className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={clearPciCheckResults}
        >
          전체 허용
        </button>
      </div>

      {/* 테이블 헤더 */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[12px] text-[var(--gray-400)] font-[500] shrink-0">
        <span className="w-3" />
        <span className="w-[32px]">구분</span>
        <span className="w-[28px]">항목</span>
        <span className="w-[80px]">청구코드</span>
        <span className="w-[120px]">명칭</span>
        <span className="flex-1">내용</span>
        <span className="w-[32px]" />
      </div>

      {/* 결과 목록 */}
      <div className="flex-1 overflow-y-auto">
        {pciCheckResults.map((item, idx) => (
          <ChartCheckItem
            key={`${item.msgid}-${idx}`}
            item={item}
            encounterDate={encounterDate}
          />
        ))}
      </div>

      {/* 특정내역 섹션 */}
      <div className="shrink-0 border-t border-[var(--border-primary)]">
        <ChartCheckSpecificDetailSection />
      </div>
    </div>
  );
}
