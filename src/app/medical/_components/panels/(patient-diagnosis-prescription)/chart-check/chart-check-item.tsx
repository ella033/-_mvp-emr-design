"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { MyButton } from "@/components/yjg/my-button";
import { useEncounterStore } from "@/store/encounter-store";
import type { UnifiedCheckItem } from "@/types/chart-check/chart-check-types";
import { getSeverityLabel } from "@/types/pci/pci-types";
import { ChartCheckDiseaseSection } from "./chart-check-disease-section";
import { ChartCheckOtherSection } from "./chart-check-other-section";
import { ChartCheckGosiSection } from "./chart-check-gosi-section";
import { ChartCheckSelfDetailSection } from "./chart-check-self-detail-section";

interface ChartCheckItemProps {
  item: UnifiedCheckItem;
  encounterDate: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  required:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  recommended:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  optional:
    "bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400",
};

const SOURCE_COLORS: Record<string, string> = {
  pci: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  self: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function ChartCheckItem({
  item,
  encounterDate,
}: ChartCheckItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { removePciCheckResult, removeChartCheckResult, chartCheckResults } =
    useEncounterStore();

  const severityLabel = getSeverityLabel(item.severity);

  const handleSkip = () => {
    if (item.source === "pci" && item.pciItem) {
      removePciCheckResult(item.pciItem.msgid);
    } else if (item.source === "self" && item.selfCheckItem) {
      const idx = chartCheckResults.indexOf(item.selfCheckItem);
      if (idx >= 0) removeChartCheckResult(idx);
    }
  };

  return (
    <div className="border-b border-[var(--border-primary)] last:border-b-0">
      {/* 접힌 상태 - 한 줄 요약 */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronDownIcon
          className={`w-3 h-3 text-[var(--text-secondary)] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        {/* 출처 Badge */}
        <span
          className={`inline-flex items-center justify-center rounded px-1 py-0.5 text-[10px] font-[500] shrink-0 w-[32px] ${
            SOURCE_COLORS[item.source]
          }`}
        >
          {item.source === "pci" ? "PCI" : "자체"}
        </span>
        {/* 구분 Badge */}
        <span
          className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-[500] shrink-0 ${
            SEVERITY_COLORS[item.severity]
          }`}
        >
          {severityLabel}
        </span>
        {/* 항목 */}
        <span className="text-[12px] text-[var(--gray-200)] shrink-0 w-[28px]">
          {item.category}
        </span>
        {/* 청구코드 */}
        <span className="text-[12px] font-mono text-[var(--gray-200)] shrink-0 w-[80px] truncate">
          {item.code}
        </span>
        {/* 명칭 */}
        <span className="text-[12px] text-[var(--gray-200)] shrink-0 max-w-[120px] truncate">
          {item.name}
        </span>
        {/* 내용 */}
        <span className="text-[12px] text-[var(--gray-200)] font-[400] flex-1 truncate">
          {item.message}
        </span>
        {/* 허용 버튼 (로컬 제거만) */}
        <MyButton
          variant="ghost"
          size="xs"
          className="shrink-0 text-[12px] h-5"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
        >
          허용
        </MyButton>
      </div>

      {/* 펼친 상태 - 상세 정보 */}
      {isOpen && (
        <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
          {/* 경고 메시지 */}
          <div className="px-3 py-2 text-[12px] text-[var(--gray-200)]">
            {item.message}
          </div>

          {/* source별 상세 영역 */}
          {item.source === "pci" && item.pciItem && (
            <PciDetailSection
              pciItem={item.pciItem}
              encounterDate={encounterDate}
            />
          )}
          {item.source === "self" && item.selfCheckItem && (
            <ChartCheckSelfDetailSection
              details={item.selfCheckItem.상세내역}
            />
          )}

          {/* 넘어가기 버튼 (로컬 제거만) */}
          <div className="flex justify-end gap-1 px-2 py-1 border-t border-[var(--border-primary)]">
            <MyButton
              variant="ghost"
              size="xs"
              className="text-[12px] h-5"
              onClick={handleSkip}
            >
              넘어가기
            </MyButton>
          </div>
        </div>
      )}
    </div>
  );
}

/** PCI 상세 섹션 - 기존 msgtyp 기반 라우팅 */
function PciDetailSection({
  pciItem,
  encounterDate,
}: {
  pciItem: NonNullable<UnifiedCheckItem["pciItem"]>;
  encounterDate: string;
}) {
  return (
    <>
      {pciItem.pspissno === "P" && pciItem.msgtyp === "S" && (
        <ChartCheckDiseaseSection
          item={pciItem}
          encounterDate={encounterDate}
        />
      )}
      {pciItem.pspissno === "P" && pciItem.msgtyp === "O" && (
        <ChartCheckOtherSection
          item={pciItem}
          encounterDate={encounterDate}
        />
      )}
      {pciItem.pspissno === "P" && pciItem.msgtyp === "G" && (
        <ChartCheckGosiSection item={pciItem} />
      )}
      {pciItem.pspissno === "P" && pciItem.msgtyp === "T" && (
        <div className="px-3 py-2 text-[12px] text-[var(--gray-200)]">
          특정내역 입력이 필요합니다. 특정내역 팝업에서 입력해주세요.
        </div>
      )}
      {pciItem.pspissno === "P" && pciItem.msgtyp === "R" && (
        <div className="px-3 py-2 text-[12px] text-[var(--gray-200)]">
          결과지 또는 소견서가 필요합니다.
        </div>
      )}
    </>
  );
}
