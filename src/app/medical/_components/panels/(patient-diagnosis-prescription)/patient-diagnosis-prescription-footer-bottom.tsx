import { useState, useEffect, useRef } from "react";
import { MySelect } from "@/components/yjg/my-select";
import { MyButton } from "@/components/yjg/my-button";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import {
  초재진_OPTIONS,
  청구_OPTIONS,
  주간야간휴일구분_OPTIONS,
  진료결과_OPTIONS,
} from "@/constants/common/common-option";
import {
  청구,
  초재진,
  주간야간휴일구분,
  진료결과,
  보험구분상세,
  접수상태,
} from "@/constants/common/common-enum";
import type { Encounter } from "@/types/chart/encounter-types";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useReceptionStore } from "@/store/reception";
import { cn } from "@/lib/utils";
import { formatDateToString, formatUTCtoKSTDate } from "@/lib/date-utils";
import MyPopup from "@/components/yjg/my-pop-up";

export type MedicalRecordPrintMode = "agent" | "local";

const SHOW_COMPLETE_MESSAGE_TIME = 1500;

export interface FooterBottomValues {
  receptionType: 초재진;
  isClaim: boolean;
  timeCategory: 주간야간휴일구분;
  resultType: 진료결과;
}

export function FooterBottom({
  encounter,
  values: valuesProp,
  onSave,
  isSaving,
  isSaved,
  onSaveAndTransmit,
  isSavingAndTransmitting,
  isSavedAndTransmitted,
  onPrintAndTransmit,
  isPrintingAndTransmitting,
  isPrintAndTransmitted,
  onValuesChange,
  isChartCheck = false,
}: {
  encounter: Encounter;
  values?: FooterBottomValues | null;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
  onSaveAndTransmit: () => void;
  isSavingAndTransmitting: boolean;
  isSavedAndTransmitted: boolean;
  onPrintAndTransmit: () => void;
  isPrintingAndTransmitting: boolean;
  isPrintAndTransmitted: boolean;
  onValuesChange?: (values: FooterBottomValues) => void;
  isChartCheck?: boolean;
}) {
  const { currentRegistration } = useReceptionStore();

  // 청구구분 결정: 일반(비급여)이면 항상 비청구, 그 외는 isClaim이 명시적 false일 때만 비청구
  const resolve청구 = (isClaim: boolean | undefined | null, insuranceType?: number) => {
    if (insuranceType === 보험구분상세.일반) return 청구.비청구;
    return isClaim ? 청구.청구 : 청구.비청구;
  };

  const [초재진구분, set초재진구분] = useState<number>(
    encounter.receptionType ?? 초재진.초진
  );
  const [청구구분, set청구구분] = useState<number>(
    resolve청구(encounter.isClaim, currentRegistration?.insuranceType)
  );
  const [주야공구분, set주야공구분] = useState<number>(
    encounter.timeCategory ?? 주간야간휴일구분.주간
  );
  const [진료결과구분, set진료결과구분] = useState<number>(() => {
    const v = encounter.resultType as number | undefined;
    return v === 0 || v == null ? 진료결과.계속 : v;
  });

  // 부모에서 values 전달 시 동기화 (예: 비청구 확인 팝업에서 isClaim false 적용 시 UI 즉시 반영)
  useEffect(() => {
    if (valuesProp != null) {
      set초재진구분(valuesProp.receptionType);
      set청구구분(resolve청구(valuesProp.isClaim, currentRegistration?.insuranceType));
      set주야공구분(valuesProp.timeCategory);
      set진료결과구분(
        (valuesProp.resultType as number) === 0 || valuesProp.resultType == null
          ? 진료결과.계속
          : valuesProp.resultType
      );
    }
  }, [
    valuesProp?.receptionType,
    valuesProp?.isClaim,
    valuesProp?.timeCategory,
    valuesProp?.resultType,
    currentRegistration?.insuranceType,
  ]);

  // encounter가 변경되면 로컬 상태 초기화 (valuesProp이 없을 때)
  useEffect(() => {
    if (encounter && valuesProp == null) {
      set초재진구분(encounter.receptionType ?? 초재진.초진);
      set청구구분(resolve청구(encounter.isClaim, currentRegistration?.insuranceType));
      set주야공구분(encounter.timeCategory ?? 주간야간휴일구분.주간);
      set진료결과구분(
        (encounter.resultType as number) === 0 || encounter.resultType == null
          ? 진료결과.계속
          : encounter.resultType
      );
    }
  }, [encounter?.id, currentRegistration?.insuranceType, valuesProp == null]);

  // 로컬 상태가 변경되면 부모에게 알림
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;
  useEffect(() => {
    onValuesChangeRef.current?.({
      receptionType: 초재진구분 as 초재진,
      isClaim: 청구구분 === 청구.청구,
      timeCategory: 주야공구분 as 주간야간휴일구분,
      resultType: 진료결과구분 as 진료결과,
    });
  }, [초재진구분, 청구구분, 주야공구분, 진료결과구분]);

  // 진행중 → 완료 전환 시 "완료" 1초 표시
  const prevIsSaving = useRef(false);
  const prevIsSavingAndTransmitting = useRef(false);
  const prevIsPrintingAndTransmitting = useRef(false);
  const [showSaveComplete, setShowSaveComplete] = useState(false);
  const [showSaveAndTransmitComplete, setShowSaveAndTransmitComplete] = useState(false);
  const [showPrintAndTransmitComplete, setShowPrintAndTransmitComplete] = useState(false);

  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saveConfirmMessage, setSaveConfirmMessage] = useState("");
  const [pendingSaveAction, setPendingSaveAction] = useState<
    "save" | "saveAndTransmit" | "printAndTransmit" | null
  >(null);

  const todayDate = formatDateToString(new Date());
  const encounterDate = encounter.encounterDateTime
    ? formatUTCtoKSTDate(encounter.encounterDateTime)
    : "";
  const isPreviousDate = Boolean(encounterDate && encounterDate !== todayDate);
  const isPaymentComplete =
    currentRegistration?.status === 접수상태.수납완료;

  const getConfirmMessage = (
    actionLabel: "저장" | "저장전달" | "출력전달"
  ): string => {
    if (isPaymentComplete && isPreviousDate) {
      return `수납이 완료된 진료이며 이전 날짜의 진료입니다. 그래도 ${actionLabel}하시겠습니까?`;
    }
    if (isPaymentComplete) {
      return `수납이 완료된 진료입니다. 그래도 ${actionLabel}하시겠습니까?`;
    }
    if (isPreviousDate) {
      return `이전 날짜의 진료입니다. 그래도 ${actionLabel}하시겠습니까?`;
    }
    return "";
  };

  const runPendingAction = () => {
    if (pendingSaveAction === "save") onSave();
    else if (pendingSaveAction === "saveAndTransmit") onSaveAndTransmit();
    else if (pendingSaveAction === "printAndTransmit") onPrintAndTransmit();
    setPendingSaveAction(null);
    setSaveConfirmOpen(false);
  };

  const handleSaveClick = () => {
    const msg = getConfirmMessage("저장");
    if (msg) {
      setSaveConfirmMessage(msg);
      setPendingSaveAction("save");
      setSaveConfirmOpen(true);
    } else {
      onSave();
    }
  };

  const handleSaveAndTransmitClick = () => {
    const msg = getConfirmMessage("저장전달");
    if (msg) {
      setSaveConfirmMessage(msg);
      setPendingSaveAction("saveAndTransmit");
      setSaveConfirmOpen(true);
    } else {
      onSaveAndTransmit();
    }
  };

  const handlePrintAndTransmitClick = () => {
    const msg = getConfirmMessage("출력전달");
    if (msg) {
      setSaveConfirmMessage(msg);
      setPendingSaveAction("printAndTransmit");
      setSaveConfirmOpen(true);
    } else {
      onPrintAndTransmit();
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (prevIsSaving.current && !isSaving && isSaved) {
      prevIsSaving.current = isSaving;
      setShowSaveComplete(true);
      timeoutId = setTimeout(() => setShowSaveComplete(false), SHOW_COMPLETE_MESSAGE_TIME);
    } else {
      prevIsSaving.current = isSaving;
    }
    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [isSaving, isSaved]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (
      prevIsSavingAndTransmitting.current &&
      !isSavingAndTransmitting &&
      isSavedAndTransmitted
    ) {
      prevIsSavingAndTransmitting.current = isSavingAndTransmitting;
      setShowSaveAndTransmitComplete(true);
      timeoutId = setTimeout(() => setShowSaveAndTransmitComplete(false), SHOW_COMPLETE_MESSAGE_TIME);
    } else {
      prevIsSavingAndTransmitting.current = isSavingAndTransmitting;
    }
    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [isSavingAndTransmitting, isSavedAndTransmitted]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (
      prevIsPrintingAndTransmitting.current &&
      !isPrintingAndTransmitting &&
      isPrintAndTransmitted
    ) {
      prevIsPrintingAndTransmitting.current = isPrintingAndTransmitting;
      setShowPrintAndTransmitComplete(true);
      timeoutId = setTimeout(() => setShowPrintAndTransmitComplete(false), SHOW_COMPLETE_MESSAGE_TIME);
    } else {
      prevIsPrintingAndTransmitting.current = isPrintingAndTransmitting;
    }
    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [isPrintingAndTransmitting, isPrintAndTransmitted]);

  return (
    <div className={cn(
      "flex flex-wrap flex-row justify-between items-center gap-2",
      isChartCheck ? "border-none py-[4px]" : "border-t border-[var(--border-1)] p-2"
    )}>
      <div className="flex flex-row gap-2">
        <MySelect
          options={초재진_OPTIONS}
          value={초재진구분}
          onChange={(value) => {
            set초재진구분(value as number);
          }}
        />
        <MySelect
          options={청구_OPTIONS}
          value={청구구분}
          disabled={currentRegistration?.insuranceType === 보험구분상세.일반}
          onChange={(value) => {
            set청구구분(value as number);
          }}
        />
        <MySelect
          options={주간야간휴일구분_OPTIONS}
          value={주야공구분}
          onChange={(value) => {
            set주야공구분(value as number);
          }}
        />
        <MySelect
          options={진료결과_OPTIONS}
          value={진료결과구분}
          onChange={(value) => {
            set진료결과구분(value as number);
          }}
        />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <div className="flex flex-row items-center gap-[2px]">
          {(isSavedAndTransmitted || isPrintAndTransmitted) && (
            <div
              className="flex flex-row items-center gap-[2px] text-[12px] text-[var(--info)] font-semibold bg-[var(--blue-4)] px-[5px] py-[2px] rounded-[4px]"
              data-testid="medical-transmit-complete-indicator"
            >
              <CheckIcon className="w-[10px] h-[10px]" />
              전달 완료
            </div>
          )}
        </div>
        <MyButton
          variant="outline"
          onClick={handleSaveClick}
          disabled={isSaving}
          className={cn(
            "gap-[2px] border-[var(--btn-primary-bg)]",
            (isSaving || showSaveComplete) && "bg-[var(--blue-2)] text-white"
          )}
        >
          <span>
            {showSaveComplete ? "저장 완료" : isSaving ? "저장중..." : "저장"}
          </span>
          {isSaving && <MyLoadingSpinner size="sm" />}
        </MyButton>
        <MyButton
          variant="outline"
          onClick={handleSaveAndTransmitClick}
          data-testid="medical-save-and-transmit-button"
          data-state={
            showSaveAndTransmitComplete
              ? "completed"
              : isSavingAndTransmitting
                ? "loading"
                : "idle"
          }
          disabled={isSavingAndTransmitting}
          className={cn(
            "gap-[2px] border-[var(--btn-primary-bg)]",
            (isSavingAndTransmitting || showSaveAndTransmitComplete) &&
            "bg-[var(--blue-2)] text-white"
          )}
        >
          <span>
            {showSaveAndTransmitComplete
              ? "저장전달 완료"
              : isSavingAndTransmitting
                ? "저장전달중..."
                : "저장전달"}
          </span>
          {isSavingAndTransmitting && <MyLoadingSpinner size="sm" />}
        </MyButton>
        <MyButton
          onClick={handlePrintAndTransmitClick}
          disabled={isPrintingAndTransmitting}
          className={cn(
            "gap-[2px]",
            (isPrintingAndTransmitting || showPrintAndTransmitComplete) &&
            "bg-[var(--blue-2)] text-white"
          )}
        >
          <span>
            {showPrintAndTransmitComplete
              ? "출력전달 완료"
              : isPrintingAndTransmitting
                ? "출력전달중..."
                : "출력전달"}
          </span>
          {isPrintingAndTransmitting && <MyLoadingSpinner size="sm" />}
        </MyButton>
      </div>

      <MyPopup
        isOpen={saveConfirmOpen}
        onCloseAction={() => {
          setSaveConfirmOpen(false);
          setPendingSaveAction(null);
        }}
        hideHeader={true}
        fitContent={true}
      >
        <div className="flex flex-col gap-[20px] min-w-[300px]">
          <div className="flex-1 flex flex-col gap-1 px-2 py-1">
            <div className="text-base text-[var(--text-primary)]">
              {saveConfirmMessage}
            </div>
          </div>
          <div className="flex justify-end gap-[10px]">
            <MyButton
              data-testid="medical-save-confirm-cancel-button"
              variant="outline"
              onClick={() => {
                setSaveConfirmOpen(false);
                setPendingSaveAction(null);
              }}
            >
              아니오
            </MyButton>
            <MyButton data-testid="medical-save-confirm-button" onClick={runPendingAction}>예</MyButton>
          </div>
        </div>
      </MyPopup>
    </div>
  );
}
