import { useState } from "react";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { MyButton } from "@/components/yjg/my-button";
import { PatientInsuranceTypeBadge, PatientPregnantBadge, PatientReceptionTypeBadge, PatientGroupBadge, PatientExtraQualificationBadges } from "../widgets/medical-patient-badge";
import PatientVital from "./patient-vital";
import { useVitalSignMeasurementsPivot } from "@/hooks/vital-sign-measurement/use-vital-sign-measurements";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { CloseMenuIcon } from "@/components/custom-icons";
import { cn } from "@/lib/utils";
import PatientBasicInfo from "./patient-basic-info";
import RegistrationMemo from "./registration-memo";
import PatientChatTrigger from "@/components/reception/board-patient/(patient-info)/patient-chat/patient-chat-trigger";
import { calculateAge } from "@/lib/patient-utils";
import { useReceptionStore } from "@/store/common/reception-store";
import { formatDateByPattern } from "@/lib/date-utils";
import { useVitalSignItems } from "@/hooks/vital-sign-item/use-vital-sign-items";
import type { PatientListPosition } from "../(medical-patient-list)/medical-patient-list";
import {
  MyContextMenu,
  type MyContextMenuItem,
} from "@/components/yjg/my-context-menu";
import { useEncounterStore } from "@/store/encounter-store";
import { 접수상태 } from "@/constants/common/common-enum";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import type { Registration } from "@/types/registration-types";
import { useToastHelpers } from "@/components/ui/toast";
import MyPopup from "@/components/yjg/my-pop-up";

export default function PatientInfoBar({
  isPatientStatusOpen,
  setIsPatientStatusOpen,
  patientListPosition,
}: {
  isPatientStatusOpen: boolean;
  setIsPatientStatusOpen: (isPatientStatusOpen: boolean) => void;
  patientListPosition: PatientListPosition;
}) {
  const {
    currentRegistration,
    setCurrentRegistration,
    updateRegistration,
  } = useReceptionStore();
  const {
    selectedEncounter,
    setSelectedEncounter,
    setEncounters,
    isEncounterDataChanged,
    saveEncounterFn,
    setIsEncounterDataChanged,
  } = useEncounterStore();
  const { mutate: updateRegistrationApi } = useUpdateRegistration();
  const { success, error } = useToastHelpers();
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });
  const [isUnsavedClosePopupOpen, setIsUnsavedClosePopupOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  const closeChartAndMenu = () => {
    setSelectedEncounter(null);
    setCurrentRegistration(null);
    setEncounters(null);
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  /** 접수 상태를 대기로 바꾼 뒤 차트 닫기 (또는 그냥 차트 닫기) */
  const performCloseChart = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
    if (
      currentRegistration &&
      currentRegistration.status === 접수상태.진료중
    ) {
      updateRegistrationApi(
        {
          id: currentRegistration.id,
          data: { status: 접수상태.대기 },
        },
        {
          onSuccess: (response: Registration) => {
            updateRegistration(response.id, { status: response.status });
            closeChartAndMenu();
          },
          onError: () => {
            closeChartAndMenu();
          },
        }
      );
    } else {
      closeChartAndMenu();
    }
  };

  const handleSaveAndClose = async () => {
    if (!saveEncounterFn) return;
    setIsSaving(true);
    try {
      await saveEncounterFn();
      success("저장되었습니다.");
      setIsUnsavedClosePopupOpen(false);
      performCloseChart();
    } catch {
      error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardAndClose = () => {
    setIsEncounterDataChanged(false);
    setIsUnsavedClosePopupOpen(false);
    performCloseChart();
  };

  const contextMenuItems: MyContextMenuItem[] = [
    {
      label: "차트 닫기",
      onClick: () => {
        if (isEncounterDataChanged) {
          setIsUnsavedClosePopupOpen(true);
        } else {
          performCloseChart();
        }
      },
    },
  ];

  const registrationDate = formatDateByPattern(
    currentRegistration?.receptionDateTime ?? "",
    "YYYY-MM-DD"
  );
  const { data: vitalSignItems = [], isLoading: isLoadingVitalSignItems } =
    useVitalSignItems();

  const {
    data: vitalSignMeasurementsPivot = [],
    isLoading: isVitalMeasurementsLoading,
  } = useVitalSignMeasurementsPivot(
    currentRegistration?.patientId ?? 0,
    registrationDate,
    registrationDate
  );

  const isVitalLoading = isLoadingVitalSignItems || isVitalMeasurementsLoading;

  const ToggleButton = (
    <PatientListToggleButton
      isPatientStatusOpen={isPatientStatusOpen}
      setIsPatientStatusOpen={setIsPatientStatusOpen}
      position={patientListPosition}
    />
  );

  if (!currentRegistration)
    return (
      <>
        <PatientInfoBarContainer onContextMenu={handleContextMenu}>
          <div className="flex items-center justify-between whitespace-nowrap w-full">
            {patientListPosition === "left" && ToggleButton}
            <div
              className="text-[12px] text-[var(--gray-400)] flex-1 p-[4px]"
              data-testid="medical-select-patient-prompt"
            >
              환자를 선택해주세요.
            </div>
            {patientListPosition === "right" && ToggleButton}
          </div>
        </PatientInfoBarContainer>
      </>
    );

  if (!currentRegistration?.patient)
    return (
      <>
        <PatientInfoBarContainer onContextMenu={handleContextMenu}>
          <div className="flex items-center justify-between whitespace-nowrap w-full">
            {patientListPosition === "left" && ToggleButton}
            <div className="text-sm text-[var(--gray-400)] flex-1">
              환자 정보를 찾을 수 없습니다.
            </div>
            {patientListPosition === "right" && ToggleButton}
          </div>
        </PatientInfoBarContainer>
      </>
    );

  return (
    <>
      <PatientInfoBarContainer
        onContextMenu={handleContextMenu}
        testId="medical-selected-patient-bar"
      >
        {patientListPosition === "left" && ToggleButton}
        <PatientBasicInfo registration={currentRegistration} />
        <MyDivideLine orientation="vertical" size="sm" className="h-[16px]" />
        <div className="flex flex-row items-center gap-[3px]">
          <PatientReceptionTypeBadge
            receptionType={currentRegistration.receptionType}
          />
          <PatientInsuranceTypeBadge
            insuranceType={currentRegistration.insuranceType}
          />
          <PatientExtraQualificationBadges registration={currentRegistration} />
          <PatientPregnantBadge registration={currentRegistration} encounterDate={selectedEncounter?.encounterDateTime ?? ""} />
          <PatientGroupBadge groupId={currentRegistration.patient.groupId} />
          {/* Todo: 환자유형 뱃지 추가 */}
        </div>
        <MyDivideLine orientation="vertical" size="sm" className="h-[16px]" />
        {isVitalLoading ? (
          <MyLoadingSpinner size="sm" />
        ) : (
          <PatientVital
            patient={currentRegistration.patient}
            vitalSignItems={vitalSignItems}
            vitalSignMeasurementsPivot={vitalSignMeasurementsPivot}
          />
        )}
        <RegistrationMemo registration={currentRegistration} />
        <PatientChatTrigger
          patientId={currentRegistration.patientId}
          patientName={currentRegistration.patient.name}
          gender={currentRegistration.patient.gender ?? undefined}
          age={currentRegistration.patient.birthDate ? calculateAge(currentRegistration.patient.birthDate) : undefined}
        />
        {patientListPosition === "right" && ToggleButton}
      </PatientInfoBarContainer>
      <MyContextMenu
        isOpen={contextMenu.isOpen}
        onCloseAction={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        items={contextMenuItems}
        position={{ x: contextMenu.x, y: contextMenu.y }}
      />
      <MyPopup
        isOpen={isUnsavedClosePopupOpen}
        onCloseAction={() => setIsUnsavedClosePopupOpen(false)}
        hideHeader={true}
        fitContent={true}
      >
        <div className="flex flex-col gap-[20px] min-w-[300px]">
          <div className="flex-1 flex flex-col gap-1 px-2 py-1">
            <div className="text-base text-[var(--text-primary)]">
              진단 및 처방 데이터가 변경되었습니다. 저장하시겠습니까?
            </div>
          </div>
          <div className="flex justify-end gap-[10px]">
            <MyButton
              variant="outline"
              onClick={() => setIsUnsavedClosePopupOpen(false)}
            >
              취소
            </MyButton>
            <MyButton
              variant="outline"
              onClick={handleDiscardAndClose}
              disabled={isSaving}
            >
              저장 안 함
            </MyButton>
            <MyButton onClick={handleSaveAndClose} disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장"}
            </MyButton>
          </div>
        </div>
      </MyPopup>
    </>
  );
}

function PatientInfoBarContainer({
  children,
  onContextMenu,
  testId,
}: {
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-row items-center whitespace-nowrap gap-[6px] bg-[var(--gray-white)] px-[8px] py-[4px] min-w-0 my-scroll"
      onContextMenu={onContextMenu}
    >
      {children}
    </div>
  );
}

function PatientListToggleButton({
  isPatientStatusOpen,
  setIsPatientStatusOpen,
  position,
}: {
  isPatientStatusOpen: boolean;
  setIsPatientStatusOpen: (isPatientStatusOpen: boolean) => void;
  position: PatientListPosition;
}) {
  // position이 left일 때와 right일 때 아이콘 회전 방향 결정
  const getRotation = () => {
    if (position === "left") {
      // 왼쪽: 열림 → 왼쪽 화살표, 닫힘 → 오른쪽 화살표
      return isPatientStatusOpen ? "" : "rotate-180";
    } else {
      // 오른쪽: 열림 → 오른쪽 화살표(기본), 닫힘 → 왼쪽 화살표
      return isPatientStatusOpen ? "rotate-180" : "";
    }
  };

  return (
    <div className="flex items-center">
      <MyTooltip
        side={position === "left" ? "right" : "left"}
        content={`환자 현황 ${isPatientStatusOpen ? "닫기" : "열기"}`}
      >
        <MyButton
          variant="ghost"
          size="icon"
          className="text-[var(--gray-400)] hover:text-[var(--gray-100)] cursor-pointer"
          onClick={() => setIsPatientStatusOpen(!isPatientStatusOpen)}
        >
          <CloseMenuIcon className={cn("w-[16px] h-[16px]", getRotation())} />
        </MyButton>
      </MyTooltip>
    </div>
  );
}
