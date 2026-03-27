"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClaimsDetailPanel from "../_components/(detail)/(detail-right)/claims-detail-panel";
import ClaimsPatientList, { PatientListItem } from "../_components/(detail)/(detail-left)/claims-patient-list";
import { useClaimDetailsByClaimId } from "@/hooks/claims/use-claim-details-by-claim-id";
import { ConfirmProvider } from "../commons/confirm-provider";
import { useClaimsDxStore } from "../(stores)/claims-dx-store";
import { useClaimById } from "@/hooks/claims/use-claims";
import {
  claimClassificationToLabel,
  formNumberToInsuranceType,
  treatmentTypeToLabel,
} from "../(enums)/claims-enums";
import ClaimsSummaryBar from "../_components/(detail)/claims-summary-bar";
import ClaimSummaryModal from "../_components/(detail)/(detail-right)/claim-summary-modal";

function normalizeClaimDetail(c: any) {
  // Ensure English keys exist (no Korean keys are introduced)
  const ym = c.treatmentYearMonth || (c.updatedAt ? new Date(c.updatedAt).toISOString().slice(0, 7).replace("-", "") : "");
  return {
    ...c,
    formNumber: c.formNumber,
    treatmentType: c.treatmentType ?? "2",
    claimClassification: c.claimClassification,
    treatmentYearMonth: ym,
    claimNumber: c.claimNumber ?? c.id?.slice(0, 10),
    totalMedicalBenefitAmount1: c.totalMedicalBenefitAmount1,
    totalMedicalBenefitAmount2: c.totalMedicalBenefitAmount2,
    claimAmount: c.claimAmount,
    patientCoPayment: c.patientCoPayment,
    excessCoPaymentLimitTotal: c.excessCoPaymentLimitTotal,
    supportAmount: c.supportAmount,
    disabilityMedicalExpenses: c.disabilityMedicalExpenses,
    nationalMeritClaimAmount: c.nationalMeritClaimAmount,
    nationalMeritCoPayment: c.nationalMeritCoPayment,
    totalAmountLessThan100: c.totalAmountLessThan100,
    coPaymentLessThan100: c.coPaymentLessThan100,
    claimAmountLessThan100: c.claimAmountLessThan100,
    nationalMeritClaimAmountLessThan100: c.nationalMeritClaimAmountLessThan100,
  };
}

export default function ClaimMasterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const claimId = params?.id || "";
  const setClaim = useClaimsDxStore((s) => s.setClaim);
  const setClaimDetails = useClaimsDxStore((s) => s.setClaimDetails);

  // 목록 조회
  const { data: listRes } = useClaimDetailsByClaimId(claimId, {
    hasError: false,
    isReviewed: false,
    isExcluded: false,
    hasReviewMemo: false,
  });
  const { data: claimRes } = useClaimById(claimId);
  useEffect(() => {
    if (claimRes) {
      setClaim(claimRes as any);
    }
  }, [claimRes, setClaim]);
  useEffect(() => {
    setClaimDetails((listRes?.data as any[]) ?? []);
  }, [listRes, setClaimDetails]);

  // API 응답을 명세서(claimDetail) 리스트 아이템으로 변환 (English keys only)
  const claimDetails: PatientListItem[] = useMemo(() => {
    const rows = (listRes?.data ?? []) as any[];
    return rows.map((row) => {
      const rowErrorCount = Number(row.claimApiErrorCount ?? row.errorCount ?? 0);
      const rawTreatmentDate =
        row.visitDateOrTreatmentStartDate ||
        row.treatmentDate ||
        row.detailPayload?.chart_data?.info?.["내원일"] ||
        (row.updatedAt ? new Date(row.updatedAt).toISOString().slice(0, 10) : "-");
      const treatmentDate = /^\d{8}$/.test(String(rawTreatmentDate))
        ? `${String(rawTreatmentDate).slice(0, 4)}-${String(rawTreatmentDate).slice(4, 6)}-${String(rawTreatmentDate).slice(6, 8)}`
        : String(rawTreatmentDate);
      return {
        id: row.id,
        chartNo: row.patientNo || row.patientId || row.requestId || row.id?.slice(-4) || "-",
        patientName: row.patientName || "-",
        treatmentDate,
        errorCount: rowErrorCount,
        reviewStatus: row.isExcluded ? "제외" : row.isReviewed ? "심사완료" : "미심사",
        reviewMemo: row.reviewMemo || "",
        hasError: rowErrorCount > 0 || !!row.hasError,
        isReviewed: !!row.isReviewed,
        isExcluded: !!row.isExcluded,
        hasReviewMemo: !!row.hasReviewMemo,
      } as PatientListItem;
    }).sort((a, b) => {
      const aSerial = Number((rows.find((r) => r.id === a.id) as any)?.detailPayload?.["명세서일련번호"] ?? 0);
      const bSerial = Number((rows.find((r) => r.id === b.id) as any)?.detailPayload?.["명세서일련번호"] ?? 0);
      return aSerial - bSerial;
    });
  }, [listRes]);


  const [selectedDetailId, setSelectedDetailId] = useState<string>("");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  useEffect(() => {
    if (!selectedDetailId && (claimDetails?.length ?? 0) > 0) setSelectedDetailId(claimDetails[0]!.id);
  }, [claimDetails, selectedDetailId]);

  const selectedDetailIndex = useMemo(
    () => claimDetails.findIndex((detail) => detail.id === selectedDetailId),
    [claimDetails, selectedDetailId]
  );

  const canMovePrev = selectedDetailIndex > 0;
  const canMoveNext =
    selectedDetailIndex >= 0 && selectedDetailIndex < claimDetails.length - 1;

  const handleMovePrevPatient = () => {
    if (!canMovePrev) return;
    const prevPatient = claimDetails[selectedDetailIndex - 1];
    if (!prevPatient) return;
    setSelectedDetailId(prevPatient.id);
  };

  const handleMoveNextPatient = () => {
    if (!canMoveNext) return;
    const nextPatient = claimDetails[selectedDetailIndex + 1];
    if (!nextPatient) return;
    setSelectedDetailId(nextPatient.id);
  };

  // 상세: 좌측 선택에 따라 명세서(claimDetail) 선택
  const claimDetailRow = useMemo(() => {
    const rows = (listRes?.data ?? []) as any[];
    return rows.find((r) => r.id === selectedDetailId) ?? rows[0] ?? null;
  }, [listRes, selectedDetailId]);

  const normalizedClaimDetail = useMemo(() => (claimDetailRow ? normalizeClaimDetail(claimDetailRow) : null), [claimDetailRow]);

  const summary = useMemo(() => {
    const claimData = (claimRes ?? {}) as any;
    const ym = String(claimData.treatmentYearMonth ?? "");
    const year = ym.length >= 6 ? ym.slice(0, 4) : "-";
    const month = ym.length >= 6 ? String(Number(ym.slice(4, 6))) : "-";
    const insuranceType = formNumberToInsuranceType(String(claimData.formNumber ?? "")) || "-";
    const treatmentType = treatmentTypeToLabel(String(claimData.treatmentType ?? "")) || "-";
    const claimClassification = claimClassificationToLabel(String(claimData.claimClassification ?? "")) || "-";
    const claimCount = Number(claimData.count ?? claimDetails.length ?? 0).toLocaleString();
    const totalMedicalBenefitAmount1 = Number(claimData.totalMedicalBenefitAmount1 ?? 0).toLocaleString();
    const claimAmount = Number(claimData.claimAmount ?? 0).toLocaleString();
    const patientCoPayment = Number(claimData.patientCoPayment ?? 0).toLocaleString();

    return {
      year,
      month,
      insuranceType,
      treatmentType,
      claimClassification,
      claimCount,
      totalMedicalBenefitAmount1,
      claimAmount,
      patientCoPayment,
    };
  }, [claimRes, claimDetails.length]);

  // Push selected detail into global claims dx store for right panel to subscribe
  const setClaimDetail = useClaimsDxStore((s) => s.setClaimDetail);
  useEffect(() => {
    setClaimDetail(normalizedClaimDetail);
  }, [normalizedClaimDetail, setClaimDetail]);

  return (
    <ConfirmProvider>
      <div className="w-full h-full box-border flex flex-col bg-[var(--bg-base)]">
        <ClaimsSummaryBar
          summary={summary}
          onBackAction={() => router.back()}
          onDetailAction={() => setIsSummaryOpen(true)}
        />

        <div className="flex-1 min-h-0 flex gap-2 xl:flex-row">
          {/* 왼쪽: 고정폭 리스트 */}
          <div className="h-[38%] min-h-[280px] w-full xl:h-full xl:w-[542px] xl:flex-none">
            <ClaimsPatientList patients={claimDetails} selectedId={selectedDetailId} onSelectPatientAction={setSelectedDetailId} />
          </div>

          {/* 오른쪽: 가변폭 상세 */}
          <div className="min-h-0 flex-1 overflow-auto p-2">
            <ClaimsDetailPanel
              key={selectedDetailId}
              claimId={claimId}
              showHeader={true}
              onPrevPatientAction={handleMovePrevPatient}
              onNextPatientAction={handleMoveNextPatient}
              canMovePrev={canMovePrev}
              canMoveNext={canMoveNext}
            />
          </div>
        </div>
      </div>
      <ClaimSummaryModal open={isSummaryOpen} onOpenChange={setIsSummaryOpen} claim={claimRes} />
    </ConfirmProvider>

  );
}

