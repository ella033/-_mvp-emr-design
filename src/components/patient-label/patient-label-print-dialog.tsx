"use client";

/**
 * 환자 라벨 출력 다이얼로그 컴포넌트
 *
 * 출력 매수를 선택하고 환자 라벨을 출력합니다.
 * - local: 라벨 프린터 SDK(bxllabel.js) 출력
 * - api: 프린트 API 호출 후 agent 출력
 */

import { useMemo, useState } from "react";
import { AlertCircleIcon, ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePatientLabelPrint } from "@/hooks/patient-label";
import { formatBirthDateShort } from "@/lib/date-utils";
import { getAgeOrMonth } from "@/lib/patient-utils";
import type { PatientLabelPrintMode } from "@/hooks/patient-label/use-patient-label-print";
import { type Gender, type PrintResult, PRINT_QUANTITY } from "@/lib/label-printer";

interface PatientLabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: {
    chartNumber: string;
    patientName: string;
    age: number;
    gender: Gender;
    birthDate: string; // YYYY-MM-DD
  };
  /** 로컬 출력 시 사용할 SDK Logical Name (기본: Printer1) */
  printerName?: string;
  /** 출력 모드 강제 (기본: agentId 있으면 api, 없으면 local) */
  printMode?: PatientLabelPrintMode;
  agentId?: string;
  onPrintComplete?: (result: PrintResult) => void;
}

export function PatientLabelPrintDialog({
  open,
  onOpenChange,
  patient,
  printerName,
  printMode,
  agentId,
  onPrintComplete,
}: PatientLabelPrintDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const { quantity, canPrint, isPrinting, increase, decrease, labelData, printViaApi } =
    usePatientLabelPrint({
      patient,
      agentId,
      printerName,
      printMode,
    });

  const patientSummary = useMemo(() => {
    const genderText = labelData.gender === "M" ? "남" : "여";
    const birthShort = formatBirthDateShort(labelData.birthDate);
    const ageText = getAgeOrMonth(labelData.birthDate, "en");
    return {
      name: labelData.patientName,
      age: ageText,
      genderText,
      chartNumber: labelData.chartNumber,
      birthShort,
    };
  }, [labelData]);

  const isDecreaseDisabled = isPrinting || quantity <= PRINT_QUANTITY.MIN;
  const isIncreaseDisabled = isPrinting || quantity >= PRINT_QUANTITY.MAX;
  const isPrintDisabled = !canPrint || isPrinting;

  const handlePrintViaApi = async () => {
    setError(null);
    const result = await printViaApi();
    if (result.success) {
      onPrintComplete?.(result);
      onOpenChange(false);
      return;
    }
    setError(result.message);
  };

  const handleClose = () => {
    if (!isPrinting) {
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    if (!isPrinting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="min-w-[560px] max-w-[560px] bg-[var(--gray-white)] gap-0 rounded-[10px] border border-[var(--border-1)] p-0 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] [&>button]:hidden">
        <DialogTitle className="sr-only">환자 라벨 출력</DialogTitle>
        <div className="flex items-center gap-2 border-b border-transparent px-5 py-4">
          <div className="flex-1 text-[15px] font-bold leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            환자 라벨 출력
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--gray-300)] hover:bg-transparent"
            onClick={handleClose}
            disabled={isPrinting}
            aria-label="닫기"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="min-h-[276px] px-5 pb-5">
          <div className="space-y-4">
            {/* 환자 정보 */}
            <div className="flex h-9 items-center gap-1 overflow-hidden rounded-[4px] bg-[var(--bg-1)] px-3 py-2 text-[12px]">
              <span className="whitespace-nowrap text-[14px] font-bold tracking-[-0.14px] text-[var(--gray-100)]">
                {patientSummary.name}
              </span>
              <span className="whitespace-nowrap text-[12px] font-bold tracking-[-0.12px] text-[var(--gray-300)]">
                ({patientSummary.age} {patientSummary.genderText})
              </span>
              <div className="h-4 w-px bg-[var(--border-1)]" />
              <span className="inline-flex items-center justify-center rounded-[4px] bg-[var(--bg-3)] px-1.5 py-0.5 text-[12px] font-medium tracking-[-0.12px] text-[var(--gray-100)]">
                {patientSummary.chartNumber}
              </span>
              <div className="h-4 w-px bg-[var(--border-1)]" />
              <span className="text-[12px] font-medium tracking-[-0.12px] text-[var(--gray-400)]">
                {patientSummary.birthShort}
              </span>
            </div>

            <div className="text-[14px] font-medium tracking-[-0.14px] text-[var(--gray-200)]">
              출력 매수를 선택하세요.
            </div>

            <div className="space-y-3">
              <div className="flex w-[240px] items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-none rounded-l-[5px] border-[var(--border-2)] bg-[var(--gray-white)] text-[var(--gray-300)]"
                  onClick={decrease}
                  disabled={isDecreaseDisabled}
                  aria-label="출력 매수 감소"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="-ml-px -mr-px flex h-8 flex-1 items-center justify-center border border-[var(--border-2)] bg-[var(--gray-white)] text-[13px] font-normal tabular-nums text-[var(--gray-500)]">
                  {quantity}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-none rounded-r-[5px] border-[var(--border-2)] bg-[var(--gray-white)] text-[var(--gray-300)]"
                  onClick={increase}
                  disabled={isIncreaseDisabled}
                  aria-label="출력 매수 증가"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <Button
            variant="outline"
            className="h-9 rounded-[4px] border-[var(--border-2)] bg-[var(--gray-white)] px-6 text-[13px] font-medium tracking-[-0.13px] text-[var(--gray-100)] hover:bg-[var(--bg-base)]"
            onClick={handleClose}
            disabled={isPrinting}
          >
            취소
          </Button>
          <Button
            className="h-9 rounded-[4px] bg-[var(--main-color)] px-6 text-[13px] font-medium tracking-[-0.13px] text-[var(--fg-invert)] hover:bg-[var(--main-color-hover)]"
            onClick={handlePrintViaApi}
            disabled={isPrintDisabled}
          >
            {isPrinting ? "출력 중..." : "출력"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
