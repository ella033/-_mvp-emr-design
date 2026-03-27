import { useMemo, useCallback } from "react";
import { useReceptionTabsStore } from "@/store/reception";
import { ReceptionInitialTab, 접수상태 } from "@/constants/common/common-enum";
import type { BoardPatientExternalProps, BoardPatientTabId, ExternalReception } from "@/components/reception/board-patient";
import { useSelectedReception } from "@/hooks/reception/use-selected-reception";
import { usePatientInfoService } from "@/hooks/reception/use-patient-info-service";
import { useBoardPatientAdapter } from "@/hooks/reception/use-board-patient-adapter";
import type { BoardPatientDirtyController } from "@/components/reception/board-patient/board-patient-runtime-context";

/**
 * /reception 전용 BoardPatient 어댑터 훅
 *
 * - reception-tabs-store, reception-store, use-patient-info 등
 *   라우트 전용 도메인 로직을 캡슐화하고
 * - BoardPatientExternalProps 형태로만 UI에 전달한다.
 *
 * openedReceptionId / 외부 receptionId 등을
 * useSelectedReception 한 곳에서 통합해 사용한다.
 */
export function useReceptionBoardPatientAdapter(): {
  boardPatientProps: BoardPatientExternalProps;
} {
  const {
    openedReceptionId,
    updateOpenedReception,
    removeOpenedReception,
    initialTab,
    setInitialTab,
    hasReceptionChanges,
    markReceptionAsChanged,
    markReceptionAsUnchanged,
  } = useReceptionTabsStore();
  // 현재 활성화된 Reception (popup/탭/외부 id 통합)
  const { selectedReception, activeReceptionId } = useSelectedReception();

  // handleChange를 미리 정의 (useMemo 전에)
  const handleChange = useCallback((updates: Partial<ExternalReception>) => {
    if (!activeReceptionId) return;
    updateOpenedReception(activeReceptionId, updates);
  }, [activeReceptionId, updateOpenedReception]);

  // /reception 라우트용 접수 처리/취소 로직
  const {
    handlePatient,
    handleRegistrationCancel,
    showQualificationComparePopup,
    qualificationCompareData,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,
  } = usePatientInfoService({
    receptionId: activeReceptionId ?? undefined,
    onUpdateReception: handleChange,
  });

  // 공통 어댑터 로직 (UI 상태)
  const {
    saveStatus,
    showUnsavedChangesConfirm,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    showDuplicateReceptionConfirm,
    handleConfirmDuplicateReception,
    handleCancelDuplicateReception,
  } = useBoardPatientAdapter();


  const isInTreatment =
    selectedReception?.patientStatus?.status === 접수상태.진료중;

  // PatientInfo 등에서 호출하는 onSubmit을 /reception 도메인 로직에 매핑
  const handleSubmit = useCallback(
    async (
      action: "create" | "update" | "cancel" | "clear",
      reception: ExternalReception
    ) => {
      if (!reception) return;

      if (action === "cancel") {
        // PatientInfo에서 팝업 확인 후 넘어온 경우: reception을 전달하여 바로 취소 작업 수행
        await handleRegistrationCancel(reception);
        return;
      }

      if (action === "clear") {
        // Reception 초기화 및 신규환자 탭 닫기
        const receptionIdToRemove = activeReceptionId || openedReceptionId;
        if (receptionIdToRemove) {
          // reception 제거
          removeOpenedReception(receptionIdToRemove);
        }
        return;
      }

      const isRegistration =
        action === "create" ||
        !activeReceptionId;

      await handlePatient(isRegistration, reception);
    },
    [handlePatient, handleRegistrationCancel, activeReceptionId, openedReceptionId, removeOpenedReception]
  ) as BoardPatientExternalProps["onSubmit"];

  const dirtyController = useMemo<BoardPatientDirtyController>(
    () => ({
      hasChanges: (receptionId) => hasReceptionChanges(receptionId),
      markChanged: (receptionId) => markReceptionAsChanged(receptionId),
      markUnchanged: (receptionId) => markReceptionAsUnchanged(receptionId),
    }),
    [hasReceptionChanges, markReceptionAsChanged, markReceptionAsUnchanged]
  );

  const boardPatientProps: BoardPatientExternalProps = useMemo(
    () => {
      return {
        dirtyController,
        reception: selectedReception ?? null,
        receptionId: activeReceptionId ?? openedReceptionId,
        isDisabled: !!isInTreatment,
        initialTab: initialTab ?? ReceptionInitialTab.환자정보,
        onReceptionChange: handleChange,
        onSubmit: handleSubmit,
        onTabChange: (tabId: BoardPatientTabId) => {
          if (tabId !== initialTab) {
            setInitialTab(tabId);
          }
        },
        // UI 상태 전달
        saveStatus,
        showUnsavedChangesConfirm,
        onConfirmUnsavedChanges: handleConfirmUnsavedChanges,
        onCancelUnsavedChanges: handleCancelUnsavedChanges,
        // 이미 접수된 환자 확인 팝업 관련
        showDuplicateReceptionConfirm,
        onConfirmDuplicateReception: handleConfirmDuplicateReception,
        onCancelDuplicateReception: handleCancelDuplicateReception,
        // 자격조회 비교 팝업 관련
        showQualificationComparePopup,
        qualificationCompareData,
        handleQualificationCompareApplyPromise,
        handleQualificationCompareCancelPromise,
      };
    },
    [
      dirtyController,
      selectedReception,
      activeReceptionId,
      openedReceptionId,
      isInTreatment,
      initialTab,
      setInitialTab,
      handleSubmit,
      handleChange,
      updateOpenedReception,
      saveStatus,
      showUnsavedChangesConfirm,
      handleConfirmUnsavedChanges,
      handleCancelUnsavedChanges,
      showDuplicateReceptionConfirm,
      handleConfirmDuplicateReception,
      handleCancelDuplicateReception,
    ]
  );

  return { boardPatientProps };
}

