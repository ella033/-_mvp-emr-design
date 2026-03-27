import type { ExternalReception } from "./types";
import { ClearProvider } from "@/contexts/ClearContext";
import { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ReceptionService } from "@/services/reception-service";
import BasicInfo from "./(patient-info)/basic-info2";
import ViewBasicInfo from "./(patient-info)/view-basic-info";
import MemoInfo from "./(patient-info)/memo-info";
import MedicalInfo from "./(patient-info)/medical-info";
import ReceptionInfo from "./(patient-info)/reception-info";
import VitalAndBst from "./(patient-info)/vital-and-bst";
import { PatientInfoFooter } from "./(patient-info)/patient-info-footer";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { isRegistrationMode } from "@/lib/registration-utils";
import { useEncounter } from "@/hooks/encounter/use-encounter";
import { AlertBarProvider } from "@/components/ui/alert-bar";
import { 접수상태 } from "@/constants/common/common-enum";

/**
 * 포커스된 섹션 타입
 */
enum FocusedSection {
  Memo = "memo",
  BasicWithMemo = "basicWithMemo",
  Medical = "medical",
  Reception = "reception",
  Vital = "vital",
}

export interface PatientInfoProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
  isDisabled?: boolean;
  onChange?: (updates: Partial<ExternalReception>) => void;
  onSubmit?: (
    action: "create" | "update" | "cancel" | "clear",
    reception: ExternalReception
  ) => void;
  /**
   * 레이아웃 모드
   * - full: 기존과 동일 (기본정보 + 메모/바이탈/진료/접수 + footer)
   * - sectionsOnly: 기본정보 영역은 외부에서 렌더링하고(예: ViewBasicInfo 상단 고정),
   *   여기서는 메모/바이탈/진료/접수 + footer만 렌더링
   */
  layout?: "full" | "sectionsOnly";
  /** 에러 메시지 표시 */
  checkMsg?: string | null;
  /** 저장 상태 표시 */
  saveStatus?: "idle" | "saving" | "saved" | "failed";
  /** 수정 중인 환자 경고 팝업 표시 여부 */
  showUnsavedChangesConfirm?: boolean;
  /** 수정 중인 환자 경고 팝업 확인 핸들러 */
  onConfirmUnsavedChanges?: () => void;
  /** 수정 중인 환자 경고 팝업 취소 핸들러 */
  onCancelUnsavedChanges?: () => void;
  /** 이미 접수된 환자 확인 팝업 표시 여부 */
  showDuplicateReceptionConfirm?: boolean;
  /** 이미 접수된 환자 확인 팝업 확인 핸들러 */
  onConfirmDuplicateReception?: () => void;
  /** 이미 접수된 환자 확인 팝업 취소 핸들러 */
  onCancelDuplicateReception?: () => void;
}

/**
 * 환자 정보 탭 (기본정보/진료정보/접수정보/만성질환/바이탈 등 포함)
 *
 * NOTE:
 * - 이 컴포넌트는 store를 직접 사용하지 않고 순수 props 기반으로만 동작해야 한다.
 * - 현재는 최소한의 골격만 정의해 두고, 기존 PatientInfo/BasicInfo 등에서
 *   UI와 로직을 점진적으로 마이그레이션한다.
 */
export function PatientInfo({
  reception,
  receptionId,
  isDisabled,
  onChange,
  onSubmit,
  layout = "full",
  checkMsg,
  saveStatus = "idle",
  showUnsavedChangesConfirm = false,
  onConfirmUnsavedChanges,
  onCancelUnsavedChanges,
  showDuplicateReceptionConfirm = false,
  onConfirmDuplicateReception,
  onCancelDuplicateReception,
}: PatientInfoProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastFocusedSection, setLastFocusedSection] = useState<FocusedSection | null>(null);

  const handleCreateOrUpdate = (mode: "create" | "update") => {
    if (!reception || !onSubmit) return;
    onSubmit(mode, reception);
  };

  const handleCancelSubmit = useCallback(() => {
    if (!reception || !onSubmit) return;
    // 접수 취소 확인 팝업 표시
    setShowCancelConfirm(true);
  }, [reception, onSubmit]);

  const handleConfirmCancel = useCallback(() => {
    if (!reception || !onSubmit) return;
    setShowCancelConfirm(false);
    onSubmit("cancel", reception);
  }, [reception, onSubmit]);

  const handleClear = () => {
    if (!reception || !onSubmit) return;
    onSubmit("clear", reception);
  };

  const isRegistrationModeValue = isRegistrationMode(receptionId);

  // reception이 null이면 UI에는 초기 Reception을 표시하되,
  // 실제 onChange/onSubmit은 원본 reception이 있을 때만 동작하도록 유지
  const hasReception = !!reception;

  const displayedReception = useMemo(
    () =>
      (reception as ExternalReception | null) ??
      (ReceptionService.createInitialReception() as ExternalReception),
    [reception]
  );

  const isNewPatient = useMemo(() => {
    const patientNo = displayedReception?.patientBaseInfo?.patientNo as
      | number
      | string
      | null
      | undefined;
    return !patientNo || patientNo === "" || patientNo === 0;
  }, [displayedReception]);

  const displayedDisabled = isDisabled || !hasReception;
  /** 수납대기/수납완료일 때 진료정보·접수정보 섹션만 비활성화 */
  const isDisabledByPaymentStatus =
    displayedReception?.receptionInfo?.status === 접수상태.수납대기 ||
    displayedReception?.receptionInfo?.status === 접수상태.수납완료;
  const showViewBasicInfo = layout === "full" && hasReception && !isNewPatient;
  const shouldMergeBasicAndMemo = layout === "full" && (!hasReception || isNewPatient);

  // encounterId 추출
  const encounterIdFromReception = useMemo(() => {
    return ReceptionService.getEncounterIdFromReception(reception, receptionId ?? null);
  }, [reception, receptionId]);

  // receptionEncounter 조회
  const { data: receptionEncounter } = useEncounter(
    encounterIdFromReception || ""
  );

  return (
    <ClearProvider>
      <div
        className="flex flex-col w-full h-full text-[var(--gray-100)]"
        data-testid={isRegistrationModeValue ? "reception-new-patient-form" : undefined}
      >
        <div className="flex-1 overflow-auto flex flex-col p-1 gap-2">
          <>
            {/* 기존 BasicInfo/MedicalInfo/ReceptionInfo/VitalAndBst/ChronicInfo를
                props 기반(onUpdateReception)으로만 사용.
                reception이 null이면 초기 Reception을 사용하지만,
                displayedDisabled 상태로 비활성화된다. */}
            {showViewBasicInfo && (
              <>
                <ViewBasicInfo
                  reception={displayedReception}
                  receptionId={receptionId ?? undefined}
                  isDisabled={displayedDisabled}
                  onUpdateReception={onChange}
                />
                <div onFocus={() => setLastFocusedSection(FocusedSection.Memo)}>
                  <MemoInfo
                    reception={displayedReception}
                    receptionId={receptionId ?? undefined}
                    isDisabled={displayedDisabled}
                    onUpdateReception={onChange}
                    isHighlighted={lastFocusedSection === FocusedSection.Memo}
                    memoHeightPx={150}
                  />
                </div>
              </>
            )}

            {shouldMergeBasicAndMemo && (
              <div
                className={cn(
                  "flex flex-col gap-0 rounded-md bg-[var(--bg-1)] border border-transparent transition-colors focus-within:border-[var(--main-color-2-1)] focus-within:bg-[var(--bg-base1)]",
                  lastFocusedSection === FocusedSection.BasicWithMemo && "border-[var(--main-color-2-1)] bg-[var(--bg-base1)]"
                )}
                onFocus={() => setLastFocusedSection(FocusedSection.BasicWithMemo)}
              >
                <BasicInfo
                  reception={displayedReception}
                  receptionId={receptionId ?? undefined}
                  isDisabled={displayedDisabled}
                  onUpdateReception={onChange}
                  cardVariant="mergedTop"
                />
                <MemoInfo
                  reception={displayedReception}
                  receptionId={receptionId ?? undefined}
                  isDisabled={displayedDisabled}
                  onUpdateReception={onChange}
                  cardVariant="mergedBottom"
                  memoHeightPx={100}
                />
              </div>
            )}

            {layout !== "full" && (
              <div onFocus={() => setLastFocusedSection(FocusedSection.Memo)}>
                <MemoInfo
                  reception={displayedReception}
                  receptionId={receptionId ?? undefined}
                  isDisabled={displayedDisabled}
                  onUpdateReception={onChange}
                  isHighlighted={lastFocusedSection === FocusedSection.Memo}
                />
              </div>
            )}

            <div onFocus={() => setLastFocusedSection(FocusedSection.Medical)}>
              <MedicalInfo
                reception={displayedReception}
                receptionId={receptionId ?? undefined}
                isDisabled={displayedDisabled || isDisabledByPaymentStatus}
                onUpdateReception={onChange}
                isHighlighted={lastFocusedSection === FocusedSection.Medical}
              />
            </div>
            <div onFocus={() => setLastFocusedSection(FocusedSection.Reception)}>
              <ReceptionInfo
                reception={displayedReception}
                receptionId={receptionId ?? undefined}
                isDisabled={displayedDisabled || isDisabledByPaymentStatus}
                onUpdateReception={onChange}
                isHighlighted={lastFocusedSection === FocusedSection.Reception}
              />
            </div>
            <div onFocus={() => setLastFocusedSection(FocusedSection.Vital)}>
              <VitalAndBst
                reception={displayedReception}
                receptionId={receptionId ?? undefined}
                isDisabled={displayedDisabled}
                onVitalMeasurementsChange={() => { }}
                onUpdateReception={onChange}
                isHighlighted={lastFocusedSection === FocusedSection.Vital}
              />
            </div>
            {/* MVP기준은 미사용
            <ChronicInfo
              reception={displayedReception}
              receptionId={receptionId ?? undefined}
              isDisabled={displayedDisabled}
              onUpdateReception={onChange}
            />
            */}
          </>
        </div>

        {/* 하단 액션 버튼 영역 */}
        <AlertBarProvider>
          <PatientInfoFooter
            isRegistrationMode={isRegistrationModeValue}
            isDisabled={displayedDisabled}
            saveStatus={saveStatus}
            checkMsg={checkMsg}
            reception={displayedReception}
            receptionEncounter={receptionEncounter ?? null}
            onCancelSubmit={handleCancelSubmit}
            onClear={handleClear}
            onCreateOrUpdate={handleCreateOrUpdate}
          />
        </AlertBarProvider>

        {/* 접수 취소 확인 팝업 */}
        <MyPopupYesNo
          isOpen={showCancelConfirm}
          onCloseAction={() => setShowCancelConfirm(false)}
          onConfirmAction={handleConfirmCancel}
          title="접수 취소"
          message="접수를 취소하시겠습니까?"
          confirmText="접수취소"
          cancelText="취소안함"
        />

        {/* 수정 중인 환자 경고 팝업 */}
        {showUnsavedChangesConfirm && (
          <MyPopupYesNo
            isOpen={showUnsavedChangesConfirm}
            onCloseAction={onCancelUnsavedChanges || (() => { })}
            onConfirmAction={onConfirmUnsavedChanges || (() => { })}
            title="수정 중인 환자 정보"
            message={`작성중인 환자내역이 있습니다.\n닫으시겠습니까?`}
            confirmText="확인"
            cancelText="취소"
          />
        )}

        {/* 이미 접수된 환자 확인 팝업 */}
        {showDuplicateReceptionConfirm && (
          <MyPopupYesNo
            isOpen={showDuplicateReceptionConfirm}
            onCloseAction={onCancelDuplicateReception || (() => { })}
            onConfirmAction={onConfirmDuplicateReception || (() => { })}
            title="이미 접수된 환자"
            message={`이미 접수된 환자 입니다.\n접수하시겠습니까?`}
            testId="reception-duplicate-confirm-modal"
            confirmButtonTestId="reception-duplicate-confirm-button"
            cancelButtonTestId="reception-duplicate-cancel-button"
            confirmText="접수"
            cancelText="취소"
          />
        )}
      </div>
    </ClearProvider>
  );
}

