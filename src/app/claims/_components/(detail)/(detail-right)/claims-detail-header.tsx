"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import AlertModal from "@/app/claims/commons/alert-modal";
import { ClaimsService } from "@/services/claims-service";
import {
  mergeClaimDetailCache,
  refreshClaims,
} from "@/app/claims/commons/refresh-helpers";
import {
  formNumberToInsuranceType,
  treatmentTypeToLabel,
  claimClassificationToLabel,
} from "../../../(enums)/claims-enums";
import ClaimSummaryModal from "./claim-summary-modal";
import MedicalRecordModal from "./medical-record-modal";
import { useClaimsDxStore } from "../../../(stores)/claims-dx-store";


type ClaimRecord = Record<string, any>;

interface ClaimsDetailHeaderProps {
  claimId: string;
  fallback?: ClaimRecord;
  onPrevPatientAction?: () => void;
  onNextPatientAction?: () => void;
  canMovePrev?: boolean;
  canMoveNext?: boolean;
}

function formatMoney(value: any): string {
  const str = String(value ?? "0").replace(/[^0-9]/g, "");
  const num = Number(str || 0);
  return num.toLocaleString();
}

function yearMonthLabel(yyyymm?: string | null): string {
  if (!yyyymm || yyyymm.length < 6) return "-";
  const yy = yyyymm.slice(2, 4);
  const mm = yyyymm.slice(4, 6).replace(/^0/, "");
  return `${yy}년 ${mm}월`;
}

function coerceClaim(c?: ClaimRecord | null): ClaimRecord | null {
  if (!c) return null;
  const ym =
    c.treatmentYearMonth ||
    c["진료년월"] ||
    (c.updatedAt
      ? new Date(c.updatedAt).toISOString().slice(0, 7).replace("-", "")
      : "");
  return {
    ...c,
    formNumber: c.formNumber ?? c["서식번호"],
    treatmentType: c.treatmentType ?? c["진료형태"] ?? "2",
    claimClassification: c.claimClassification ?? c["청구구분"],
    treatmentYearMonth: ym,
    claimNumber: c.claimNumber ?? c["청구번호"] ?? c.id?.slice(0, 10),
    totalMedicalBenefitAmount1:
      c.totalMedicalBenefitAmount1 ??
      c["요양급여비용총액1"] ??
      c["요양급여비용총액 1"],
    patientCoPayment: c.patientCoPayment ?? c["본인일부부담금"],
    claimAmount: c.claimAmount ?? c["청구액"],
    medicalInstitutionCode:
      c.medicalInstitutionCode ??
      c["요양기관기호"] ??
      c["요양기관(의료급여기관)기호"],
  };
}

export default function ClaimsDetailHeader({
  claimId,
  fallback,
  onPrevPatientAction,
  onNextPatientAction,
  canMovePrev = false,
  canMoveNext = false,
}: ClaimsDetailHeaderProps) {
  const [open, setOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isSaveChoiceOpen, setIsSaveChoiceOpen] = useState(false);
  const [isReviewedWarningOpen, setIsReviewedWarningOpen] = useState(false);
  const qc = useQueryClient();
  const isEditing = useClaimsDxStore((s) => s.isEditing);
  const setIsEditing = useClaimsDxStore((s) => s.setIsEditing);

  const { data } = useQuery({
    queryKey: ["claim", claimId],
    queryFn: async () => {
      const res = await ClaimsService.getClaimById(claimId);
      return (res as any)?.data ?? res;
    },
    enabled: !!claimId,
    staleTime: 30_000,
    placeholderData: fallback,
  });

  const claim = useMemo(
    () => coerceClaim((data as any) ?? fallback),
    [data, fallback]
  );
  const insuranceLabel =
    formNumberToInsuranceType(String((claim as any)?.formNumber ?? "")) || "-";
  const treatmentLabel =
    treatmentTypeToLabel(String((claim as any)?.treatmentType ?? "")) || "-";
  const classificationLabel =
    claimClassificationToLabel(
      String((claim as any)?.claimClassification ?? "")
    ) || "-";
  const isSupplementClaim =
    String((claim as any)?.claimClassification ?? "") === "1" ||
    classificationLabel === "보완청구";
  const currentClaimDetail = useClaimsDxStore((s) => s.claimDetail);

  const previousRequestId = String(
    (currentClaimDetail as any)?.previousRequestId ??
    (currentClaimDetail as any)?.prevRequestId ??
    (currentClaimDetail as any)?.detailPayload?.["이전접수번호"] ??
    ""
  );
  const previousStatementSerialNumber = String(
    (currentClaimDetail as any)?.previousStatementSerialNumber ??
    (currentClaimDetail as any)?.prevStatementSerialNumber ??
    (currentClaimDetail as any)?.detailPayload?.["이전명일련번호"] ??
    ""
  );
  const nonPaymentCode = String(
    (currentClaimDetail as any)?.nonPaymentCode ??
    (currentClaimDetail as any)?.paymentInabilityCode ??
    (currentClaimDetail as any)?.detailPayload?.["지급불능코드"] ??
    ""
  );

  // Initialize from current claim detail status for the select
  const isReviewed = Boolean((currentClaimDetail as any)?.isReviewed);
  const isExcluded = Boolean((currentClaimDetail as any)?.isExcluded);
  const currentStatus = isExcluded
    ? "제외"
    : isReviewed
      ? "심사완료"
      : "미심사";

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const next = e.target.value; // "미심사" | "심사완료" | "제외"
    // qc.invalidateQueries({ queryKey: ["claim", claimId] });
    // qc.invalidateQueries({ queryKey: ["claim-details-by-claim-id", claimId] });

    if (!currentClaimDetail) {
      return;
    }
    try {
      const payload = {
        ...currentClaimDetail,
        isReviewed: next === "심사완료",
        isExcluded: next === "제외",
      };
      await ClaimsService.updateLinkedClaimDetail(
        claimId,
        currentClaimDetail.id,
        payload
      );
      qc.invalidateQueries({ queryKey: ["claim", claimId] });
      qc.setQueriesData<any>(
        { queryKey: ["claim-details-by-claim-id", claimId] },
        (old: any) => {
          if (!old) return old;
          const nextData = (old.data ?? []).map((row: any) =>
            row.id === currentClaimDetail.id
              ? {
                ...payload,
              }
              : row
          );
          return { ...old, data: nextData };
        }
      );
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <div className="bg-[var(--bg-main)] p-3">
        <div className="flex items-center justify-between mb-3">
          {isSupplementClaim ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-[5px] border-[var(--border-1)] bg-white shadow-none"
                    onClick={onPrevPatientAction}
                    disabled={!canMovePrev}
                  >
                    <img src="/icon/ic_line_arrow left.svg" alt="이전" className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-[5px] border-[var(--border-1)] bg-white shadow-none"
                    onClick={onNextPatientAction}
                    disabled={!canMoveNext}
                  >
                    <img src="/icon/ic_line_arrow right.svg" alt="다음" className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-[var(--gray-100)]">
                      이전 접수번호
                    </span>
                    <input
                      value={previousRequestId}
                      readOnly
                      placeholder="접수번호"
                      className="h-7 w-[100px] rounded-[4px] border border-[var(--border-2)] bg-[var(--bg-main)] px-2 text-[12px] text-[var(--gray-300)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-[var(--gray-100)]">
                      이전 명일련번호
                    </span>
                    <input
                      value={previousStatementSerialNumber}
                      readOnly
                      placeholder="명일련번호"
                      className="h-7 w-[100px] rounded-[4px] border border-[var(--border-2)] bg-[var(--bg-main)] px-2 text-[12px] text-[var(--gray-300)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-[var(--gray-100)]">
                      지급불능코드
                    </span>
                    <input
                      value={nonPaymentCode}
                      readOnly
                      placeholder="코드"
                      className="h-7 w-[80px] rounded-[4px] border border-[var(--border-2)] bg-[var(--bg-main)] px-2 text-[12px] text-[var(--gray-300)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  className="h-7 rounded-[4px] border border-[var(--border-2)] bg-[var(--bg-main)] px-2 text-[12px]"
                  value={currentStatus}
                  onChange={handleStatusChange}
                >
                  <option>미심사</option>
                  <option>심사완료</option>
                  <option>제외</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="claims-medical-record-button"
                  className="h-7 px-3 text-[12px]"
                  onClick={() => setIsMedicalModalOpen(true)}
                >
                  진료기록열기
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-[5px] border-[var(--border-1)] bg-white shadow-none"
                  onClick={onPrevPatientAction}
                  disabled={!canMovePrev}
                >
                  <img src="/icon/ic_line_arrow left.svg" alt="이전" className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-[5px] border-[var(--border-1)] bg-white shadow-none"
                  onClick={onNextPatientAction}
                  disabled={!canMoveNext}
                >
                  <img src="/icon/ic_line_arrow right.svg" alt="다음" className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  className="h-7 rounded-[4px] border border-[var(--border-2)] bg-[var(--bg-main)] px-2 text-[12px]"
                  value={currentStatus}
                  onChange={handleStatusChange}
                >
                  <option>미심사</option>
                  <option>심사완료</option>
                  <option>제외</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="claims-medical-record-button"
                  className="h-7 px-3 text-[12px]"
                  onClick={() => setIsMedicalModalOpen(true)}
                >
                  진료기록 열기
                </Button>
                <Button
                  size="sm"
                  variant={isEditing ? "default" : "outline"}
                  className="h-7 px-3 text-[12px]"
                  onClick={() => {
                    if (!isEditing) {
                      if (currentStatus === "심사완료") {
                        setIsReviewedWarningOpen(true);
                        return;
                      }
                      setIsEditing(true);
                      return;
                    }
                    setIsSaveChoiceOpen(true);
                  }}
                >
                  {isEditing ? "수정 완료" : "수정"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Summary Modal */}
      <ClaimSummaryModal open={open} onOpenChange={setOpen} claim={claim} />
      <MedicalRecordModal
        open={isMedicalModalOpen}
        onOpenChangeAction={async (isOpen) => {
          setIsMedicalModalOpen(isOpen);
          if (!isOpen) {
            await refreshClaims(qc, claimId, { includeClaimsList: true });
          }
        }}
        patientId={(currentClaimDetail as any)?.patientId}
        treatmentDate={(currentClaimDetail as any)?.visitDateOrTreatmentStartDate}
      />
      <AlertModal
        open={isSaveChoiceOpen}
        onOpenChange={setIsSaveChoiceOpen}
        message={
          <div className="text-left space-y-3">
            <div className="font-semibold text-center">
              수정사항을 저장하기 위한 작업을 선택해주세요.
            </div>
            <div className="space-y-2 px-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="save-choice"
                  defaultChecked
                  value="apply-to-medical"
                />
                <span>수정사항 진료기록에 적용</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="save-choice" value="apply-to-claim" />
                <span>명세서에만 적용</span>
              </label>
            </div>
          </div>
        }
        cancelText="취소"
        confirmText="확인"
        onConfirm={async () => {
          const el = document.querySelector(
            'input[name="save-choice"]:checked'
          ) as HTMLInputElement | null;
          const choice = el?.value;
          if (choice === "apply-to-claim") {
            try {
              const detailId = String(
                (currentClaimDetail as any)?.id ??
                (currentClaimDetail as any)?.detailId
              );
              if (claimId && detailId) {
                const payload: Record<string, any> = {
                  ...(currentClaimDetail as any),
                };
                await ClaimsService.updateLinkedClaimDetail(
                  claimId,
                  detailId,
                  payload
                );
                mergeClaimDetailCache(qc, claimId, detailId, payload);
                await refreshClaims(qc, claimId, { includeClaimsList: true });
              }
            } catch (e) {
              console.error(e);
            }
          } else {
            // apply-to-medical: 추후 진료기록 저장 로직 연결
          }
          setIsEditing(false);
        }}
        onCancel={() => {
          setIsEditing(false);
        }}
      />
      <AlertModal
        open={isReviewedWarningOpen}
        onOpenChange={setIsReviewedWarningOpen}
        message="이미 심사가 완료된 명세서입니다. 진료기록을 수정하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        onConfirm={() => {
          setIsReviewedWarningOpen(false);
          setIsEditing(true);
        }}
        onCancel={() => {
          setIsReviewedWarningOpen(false);
        }}
      />
    </>
  );
}
