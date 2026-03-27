import { MyButton } from "@/components/yjg/my-button";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { type PatientListPosition } from "@/app/medical/_components/(medical-patient-list)/medical-patient-list";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";
import { ArrowLeftToLine, ArrowRightToLine, Pin } from "lucide-react";

// 환자 현황 설정 상수
const MEDICAL_PATIENT_LIST_SETTINGS = {
  scope: "user" as const,
  category: "medical-patient-list",
  pageContext: "medical-patient-list",
};

// debounce 타이머 저장용
let saveSettingsTimer: NodeJS.Timeout | null = null;

// Settings store에서 초기 position 값 로드
export const getInitialPatientListPosition = (): PatientListPosition => {
  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    MEDICAL_PATIENT_LIST_SETTINGS.category,
    MEDICAL_PATIENT_LIST_SETTINGS.pageContext
  );
  const savedPosition = savedSetting?.settings?.position;
  return savedPosition === "left" ? "left" : "right";
};

// Settings store에서 초기 pinned 값 로드
export const getInitialPatientStatusPinned = (): boolean => {
  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    MEDICAL_PATIENT_LIST_SETTINGS.category,
    MEDICAL_PATIENT_LIST_SETTINGS.pageContext
  );
  const savedPinned = savedSetting?.settings?.isPinned;
  return savedPinned === undefined ? true : savedPinned === true;
};

// 설정 저장 함수 (debounce 적용)
const savePatientStatusSettings = (isPinned: boolean, position: PatientListPosition) => {
  // 기존 타이머 클리어
  if (saveSettingsTimer) {
    clearTimeout(saveSettingsTimer);
  }

  // Settings store 즉시 업데이트
  useSettingsStore.getState().updateSettingLocally({
    scope: MEDICAL_PATIENT_LIST_SETTINGS.scope,
    category: MEDICAL_PATIENT_LIST_SETTINGS.category,
    pageContext: MEDICAL_PATIENT_LIST_SETTINGS.pageContext,
    settings: { isPinned, position },
  });

  // 500ms debounce 후 API로 저장
  saveSettingsTimer = setTimeout(() => {
    SettingsService.createOrUpdateSetting({
      scope: MEDICAL_PATIENT_LIST_SETTINGS.scope,
      category: MEDICAL_PATIENT_LIST_SETTINGS.category,
      pageContext: MEDICAL_PATIENT_LIST_SETTINGS.pageContext,
      settings: { isPinned, position },
    }).catch((error) => {
      console.error("[PatientStatusList] 설정 저장 실패:", error);
    });
    saveSettingsTimer = null;
  }, 500);
};

export default function MedicalPatientListHeader(
  {
    isPinned,
    setIsPinned,
    position,
    onPositionChangeAction,
  }: {
    isPinned: boolean;
    setIsPinned: (isPinned: boolean) => void;
    position: PatientListPosition;
    onPositionChangeAction: (position: PatientListPosition) => void;
  }
) {
  // 고정 상태 토글 핸들러
  const handlePinToggle = useCallback(() => {
    const newValue = !isPinned;
    setIsPinned(newValue);
    // 상태 업데이트 후 저장 (렌더링 사이클 외부에서 실행)
    setTimeout(() => {
      savePatientStatusSettings(newValue, position);
    }, 0);
  }, [isPinned, position]);

  // 위치 전환 핸들러
  const handlePositionToggle = useCallback(() => {
    const newPosition: PatientListPosition =
      position === "left" ? "right" : "left";
    onPositionChangeAction(newPosition);
    // 상태 업데이트 후 저장 (렌더링 사이클 외부에서 실행)
    setTimeout(() => {
      savePatientStatusSettings(isPinned, newPosition);
    }, 0);
  }, [position, isPinned, onPositionChangeAction]);


  return (
    <div className="flex flex-row items-center justify-between p-[9px] border-b border-[var(--border-1)]">
      <div className="flex flex-row items-center gap-[4px]">
        <span className="text-[var(--gray-100)] font-bold text-[14px]">
          진료 일정
        </span>
        <MyButton
          variant="ghost"
          size="icon"
          onClick={handlePinToggle}
          title={isPinned ? "고정 해제" : "고정"}
        >
          <Pin
            className={cn(
              "w-[12px] h-[12px]",
              isPinned ? "[&_path]:fill-[var(--main-color)] rotate-0" : "[&_path]:fill-none rotate-45"
            )}
          />
        </MyButton>
      </div>
      <div className="flex items-center gap-0.5">
        <MyButton
          variant="ghost"
          size="icon"
          onClick={handlePositionToggle}
          title={position === "left" ? "오른쪽으로 이동" : "왼쪽으로 이동"}
        >
          {position === "left" ? (
            <ArrowRightToLine className="w-[12px] h-[12px]" />
          ) : (
            <ArrowLeftToLine className="w-[12px] h-[12px]" />
          )}
        </MyButton>
      </div>
    </div>
  )
}