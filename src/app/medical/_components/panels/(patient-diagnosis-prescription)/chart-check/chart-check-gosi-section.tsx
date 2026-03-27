"use client";

import { useEffect } from "react";
import { usePciResultGosi } from "@/hooks/pci/use-pci-check";
import type { PciCheckResult } from "@/types/pci/pci-types";
import { Loader2 } from "lucide-react";

interface ChartCheckGosiSectionProps {
  item: PciCheckResult;
}

export function ChartCheckGosiSection({ item }: ChartCheckGosiSectionProps) {
  const resultGosiMutation = usePciResultGosi();

  useEffect(() => {
    resultGosiMutation.mutate({ msgid: item.msgid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.msgid]);

  if (resultGosiMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
        <span className="ml-1 text-[12px] text-[var(--text-secondary)]">
          고시 정보 조회 중...
        </span>
      </div>
    );
  }

  if (resultGosiMutation.isError) {
    return (
      <div className="px-2 py-1 text-[12px] text-red-500">
        고시 정보 조회에 실패했습니다.
      </div>
    );
  }

  const results = resultGosiMutation.data?.results ?? [];
  if (results.length === 0) {
    return (
      <div className="px-2 py-1 text-[12px] text-[var(--text-secondary)]">
        고시 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border-primary)]">
      <div className="px-2 py-1 text-[13px] text-[var(--gray-400)] font-[500] bg-[var(--bg-tertiary)]">
        고시 및 인정기준
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
              <th className="px-2 py-1 text-left text-[var(--gray-400)] font-[500] w-[80px]">
                코드
              </th>
              <th className="px-2 py-1 text-left text-[var(--gray-400)] font-[500] w-[80px]">
                시행일자
              </th>
              <th className="px-2 py-1 text-left text-[var(--gray-400)] font-[500]">
                상세
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr
                key={`${r.cd}-${idx}`}
                className="border-b border-[var(--border-primary)] last:border-b-0"
              >
                <td className="px-2 py-1 font-mono text-[var(--gray-200)]">
                  {r.cd}
                </td>
                <td className="px-2 py-1 text-[var(--gray-200)]">
                  {r.dt}
                </td>
                <td className="px-2 py-1 text-[var(--gray-200)] whitespace-pre-wrap">
                  {r.dtl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
