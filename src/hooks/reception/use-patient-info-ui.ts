import { usePatientInfoService } from "@/hooks/reception/use-patient-info-service";

/**
 * PatientInfo UI 전용 훅
 *
 * - saveStatus, saveStatusText, 확인 모달(open/close) 등
 *   순수 UI 흐름과 메시지/confirm 제어만 제공한다.
 * - 비즈니스 로직(handlePatient 등)은 usePatientInfoService를 사용한다.
 *
 * NOTE: 현재는 기존 usePatientInfo 훅을 래핑하여
 *       UI 레이어에 필요한 부분만 선택적으로 노출하는 형태이다.
 */
export const usePatientInfoUi = () => {
  // /reception 전역 컨텍스트 기준으로 UI 상태를 관리하므로
  // options 없이 기본 서비스 훅을 사용한다.
  const core = usePatientInfoService();

  return {
    // ===== UI States =====
    actionType: core.actionType,
    saveStatus: core.saveStatus,

    // 수정 중인 환자 경고 팝업 관련
    showUnsavedChangesConfirm: core.showUnsavedChangesConfirm,

    // 이미 접수된 환자 확인 팝업 관련
    showDuplicateReceptionConfirm: core.showDuplicateReceptionConfirm,

    // ===== UI Handlers =====
    // 수정 중인 환자 경고 팝업에서 액션 실행/취소
    executeWithUnsavedChangesCheck: core.executeWithUnsavedChangesCheck,
    handleConfirmUnsavedChanges: core.handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges: core.handleCancelUnsavedChanges,

    // 이미 접수된 환자 확인 팝업에서 액션 실행/취소
    handleConfirmDuplicateReception: core.handleConfirmDuplicateReception,
    handleCancelDuplicateReception: core.handleCancelDuplicateReception,

    // ===== Derived UI Text =====
    saveStatusText: core.saveStatusText,
  };
};


