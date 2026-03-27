"use client";

import { useEffect } from "react";
import { usePciResultInfo } from "@/hooks/pci/use-pci-check";
import type { PciCheckResult, PciResultInfoItem } from "@/types/pci/pci-types";
import { useEncounterStore } from "@/store/encounter-store";
import { Loader2 } from "lucide-react";

interface ChartCheckDiseaseSectionProps {
  item: PciCheckResult;
  encounterDate: string;
}

export function ChartCheckDiseaseSection({
  item,
  encounterDate,
}: ChartCheckDiseaseSectionProps) {
  const { setNewDiseases } = useEncounterStore();
  const resultInfoMutation = usePciResultInfo();

  useEffect(() => {
    resultInfoMutation.mutate({
      msgid: item.msgid,
      ordymd: encounterDate,
      msgseq: item.msginfclf || "%",
      msgtyp: item.msgtyp,
      chkclf: "20",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.msgid]);

  const handleAddDisease = (infoItem: PciResultInfoItem) => {
    setNewDiseases([
      {
        code: infoItem.cd,
        name: infoItem.cdnm,
      },
    ]);
  };

  if (resultInfoMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
        <span className="ml-1 text-[12px] text-[var(--text-secondary)]">
          관련 상병 조회 중...
        </span>
      </div>
    );
  }

  if (resultInfoMutation.isError) {
    return (
      <div className="px-2 py-1 text-[12px] text-red-500">
        관련 상병 조회에 실패했습니다.
      </div>
    );
  }

  const results = resultInfoMutation.data?.results ?? [];
  if (results.length === 0) {
    return (
      <div className="px-2 py-1 text-[12px] text-[var(--text-secondary)]">
        관련 상병 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border-primary)]">
      <div className="px-2 py-1 text-[13px] text-[var(--gray-400)] font-[500] bg-[var(--bg-tertiary)]">
        관련 상병 (클릭하여 추가)
      </div>
      <div className="max-h-[150px] overflow-y-auto">
        {results.map((r, idx) => (
          <button
            key={`${r.cd}-${idx}`}
            className="w-full text-left px-2 py-1 text-[12px] text-[var(--gray-200)] font-[400] hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] flex gap-2 border-b border-[var(--border-primary)] last:border-b-0"
            onClick={() => handleAddDisease(r)}
          >
            <span className="font-mono shrink-0">
              {r.cd}
            </span>
            <span className="truncate">
              {r.cdnm}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
