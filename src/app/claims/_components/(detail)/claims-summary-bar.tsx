"use client";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ClaimsSummaryBarProps {
  summary: {
    year: string;
    month: string;
    insuranceType: string;
    treatmentType: string;
    claimClassification: string;
    claimCount: string;
    totalMedicalBenefitAmount1: string;
    claimAmount: string;
    patientCoPayment: string;
  };
  onBackAction: () => void;
  onDetailAction: () => void;
}

export default function ClaimsSummaryBar({
  summary,
  onBackAction,
  onDetailAction,
}: ClaimsSummaryBarProps) {
  return (
    <div className="bg-[var(--bg-base1)] border-b border-[var(--border-1)] px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackAction}
            className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[var(--gray-300)] hover:bg-[var(--bg-1)]"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-semibold leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
            {summary.year}년 {summary.month}월
          </span>
          <span className="rounded-[4px] bg-[var(--bg-2)] px-2 py-[2px] text-[11px] text-[var(--gray-200)]">
            {summary.insuranceType}
          </span>
          <span className="rounded-[4px] bg-[var(--bg-2)] px-2 py-[2px] text-[11px] text-[var(--gray-200)]">
            {summary.treatmentType}
          </span>
          <span className="rounded-[4px] bg-[var(--bg-2)] px-2 py-[2px] text-[11px] text-[var(--gray-200)]">
            {summary.claimClassification}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-y-1 text-[12px] text-[var(--gray-300)]">
          <Image src="/icon/ic_line_medical_report.svg" alt="" width={16} height={16} className="mr-1.5" />
          <span>총 건수: <strong className="text-[var(--gray-100)]">{summary.claimCount}건</strong></span>
          <span className="mx-2 text-[var(--border-1)]">|</span>
          <span>요양급여비용총액: <strong className="text-[var(--gray-100)]">{summary.totalMedicalBenefitAmount1}원</strong></span>
          <span className="mx-2 text-[var(--border-1)]">|</span>
          <span>청구액: <strong className="text-[var(--gray-100)]">{summary.claimAmount}원</strong></span>
          <span className="mx-2 text-[var(--border-1)]">|</span>
          <span>본인부담금: <strong className="text-[var(--gray-100)]">{summary.patientCoPayment}원</strong></span>
          <span className="mx-2 text-[var(--border-1)]">|</span>
          <Button variant="outline" size="sm" className="ml-1 h-6 rounded-[4px] px-2 text-[11px]" onClick={onDetailAction}>
            상세보기
          </Button>
        </div>
      </div>
    </div>
  );
}
