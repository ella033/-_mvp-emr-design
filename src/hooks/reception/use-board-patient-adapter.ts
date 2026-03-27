import { usePatientInfoUi } from "@/hooks/reception/use-patient-info-ui";

/**
 * BoardPatient 어댑터 공통 로직 훅
 *
 * - usePatientInfoUi 등 공통 UI 상태 제공
 * - 각 라우트별 어댑터에서 차이점만 구현하도록 지원
 */
export function useBoardPatientAdapter() {
  // UI 상태 (saveStatus, 팝업 등)
  const {
    saveStatus,
    showUnsavedChangesConfirm,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    showDuplicateReceptionConfirm,
    handleConfirmDuplicateReception,
    handleCancelDuplicateReception,
  } = usePatientInfoUi();

  return {
    // UI 상태
    saveStatus,
    showUnsavedChangesConfirm,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    showDuplicateReceptionConfirm,
    handleConfirmDuplicateReception,
    handleCancelDuplicateReception,
  };
}

