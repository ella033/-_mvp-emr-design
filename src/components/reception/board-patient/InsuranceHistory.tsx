import type { ExternalReception } from "./types";
import { useSelectedReception } from "@/hooks/reception/use-selected-reception";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import InsuranceHistoryList from "./(insurance-info)/insurance-history-list";
import InsuranceHistoryDetail from "./(insurance-info)/insurance-history-detail";
import type { InsuranceHistoryItem } from "./(insurance-info)/insurance-history-list";
import { RegistrationsService } from "@/services/registrations-service";
import { ReceptionService } from "@/services/reception-service";
import type { Reception } from "@/types/common/reception-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { registrationKeys } from "@/lib/query-keys/registrations";
import { useInsuranceHistoryChange } from "@/hooks/reception/use-insurance-history-change";
import { useToastHelpers } from "@/components/ui/toast";
import { useReceptionStore } from "@/store/reception";

export interface InsuranceHistoryProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
  isDisabled?: boolean;
  onChange?: (updates: Partial<ExternalReception>) => void;
}

/**
 * 보험 이력/변경 탭 공용 컴포넌트
 *
 * - 현재 선택된 환자의 과거 접수 내역(reception)을 조회하여 보험 정보를 보여주고,
 *   선택한 이력으로 현재 접수의 insuranceInfo를 변경할 수 있는 UI.
 */
export function InsuranceHistory({
  reception: externalReception,
  receptionId: externalReceptionId,
  isDisabled,
}: InsuranceHistoryProps) {
  // 현재 Reception 기준으로 patientId를 가져오되,
  // props로 전달된 reception/receptionId가 있으면 우선 사용
  const { selectedReception: currentReceptionFromStore } = useSelectedReception({
    reception: externalReception ?? undefined,
    receptionId: externalReceptionId ?? undefined,
  });

  const currentReception: Reception | null =
    (externalReception as Reception | null) ??
    (currentReceptionFromStore as Reception | null) ??
    null;

  const patientId = currentReception?.patientBaseInfo?.patientId;

  const getInitialDateRange = (): { from: string; to: string } => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date): string =>
      date.toISOString().split("T")[0] ?? "";

    return {
      from: formatDate(oneWeekAgo),
      to: formatDate(today),
    };
  };

  const queryClient = useQueryClient();
  const { toast } = useToastHelpers();
  const { registrations } = useReceptionStore();

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(
    getInitialDateRange
  );
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);
  const [localInsuranceInfo, setLocalInsuranceInfo] =
    useState<Partial<InsuranceInfo> | null>(null);

  // 선택 행 변경 시 로컬 편집 상태 리셋
  useEffect(() => {
    setLocalInsuranceInfo(null);
  }, [selectedRows]);

  const { beginUTC, endUTC } = useMemo(() => {
    const begin = dateRange.from
      ? new Date(dateRange.from + "T00:00:00").toISOString()
      : null;
    const end = dateRange.to
      ? new Date(dateRange.to + "T23:59:59").toISOString()
      : null;
    return { beginUTC: begin, endUTC: end };
  }, [dateRange.from, dateRange.to]);

  // 등록 목록 조회 및 Reception으로 변환
  const { data: receptions = [] } = useQuery({
    queryKey: registrationKeys.byPatientRange(String(patientId ?? ""), beginUTC, endUTC),
    queryFn: async (): Promise<Reception[]> => {
      if (!patientId || !beginUTC || !endUTC) return [];

      const registrations =
        await RegistrationsService.getRegistrationsByPatient(
          String(patientId),
          beginUTC,
          endUTC
        );

      return registrations.map((registration) =>
        ReceptionService.convertRegistrationToReception(registration)
      );
    },
    enabled: !!patientId && !!dateRange.from && !!dateRange.to,
  });

  const insuranceHistoryList: InsuranceHistoryItem[] = useMemo(() => {
    const sortedReceptions = [...receptions].sort((a, b) => {
      const dateA = a.receptionDateTime
        ? new Date(a.receptionDateTime).getTime()
        : 0;
      const dateB = b.receptionDateTime
        ? new Date(b.receptionDateTime).getTime()
        : 0;
      return dateB - dateA;
    });

    return sortedReceptions.map((reception) => ({
      registrationId: reception.originalRegistrationId || "",
      receptionDateTime: reception.receptionDateTime,
      uDeptDetail: reception.insuranceInfo.uDeptDetail,
      cardNumber: reception.insuranceInfo.cardNumber || "",
      father: reception.insuranceInfo.father || "",
      relation: String(reception.insuranceInfo.relation || ""),
      unionCode: reception.insuranceInfo.unionCode || "",
      unionName: reception.insuranceInfo.unionName || "",
    }));
  }, [receptions]);

  // 선택된 이력 행의 원본 보험정보
  const selectedRowInsuranceInfo = useMemo<Partial<InsuranceInfo> | null>(() => {
    if (selectedRows.length === 0) return null;
    const firstRow = selectedRows[0];
    if (!firstRow) return null;

    const registrationIdItem = firstRow.cells.find(
      (item) => item.headerKey === "registrationId"
    );
    const registrationId = String(registrationIdItem?.value || "");
    const targetReception = receptions.find(
      (r) => r.originalRegistrationId === registrationId
    );
    if (!targetReception) return null;

    return targetReception.insuranceInfo;
  }, [selectedRows, receptions]);

  // 편집 가능한 보험정보: 로컬 편집 → 선택된 행 원본 위에 merge
  const editableInsuranceInfo = useMemo(() => {
    if (!selectedRowInsuranceInfo) return null;
    if (!localInsuranceInfo) return selectedRowInsuranceInfo;
    return { ...selectedRowInsuranceInfo, ...localInsuranceInfo };
  }, [selectedRowInsuranceInfo, localInsuranceInfo]);

  // 현재 reception 보험정보와 편집된 보험정보 비교
  const hasInsuranceChanged = useMemo(() => {
    if (!currentReception || !editableInsuranceInfo) return false;
    const orig = currentReception.insuranceInfo;
    const local = editableInsuranceInfo;
    if (!orig || !local) return false;
    return (
      orig.uDeptDetail !== local.uDeptDetail ||
      orig.cardNumber !== local.cardNumber ||
      orig.unionCode !== local.unionCode ||
      orig.unionName !== local.unionName ||
      JSON.stringify(orig.extraQualification) !==
        JSON.stringify(local.extraQualification)
    );
  }, [currentReception, editableInsuranceInfo]);

  // 보험정보 편집 콜백
  const handleInsuranceDataChange = useCallback(
    (updates: Partial<InsuranceInfo>) => {
      setLocalInsuranceInfo((prev) => ({
        ...(prev ?? selectedRowInsuranceInfo ?? {}),
        ...updates,
      }));
    },
    [selectedRowInsuranceInfo]
  );

  // Mutation hook
  const { isLoading: isMutating, executeInsuranceHistoryChange } =
    useInsuranceHistoryChange({
      onSuccess: () => {
        toast({ title: "보험이력이 변경되었습니다.", variant: "default" });
        setLocalInsuranceInfo(null);
        // 보험이력 리스트 갱신
        queryClient.invalidateQueries({
          queryKey: registrationKeys.byPatientRange(
            String(patientId ?? ""),
            beginUTC,
            endUTC
          ),
        });
      },
      onError: (error) => {
        toast({
          title: `보험이력변경 실패: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  // 수진자조회 핸들러
  const handleEligibilityCheck = () => {
    console.log("수진자조회", selectedRows);
  };

  // 보험이력변경 핸들러: useInsuranceHistoryChange를 통해 처방 금액 재계산 포함
  const handleHistoryChange = useCallback(() => {
    if (!currentReception || !editableInsuranceInfo) return;

    // store에서 Registration 획득 (encounters 포함)
    const registrationId = currentReception.originalRegistrationId;
    const registration = registrationId
      ? registrations.find((r) => r.id === registrationId)
      : null;

    // store에 없으면 Reception → Registration 변환 (payment-index.tsx 패턴)
    const targetRegistration =
      registration ??
      ReceptionService.convertReceptionToRegistration(currentReception);

    executeInsuranceHistoryChange(targetRegistration, editableInsuranceInfo);
  }, [
    currentReception,
    editableInsuranceInfo,
    registrations,
    executeInsuranceHistoryChange,
  ]);

  return (
    <div className="h-full flex flex-col overflow-hidden text-[var(--gray-100)]">
      {/* 조회 & 리스트 영역 */}
      <InsuranceHistoryList
        insuranceHistoryList={insuranceHistoryList}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* 보험정보 & Footer 영역 */}
      <InsuranceHistoryDetail
        selectedRows={selectedRows}
        insuranceHistoryList={insuranceHistoryList}
        onEligibilityCheck={handleEligibilityCheck}
        onHistoryChange={handleHistoryChange}
        editableInsuranceInfo={editableInsuranceInfo}
        onInsuranceDataChange={handleInsuranceDataChange}
        hasInsuranceChanged={hasInsuranceChanged}
        isMutating={isMutating}
      />

      {isDisabled && (
        <div className="pt-1 text-xs text-[var(--negative)]">
          현재는 보험 정보를 수정할 수 없는 상태입니다.
        </div>
      )}
    </div>
  );
}

