"use client";

/**
 * 검사 라벨 출력 다이얼로그
 *
 * - 1순위: 모달 열리면 처방된 검사 리스트에서 검체만 뽑아서 표시.
 * - select 옵션: 검체 리스트 API 조회 후 nameEn이 비어있지 않은 것만 사용.
 * - 추가 버튼: 위 select 옵션에서만 선택 가능.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircleIcon, ChevronLeft, ChevronRight, PlusIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExaminationLabelPrint } from "@/hooks/examination-label";
import { formatBirthDateShort } from "@/lib/date-utils";
import { getAgeOrMonth } from "@/lib/patient-utils";
import { LabelContentType, PRINT_QUANTITY } from "@/lib/label-printer";
import type { PatientInfo, PrintResult, Specimen, SpecimenPrintItem } from "@/lib/label-printer";
import { MOCK_SPECIMEN_LIBRARIES } from "@/mocks/examination-label";
import { LabOrdersService } from "@/services/lab-orders-service";
import type { SpecimenLibrary } from "@/types/specimen-libraries-type";

interface ExaminationLabelPrintDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 환자 정보(외부에서 주입) */
  patient?: PatientInfo | null;
  /** 환자 ID (당일 수탁검사 검체 기본 선택 시 사용) */
  patientId?: number;
  /** 검사 조회 기준일 (YYYY-MM-DD 등). 없으면 당일 */
  date?: string;
  /** 진료 ID */
  encounterId: string;
  /** 프린터 이름 */
  printerName?: string;
  /** 출력 모드 (기본값: local) */
  printMode?: "local" | "api";
  /** 프린트 작업을 수행할 에이전트 ID (선택) */
  agentId?: string;
  /** 출력 완료 콜백 */
  onPrintComplete?: (result: PrintResult) => void;
}

interface DraftRow {
  id: string;
  quantity: number;
}

type SpecimenRow =
  | {
    key: string;
    kind: "selected";
    specimenCode: string;
    quantity: number;
    canRemove: boolean;
  }
  | {
    key: string;
    kind: "draft";
    draftRowId: string;
    quantity: number;
    canRemove: boolean;
  };

const EMPTY_PRINT_ITEMS: SpecimenPrintItem[] = [];

/** 서비스에서 넘긴 검체 코드 목록(중복 제거됨)에서 코드 배열 반환. */
function collectSpecimenCodesFromOrders(
  orders: Array<{ exams?: Array<{ scodes?: string[] | null }> }>
): string[] {
  const codes = new Set<string>();
  for (const order of orders) {
    for (const exam of order.exams ?? []) {
      for (const code of exam.scodes ?? []) {
        if (code != null && String(code).trim() !== "") codes.add(String(code).trim());
      }
    }
  }
  return Array.from(codes);
}

export function ExaminationLabelPrintDialog({
  open,
  onOpenChange,
  patient: patientOverride,
  patientId,
  date,
  encounterId,
  printerName,
  printMode = "local",
  agentId,
  onPrintComplete,
}: ExaminationLabelPrintDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [specimenOptions, setSpecimenOptions] = useState<Specimen[]>([]);
  const [specimenOptionsLoading, setSpecimenOptionsLoading] = useState(false);

  const {
    patient,
    printItems,
    isLoading,
    isPrinting,
    canPrintApi,
    updateQuantity,
    addSpecimen,
    removeSpecimen,
    setPrintItems,
    printViaApi,
  } = useExaminationLabelPrint({
    encounterId,
    patientOverride: patientOverride ?? undefined,
    initialPrintItems: EMPTY_PRINT_ITEMS,
    printerName,
    printMode,
    apiOptions: {
      agentId,
      contentType: LabelContentType.IMAGE_PNG,
    },
  });

  // 모달 열릴 때: 1순위 처방된 검사에서 검체만 뽑아서 보여줌. select 옵션은 검체 리스트 중 nameEn 비어있지 않은 것만.
  useEffect(
    function fetchPrescribedFirstThenSpecimenOptions() {
      if (!open) return;

      setError(null);
      setPrintItems([]);
      setSpecimenOptionsLoading(true);

      const loadPrescribed = (fullList: SpecimenLibrary[]) => {
        if (patientId == null) {
          setPrintItems([]);
          return Promise.resolve();
        }
        return LabOrdersService.getExternalLabOrdersByPatientAndDate(
          patientId,
          date
        ).then((orders) => {
          const specimenCodes = collectSpecimenCodesFromOrders(orders);
          const prescribedItems: SpecimenPrintItem[] = [];
          for (const code of specimenCodes) {
            const item = fullList.find((s) => s.code === code);
            if (item) {
              prescribedItems.push({
                specimenCode: item.code,
                specimenName: item.name,
                quantity: PRINT_QUANTITY.DEFAULT,
              });
            }
          }
          setPrintItems(prescribedItems);
        });
      };

      Promise.resolve(MOCK_SPECIMEN_LIBRARIES)
        .then((list) => {
          // select 옵션: 영어이름(nameEn)이 빈문자 아닌 것만. 하나도 없으면 전체 사용
          const withNameEn = list
            .filter((item) => (item.nameEn ?? "").trim() !== "")
            .map((item) => ({ specimenCode: item.code, specimenName: item.name }));
          setSpecimenOptions(withNameEn.length > 0 ? withNameEn : list.map((item) => ({ specimenCode: item.code, specimenName: item.name })));

          // 1순위: 처방된 검사 리스트에서 검체만 뽑아서 표시 (전체 리스트로 code→name 매핑)
          return loadPrescribed(list);
        })
        .catch(() => {
          setSpecimenOptions([]);
        })
        .finally(() => {
          setSpecimenOptionsLoading(false);
        });
    },
    [open, patientId, date, setPrintItems]
  );

  // 선택 가능한 검체(이미 추가된 검체 제외)
  const availableSpecimens = useMemo(() => {
    const selectedCodes = new Set(printItems.map((s) => s.specimenCode));
    return specimenOptions.filter((s) => !selectedCodes.has(s.specimenCode));
  }, [printItems, specimenOptions]);

  const rows = useMemo<SpecimenRow[]>(() => {
    const selectedRows: SpecimenRow[] = printItems.map((item, index) => ({
      key: `selected_${item.specimenCode}`,
      kind: "selected",
      specimenCode: item.specimenCode,
      quantity: item.quantity,
      canRemove: index > 0,
    }));

    const draftRowItems: SpecimenRow[] = draftRows.map((row, draftIndex) => ({
      key: `draft_${row.id}`,
      kind: "draft",
      draftRowId: row.id,
      quantity: row.quantity,
      canRemove: printItems.length + draftIndex > 0,
    }));

    return [...selectedRows, ...draftRowItems];
  }, [draftRows, printItems]);

  const selectedCodes = useMemo(
    () => new Set(printItems.map((item) => item.specimenCode)),
    [printItems]
  );

  // 모달 닫을 때 draft 행 초기화
  useEffect(
    function clearDraftRowsOnClose() {
      if (!open) setDraftRows([]);
    },
    [open]
  );

  const handlePrintViaApi = async () => {
    setError(null);
    const result = await printViaApi();

    if (result.success) {
      onPrintComplete?.(result);
      onOpenChange(false);
    } else {
      setError(result.message);
    }
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

  const patientSummary = useMemo(() => {
    if (!patient) {
      return null;
    }
    const genderText = formatGenderText(patient.gender);
    const birthShort = formatBirthDateShort(patient.birthDate);
    const ageText = getAgeOrMonth(patient.birthDate, "en");
    return {
      nameAgeGender: `${patient.patientName} (${ageText} ${genderText})`,
      chartNumber: patient.chartNumber,
      birthShort,
    };
  }, [patient]);

  const canAddDraftRow =
    !specimenOptionsLoading &&
    availableSpecimens.length > 0 &&
    draftRows.length === 0;

  const addDraftRow = useCallback(() => {
    if (!canAddDraftRow || isPrinting) {
      return;
    }
    setDraftRows([{ id: createDraftRowId(), quantity: PRINT_QUANTITY.DEFAULT }]);
  }, [canAddDraftRow, isPrinting]);

  const removeDraftRow = useCallback((draftRowId: string) => {
    setDraftRows((prev) => prev.filter((row) => row.id !== draftRowId));
  }, []);

  const updateDraftQuantity = useCallback((draftRowId: string, nextQuantity: number) => {
    const clampedQuantity = clampQuantity(nextQuantity);
    setDraftRows((prev) =>
      prev.map((row) => (row.id === draftRowId ? { ...row, quantity: clampedQuantity } : row))
    );
  }, []);

  const handleSelectedSpecimenChange = useCallback(
    (currentSpecimenCode: string, nextSpecimenCode: string) => {
      if (currentSpecimenCode === nextSpecimenCode) {
        return;
      }
      const isDuplicate = selectedCodes.has(nextSpecimenCode);
      if (isDuplicate) {
        return;
      }

      const current = printItems.find((item) => item.specimenCode === currentSpecimenCode);
      const nextSpecimen = specimenOptions.find((s) => s.specimenCode === nextSpecimenCode);
      if (!current || !nextSpecimen) {
        return;
      }

      removeSpecimen(currentSpecimenCode);
      addSpecimen(nextSpecimen);
      updateQuantity(nextSpecimenCode, current.quantity);
    },
    [addSpecimen, printItems, removeSpecimen, selectedCodes, specimenOptions, updateQuantity]
  );

  const handleDraftSelect = useCallback(
    (draftRowId: string, specimenCode: string) => {
      const draftRow = draftRows.find((row) => row.id === draftRowId);
      const specimen = specimenOptions.find((s) => s.specimenCode === specimenCode);
      if (!draftRow || !specimen) {
        return;
      }

      addSpecimen(specimen);
      if (draftRow.quantity !== PRINT_QUANTITY.DEFAULT) {
        updateQuantity(specimen.specimenCode, draftRow.quantity);
      }
      removeDraftRow(draftRowId);
    },
    [addSpecimen, draftRows, removeDraftRow, updateQuantity]
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="min-w-[560px] max-w-[560px] bg-[var(--gray-white)] gap-0 rounded-[10px] border border-[var(--border-1)] p-0 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] [&>button]:hidden">
        <DialogTitle className="sr-only">검사 라벨 출력</DialogTitle>
        <div className="flex items-center gap-2 border-b border-transparent px-5 py-4">
          <div className="flex-1 text-[15px] font-bold leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            검사 라벨 출력
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--gray-300)] hover:bg-transparent cursor-pointer"
            onClick={handleClose}
            disabled={isPrinting}
            aria-label="닫기"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="px-5 pb-5">
          <div className="space-y-4">
            {/* 환자 정보 */}
            {patientSummary && (
              <div className="flex h-9 items-center gap-1 overflow-hidden rounded-[4px] bg-[var(--bg-1)] px-3 py-2 text-[12px]">

                <span className="text-[12px] font-bold leading-[1.25] tracking-[-0.12px] text-[var(--Gray-300_46474C,#46474C)]">
                  {patientSummary.nameAgeGender}
                </span>
                <div className="h-4 w-px bg-[var(--border-1)] mx-[4px]" />
                <span className="inline-flex items-center justify-center rounded-[4px] bg-[var(--bg-3)] px-1.5 py-0.5 text-[11px] font-bold leading-[1.25] tracking-[-0.11px] text-[var(--Gray-400_70737C,#70737C)]">
                  {patientSummary.chartNumber}
                </span>
                <div className="h-4 w-px bg-[var(--border-1)] mx-[4px]" />
                <span className="text-[12px] font-medium tracking-[-0.12px] text-[var(--gray-400)]">
                  {patientSummary.birthShort}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {rows.map((row) => {
                const selectValue = row.kind === "selected" ? row.specimenCode : "";
                const selectPlaceholderClass =
                  row.kind === "draft" ? "[&_[data-slot=select-value]]:text-[var(--gray-500)]" : "";

                const optionDisabledCodes =
                  row.kind === "selected"
                    ? new Set([...selectedCodes].filter((code) => code !== row.specimenCode))
                    : selectedCodes;

                const onSelectValueChange = (value: string) => {
                  if (row.kind === "draft") {
                    handleDraftSelect(row.draftRowId, value);
                    return;
                  }
                  handleSelectedSpecimenChange(row.specimenCode, value);
                };

                const onDecrease = () => {
                  if (row.kind === "draft") {
                    updateDraftQuantity(row.draftRowId, row.quantity - 1);
                    return;
                  }
                  updateQuantity(row.specimenCode, row.quantity - 1);
                };

                const onIncrease = () => {
                  if (row.kind === "draft") {
                    updateDraftQuantity(row.draftRowId, row.quantity + 1);
                    return;
                  }
                  updateQuantity(row.specimenCode, row.quantity + 1);
                };

                const onRemove = () => {
                  if (row.kind === "draft") {
                    removeDraftRow(row.draftRowId);
                    return;
                  }
                  removeSpecimen(row.specimenCode);
                };

                return (
                  <div key={row.key} className="relative flex w-full items-center gap-3">
                    <Select
                      value={selectValue}
                      onValueChange={onSelectValueChange}
                      disabled={isPrinting}
                    >
                      <SelectTrigger
                        className={`h-9 min-w-0 flex-1 border border-[var(--border-2)] bg-[var(--gray-white)] text-[13px] font-normal tracking-[-0.13px] text-[var(--gray-100)] ${selectPlaceholderClass}`}
                      >
                        <SelectValue placeholder={row.kind === "draft" ? "검체 선택" : undefined} />
                      </SelectTrigger>
                      <SelectContent>
                        {specimenOptions.map((specimen) => (
                          <SelectItem
                            key={specimen.specimenCode}
                            value={specimen.specimenCode}
                            disabled={optionDisabledCodes.has(specimen.specimenCode)}
                          >
                            {specimen.specimenName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex w-full max-w-[240px] flex-1 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-none rounded-l-[5px] border-[var(--border-2)] bg-[var(--gray-white)] text-[var(--gray-300)]"
                        onClick={onDecrease}
                        disabled={isPrinting || row.quantity <= PRINT_QUANTITY.MIN}
                        aria-label="출력 매수 감소"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <div className="flex h-9 flex-1 items-center justify-center border-y border-[var(--border-2)] bg-[var(--gray-white)] text-[14px] font-bold tabular-nums text-[var(--gray-100)]">
                        {row.quantity}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-none rounded-r-[5px] border-[var(--border-2)] bg-[var(--gray-white)] text-[var(--gray-300)]"
                        onClick={onIncrease}
                        disabled={isPrinting || row.quantity >= PRINT_QUANTITY.MAX}
                        aria-label="출력 매수 증가"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>

                    {row.canRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 text-[var(--gray-300)] hover:bg-transparent cursor-pointer"
                        onClick={onRemove}
                        disabled={isPrinting}
                        aria-label={row.kind === "draft" ? "검체 선택 행 제거" : "검체 제거"}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    ) : (
                      <div className="h-6 w-6" aria-hidden="true" />
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="h-9 w-fit gap-2 rounded-[4px] border-[var(--border-2)] bg-[var(--gray-white)] px-3 text-[13px] font-medium tracking-[-0.13px] text-[var(--gray-100)] hover:bg-[var(--bg-base)]"
                onClick={addDraftRow}
                disabled={isPrinting || !canAddDraftRow || specimenOptionsLoading}
              >
                <PlusIcon className="size-4" />
                추가
              </Button>
            </div>

            {/* 에러 메시지 */}
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
            disabled={!canPrintApi || isPrinting || isLoading}
          >
            {isPrinting ? "출력 중..." : "출력"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function clampQuantity(quantity: number): number {
  return Math.max(PRINT_QUANTITY.MIN, Math.min(PRINT_QUANTITY.MAX, quantity));
}

function formatGenderText(gender: "M" | "F"): string {
  return gender === "M" ? "남" : "여";
}

function createDraftRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
