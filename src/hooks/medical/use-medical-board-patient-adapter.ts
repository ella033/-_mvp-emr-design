import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BoardPatientExternalProps,
  ExternalReception,
} from "@/components/reception/board-patient";
import { useMedicalBoardPatient } from "./use-medical-board-patient";
import { usePatientInfoService } from "@/hooks/reception/use-patient-info-service";
import type { Reception } from "@/types/common/reception-types";
import { ReceptionInitialTab } from "@/constants/common/common-enum";
import { useReceptionStore } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import type { BoardPatientDirtyController } from "@/components/reception/board-patient/board-patient-runtime-context";

/**
 * /medical 라우트 전용 BoardPatient 어댑터 훅
 */

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function useMedicalBoardPatientAdapter(receptionId: string | null): {
  boardPatientProps: BoardPatientExternalProps;
  isLoadingReception: boolean;
  hasUnsavedChanges: boolean;
  rollbackUnsavedChanges: () => void;
} {
  const { selectedReception, activeReceptionId, isLoading } =
    useMedicalBoardPatient(receptionId);

  const { registrations, updateRegistration } = useReceptionStore();

  const [draftReception, setDraftReception] = useState<Reception | null>(
    (selectedReception as Reception | null) ?? null
  );

  // ===== unsaved/rollback =====
  const lastReceptionIdRef = useRef<string | null>(null);
  // NOTE: /medical은 registrations(store) 기반 selectedReception이 업데이트되지 않는 케이스가 있어
  //       draft 동기화/롤백을 위해 "draft dirty"는 로컬로 유지한다.
  //       외부(UI)에서 사용하는 unsaved 여부는 reception-tabs-store(receptionChanges) 기반으로 계산한다.
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const baselineReceptionRef = useRef<Reception | null>(
    (selectedReception as Reception | null) ?? null
  );
  const draftReceptionRef = useRef<Reception | null>(null);
  const isDraftDirtyRef = useRef(false);
  const lastSelectedReceptionStrRef = useRef<string | null>(null);

  useEffect(() => {
    draftReceptionRef.current = draftReception;
  }, [draftReception]);

  const hasUnsavedChanges = isDraftDirty;

  useEffect(() => {
    isDraftDirtyRef.current = isDraftDirty;
  }, [isDraftDirty]);

  const selectedReceptionStr = useMemo(
    () => safeStringify(selectedReception),
    [selectedReception]
  );

  // 선택된 Reception이 바뀌면 draft를 동기화
  // IMPORTANT: isDraftDirty 변화(예: 저장 후 clean 처리)만으로는 selectedReception(=store/쿼리)이 갱신되지 않을 수 있으므로,
  //            dirty 토글이 draft를 다시 옛 selectedReception으로 덮어쓰지 않도록 "selectedReception 자체가 바뀐 경우"에만 동기화한다.
  useEffect(() => {
    const nextSelectedReception = (selectedReception as Reception | null) ?? null;

    if (!activeReceptionId) {
      lastReceptionIdRef.current = null;
      lastSelectedReceptionStrRef.current = selectedReceptionStr;
      setDraftReception(null);
      setIsDraftDirty(false);
      baselineReceptionRef.current = null;
      return;
    }

    // 환자가 바뀌었으면 무조건 새로 로드 + dirty 초기화
    if (lastReceptionIdRef.current !== activeReceptionId) {
      lastReceptionIdRef.current = activeReceptionId ?? null;
      lastSelectedReceptionStrRef.current = selectedReceptionStr;
      setDraftReception(nextSelectedReception);
      setIsDraftDirty(false);
      baselineReceptionRef.current = nextSelectedReception;
      return;
    }

    // 같은 환자: selectedReception이 실제로 갱신된 경우에만(=store/쿼리 값이 변한 경우에만) draft 동기화
    const selectedActuallyChanged =
      lastSelectedReceptionStrRef.current !== selectedReceptionStr;

    if (selectedActuallyChanged && !isDraftDirtyRef.current) {
      setDraftReception(nextSelectedReception);
      baselineReceptionRef.current = nextSelectedReception;
    }

    lastSelectedReceptionStrRef.current = selectedReceptionStr;
  }, [activeReceptionId, selectedReceptionStr, selectedReception]);

  const storeRegistrationSnapshot = useMemo(() => {
    if (!activeReceptionId) return null;
    return registrations.find((r) => r.id?.toString() === activeReceptionId) ?? null;
  }, [activeReceptionId, registrations]);

  // /medical 전용 patient-info 도메인 훅 (external receptionId 기반)
  const {
    handlePatient,
    handleRegistrationCancel,
    saveStatus,
    saveStatusText,
    // 공통 어댑터(UI) 로직에서 필요한 팝업 상태/핸들러들
    showUnsavedChangesConfirm,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    showDuplicateReceptionConfirm,
    handleConfirmDuplicateReception,
    handleCancelDuplicateReception,
  } = usePatientInfoService({
    reception:
      draftReception ?? (selectedReception as Reception | null) ?? undefined,
    receptionId: activeReceptionId ?? receptionId,
    unsavedChanges: {
      check: () => isDraftDirty,
      markClean: () => {
        // 저장 완료/명시적 clean 요청 시 baseline을 현재 draft로 올리고 dirty를 해제
        baselineReceptionRef.current = draftReceptionRef.current;
        setIsDraftDirty(false);
      },
    },
  });

  const [currentTab, setCurrentTab] = useState<ReceptionInitialTab | null>(
    ReceptionInitialTab.환자정보
  );

  useEffect(() => {
    setCurrentTab(ReceptionInitialTab.환자정보);
  }, [activeReceptionId]);

  const syncSavedReceptionToStore = useCallback(
    (savedReception: Reception) => {
      if (!activeReceptionId) return;
      if (!storeRegistrationSnapshot) return;

      const updatedRegistration =
        ReceptionService.convertReceptionToRegistration(savedReception);

      const { createDateTime, ...updatedPatientWithoutCreateDateTime } =
        updatedRegistration.patient || {};

      const mergedRegistration = {
        ...updatedRegistration,
        id: storeRegistrationSnapshot.id,
        patient: storeRegistrationSnapshot.patient
          ? {
            ...storeRegistrationSnapshot.patient,
            ...updatedPatientWithoutCreateDateTime,
            id: storeRegistrationSnapshot.patient.id,
            createDateTime: storeRegistrationSnapshot.patient.createDateTime,
          }
          : updatedRegistration.patient,
      };

      // 저장 성공 시에만 registrations 갱신
      updateRegistration(activeReceptionId, mergedRegistration);
    },
    [activeReceptionId, storeRegistrationSnapshot, updateRegistration]
  );

  const handleChange = useCallback((updates: Partial<ExternalReception>) => {
    setDraftReception((prev) => {
      if (!prev) return prev;

      const merged = {
        ...prev,
        ...updates,
        patientBaseInfo: updates.patientBaseInfo
          ? { ...prev.patientBaseInfo, ...updates.patientBaseInfo }
          : prev.patientBaseInfo,
        insuranceInfo: updates.insuranceInfo
          ? { ...prev.insuranceInfo, ...updates.insuranceInfo }
          : prev.insuranceInfo,
        receptionInfo: updates.receptionInfo
          ? { ...prev.receptionInfo, ...updates.receptionInfo }
          : prev.receptionInfo,
        patientStatus: updates.patientStatus
          ? { ...prev.patientStatus, ...updates.patientStatus }
          : prev.patientStatus,
      } as Reception;

      const baselineStr = baselineReceptionRef.current
        ? safeStringify(baselineReceptionRef.current)
        : null;
      const mergedStr = safeStringify(merged);
      const prevStr = safeStringify(prev);

      const didActuallyChange =
        prevStr !== null && mergedStr !== null ? prevStr !== mergedStr : true;

      const nextIsDraftDirty =
        baselineStr !== null && mergedStr !== null ? baselineStr !== mergedStr : true;

      if (didActuallyChange) {
        setIsDraftDirty(nextIsDraftDirty);
      }

      return merged;
    });
  }, []);

  const rollbackUnsavedChanges = useCallback(() => {
    // /medical 옵션 A: 저장 전에는 store를 건드리지 않으므로 롤백은 draft만 원복
    setDraftReception((selectedReception as Reception | null) ?? null);
    setIsDraftDirty(false);
    baselineReceptionRef.current = (selectedReception as Reception | null) ?? null;
  }, [selectedReception]);

  const handleSubmit = useCallback(
    async (
      action: "create" | "update" | "cancel" | "clear",
      reception: ExternalReception
    ) => {
      if (!reception) return;

      if (action === "cancel") {
        // reception을 전달하여 currentReception이 없어도 동작하도록 함
        await handleRegistrationCancel(reception);
        return;
      }

      if (action === "clear") {
        // 로컬 변경 폐기 후 store에 있던 Reception으로 draft/baseline 재설정
        const storeReception = (selectedReception as Reception | null) ?? null;
        setDraftReception(storeReception);
        baselineReceptionRef.current = storeReception;
        setIsDraftDirty(false);
        return;
      }

      await handlePatient(false, reception as Reception);
      setIsDraftDirty(false);
      baselineReceptionRef.current = reception as Reception;
      syncSavedReceptionToStore(reception as Reception);
    },
    [
      handlePatient,
      handleRegistrationCancel,
      syncSavedReceptionToStore,
      selectedReception,
    ]
  ) as BoardPatientExternalProps["onSubmit"];

  const localDirtyController = useMemo<BoardPatientDirtyController>(
    () => ({
      hasChanges: () => isDraftDirty,
      markChanged: () => {
        setIsDraftDirty(true);
      },
      markUnchanged: (_receptionId, nextBaseline?: unknown) => {
        baselineReceptionRef.current = (nextBaseline as Reception) ?? draftReceptionRef.current;
        setIsDraftDirty(false);
      },
    }),
    [isDraftDirty]
  );

  const boardPatientProps: BoardPatientExternalProps = {
    // /medical: 단독 1건 편집 케이스이므로 store 기반 dirty 추적 대신 로컬(draft/baseline) 기반을 사용한다.
    dirtyController: localDirtyController,
    reception: (draftReception as ExternalReception | null) ?? selectedReception,
    receptionId: activeReceptionId,
    isDisabled: false,
    initialTab: currentTab ?? ReceptionInitialTab.환자정보,
    onReceptionChange: handleChange,
    onSubmit: handleSubmit,
    onTabChange: (tab) => setCurrentTab(tab),
    // UI 상태 전달
    checkMsg: saveStatusText ?? null,
    saveStatus,
    showUnsavedChangesConfirm,
    onConfirmUnsavedChanges: handleConfirmUnsavedChanges,
    onCancelUnsavedChanges: handleCancelUnsavedChanges,
    showDuplicateReceptionConfirm,
    onConfirmDuplicateReception: handleConfirmDuplicateReception,
    onCancelDuplicateReception: handleCancelDuplicateReception,
  };

  return {
    boardPatientProps,
    isLoadingReception: isLoading,
    hasUnsavedChanges,
    rollbackUnsavedChanges,
  };
}


