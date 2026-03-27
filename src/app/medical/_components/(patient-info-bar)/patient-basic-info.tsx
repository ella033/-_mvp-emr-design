import MyPopup, { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { PatientBasicInfoBadge } from "../widgets/medical-patient-badge";
import { useEffect, useState } from "react";
import { BoardPatient } from "@/components/reception/board-patient";
import { useMedicalBoardPatientAdapter } from "@/hooks/medical/use-medical-board-patient-adapter";
import { Registration } from "@/types/registration-types";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { cn } from "@/lib/utils";
import MyDivideLine from "@/components/yjg/my-divide-line";

export default function PatientBasicInfo({
  registration,
  disableClick = false,
}: {
  registration: Registration;
  disableClick?: boolean;
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  // 현재(최신) registrationId. (차트 열기 등으로 currentRegistration이 바뀌면 이 값도 같이 바뀐다)
  const latestRegistrationId = registration.id?.toString() ?? null;

  const [popupReceptionId, setPopupReceptionId] = useState<string | null>(
    latestRegistrationId
  );
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] =
    useState(false);

  // 팝업이 닫혀있을 때는 최신 id와 동기화해두면 다음 클릭에서 자연스럽게 최신값 사용
  useEffect(() => {
    if (!isPopupOpen) {
      setPopupReceptionId(latestRegistrationId);
    }
  }, [isPopupOpen, latestRegistrationId]);

  // 의료 라우트용 어댑터 사용
  const {
    boardPatientProps,
    isLoadingReception,
    hasUnsavedChanges,
    rollbackUnsavedChanges,
  } =
    useMedicalBoardPatientAdapter(popupReceptionId);

  if (!registration.patient) {
    return null;
  }

  // 환자 클릭 시 selectedReceptionId 설정
  const handlePatientClick = () => {
    if (disableClick) return;

    const clickedRegistrationId = registration.id?.toString() ?? null;
    if (clickedRegistrationId) {
      // 클릭 순간의 최신 id로 훅 입력을 갱신 -> boardPatientProps 재계산
      setPopupReceptionId(clickedRegistrationId);
      setIsPopupOpen(true);
    }
  };

  // 팝업을 닫을 때 selectedReceptionId 초기화
  const handlePopupClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesConfirm(true);
      return;
    }

    setIsPopupOpen(false);
  };

  const handleConfirmUnsavedChanges = () => {
    rollbackUnsavedChanges();
    setShowUnsavedChangesConfirm(false);
    setIsPopupOpen(false);
  };

  const handleCancelUnsavedChanges = () => {
    setShowUnsavedChangesConfirm(false);
  };

  const handleBoardPatientSubmit: typeof boardPatientProps.onSubmit = async (
    action,
    reception
  ) => {
    try {
      await boardPatientProps.onSubmit?.(action, reception);

      // submit 완료 시 팝업 닫기 (/medical 환자 상세 팝업)
      if (action === "create" || action === "update" || action === "cancel") {
        setIsPopupOpen(false);
      }
    } catch (e) {
      // 실패 시 팝업 유지 (서비스 레이어에서 toast 처리)
      console.error(e);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center cursor-pointer hover:bg-[var(--purple-1)] rounded p-1",
        disableClick && "cursor-default hover:bg-transparent"
      )}
      data-testid="medical-selected-patient-info"
      onClick={handlePatientClick}
    >
      <div className="flex items-center gap-[4px]">
        <div data-testid="medical-selected-patient-name">
          <PatientBasicInfoBadge patient={registration.patient} isNewPatient={registration.isNewPatient} />
        </div>
        <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
        <div
          className="text-[12px] flex items-center text-[var(--gray-300)] font-[500]"
          data-testid="medical-selected-patient-rrn"
        >
          {registration.patient.rrn?.slice(0, 6)}-{registration.patient.rrn?.slice(6)}
        </div>
      </div>
      {isPopupOpen && (
        <MyPopup
          isOpen={isPopupOpen}
          onCloseAction={handlePopupClose}
          title="환자세부정보"
          localStorageKey="patient-detail-popup"
          width="700px"
          height="900px"
          minWidth="600px"
          minHeight="600px"
        >
          {isLoadingReception && !boardPatientProps.reception ? (
            <div className="w-full h-full flex items-center justify-center">
              <MyLoadingSpinner size="sm" />
            </div>
          ) : (
            <>
              <BoardPatient {...boardPatientProps} onSubmit={handleBoardPatientSubmit} />

              <MyPopupYesNo
                isOpen={showUnsavedChangesConfirm}
                onCloseAction={handleCancelUnsavedChanges}
                onConfirmAction={handleConfirmUnsavedChanges}
                title="수정 중인 환자 정보"
                message={`작성중인 환자내역이 있습니다.\n닫으시겠습니까?`}
                confirmText="확인"
                cancelText="취소"
              />
            </>
          )}
        </MyPopup>
      )}
    </div>
  );
}
