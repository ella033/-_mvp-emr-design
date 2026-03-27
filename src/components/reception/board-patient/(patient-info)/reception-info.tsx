"use client";

import React, { useMemo, useEffect, useState, useRef } from "react";
import { useFacilityStore } from "@/store/facility-store";
import type { Facility } from "@/types/facility-types";
import {
  공간코드,
  주간야간휴일구분,
  주간야간휴일구분Label,
  초재진,
  초재진Label,
  DetailCategoryTypeLabel,
  DetailCategoryType,
} from "@/constants/common/common-enum";
import { useClear } from "@/contexts/ClearContext";
import { useComponentState } from "@/hooks/common/use-component-state";
import { useReceptionInfoReception } from "@/hooks/reception/patient-info/use-reception-info-reception";
import DrugSeparationExceptionCodePopup from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-popup";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import type { Reception } from "@/types/common/reception-types";
import { PANEL_TYPE } from "@/constants/reception";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReceptionInfoProps {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
  /** 마지막 포커스 섹션 하이라이트 */
  isHighlighted?: boolean;
}

export default function ReceptionInfo({
  reception: externalReception,
  receptionId: externalReceptionId,
  isDisabled = false,
  onUpdateReception,
  isHighlighted = false,
}: ReceptionInfoProps) {
  const { getTreatmentFacilities } = useFacilityStore();

  // Hook을 통해 reception 선택 및 관리
  const {
    selectedReception: currentReception,
    activeReceptionId,
    currentPatientInfo,
    handleReceptionInfoChange,
    handleInsuranceInfoChange,
    handlePatientBaseInfoChange,
    clearReceptionInfo: clearReceptionInfoFromHook,
    markChangedOnce,
  } = useReceptionInfoReception({
    reception: externalReception,
    receptionId: externalReceptionId,
    onUpdateReception,
  });

  // Local states
  const [localFacilityId, setLocalFacilityId] = useState<number>(0);
  const [localTimeCategory, setLocalTimeCategory] = useState<number>(주간야간휴일구분.주간);
  const [localReceptionType, setLocalReceptionType] = useState<number>(초재진.초진);
  const [localDetailCategory, setLocalDetailCategory] = useState<number>(DetailCategoryType.없음);
  const [localClinicChronicMng, setLocalClinicChronicMng] = useState<boolean>(false);

  // 초기값 refs (Dirty 감지용)
  const initialFacilityIdRef = useRef<number>(0);
  const initialTimeCategoryRef = useRef<number>(주간야간휴일구분.주간);
  const initialReceptionTypeRef = useRef<number>(초재진.초진);
  const initialDetailCategoryRef = useRef<number>(DetailCategoryType.없음);
  const initialExceptionCodeRef = useRef<string>("없음");
  const initialClinicChronicMngRef = useRef<boolean>(false);

  // Modal state
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);

  // Clear Context 등록
  const { registerMyClear, unregisterMyClear } = useClear("reception-info");

  // Component State 관리
  const { getContainerProps } = useComponentState();


  // Clear 함수 정의 - 드롭다운들을 초기값으로 설정
  const clearReceptionInfo = () => {
    if (currentReception && currentPatientInfo) {
      clearReceptionInfoFromHook(defaultFacilityId);
    }
  };

  // Clear 함수 등록/해제
  useEffect(() => {
    registerMyClear(clearReceptionInfo);
    return () => {
      unregisterMyClear();
    };
  }, [registerMyClear, unregisterMyClear, clearReceptionInfo]);

  const sortedTreatmentFacilities = getTreatmentFacilities(공간코드.진료);

  // 진료실이 없는 경우 안내 로그
  if (sortedTreatmentFacilities.length === 0) {
  }

  // 기본값들 계산
  const defaultFacilityId = useMemo(() => {
    return sortedTreatmentFacilities.length > 0
      ? (sortedTreatmentFacilities[0]?.id ?? 0)
      : 0;
  }, [sortedTreatmentFacilities]);

  // Local state 동기화 (props reception 우선) + 초기값 저장
  useEffect(() => {
    const facilityId = currentPatientInfo?.facilityId || defaultFacilityId;
    setLocalFacilityId(facilityId);
    initialFacilityIdRef.current = facilityId;
  }, [currentPatientInfo?.facilityId, defaultFacilityId]);

  useEffect(() => {
    const timeCategory = currentReception?.receptionInfo?.timeCategory || 주간야간휴일구분.주간;
    setLocalTimeCategory(timeCategory);
    initialTimeCategoryRef.current = timeCategory;
  }, [currentReception?.receptionInfo?.timeCategory]);

  useEffect(() => {
    const receptionType = currentReception?.receptionInfo?.receptionType || 초재진.초진;
    setLocalReceptionType(receptionType);
    initialReceptionTypeRef.current = receptionType;
  }, [currentReception?.receptionInfo?.receptionType]);

  useEffect(() => {
    const detailCategory = currentReception?.receptionInfo?.detailCategory || DetailCategoryType.없음;
    setLocalDetailCategory(detailCategory);
    initialDetailCategoryRef.current = detailCategory;
  }, [currentReception?.receptionInfo?.detailCategory]);

  useEffect(() => {
    const value =
      currentReception?.insuranceInfo?.is의원급만성질환관리제 || false;
    setLocalClinicChronicMng(value);
    initialClinicChronicMngRef.current = value;
  }, [currentReception?.insuranceInfo?.is의원급만성질환관리제]);

  // Exception code는 모달에서만 변경되므로 별도 동기화 불필요
  useEffect(() => {
    if (currentReception?.receptionInfo) {
      initialExceptionCodeRef.current = currentReception.receptionInfo.exceptionCode || "없음";
    }
  }, [currentReception?.receptionInfo?.exceptionCode]);

  // 현재 값들 계산 (기본값 fallback 포함) - 예외 코드만 사용
  const currentPatientException =
    currentReception?.receptionInfo?.exceptionCode || "없음";

  // 기본값 자동 설정 (신규환자가 아닌 경우에만)
  useEffect(() => {
    if (
      currentPatientInfo &&
      defaultFacilityId > 0 &&
      activeReceptionId !== "new"
    ) {
      const needsUpdate = {
        ...((!currentPatientInfo.facilityId ||
          currentPatientInfo.facilityId === 0) &&
          defaultFacilityId > 0 && {
          facilityId: defaultFacilityId,
          // roomPanel이 이미 설정되어 있으면 유지, 없으면 "treatment"로 설정
          roomPanel: currentPatientInfo.roomPanel || PANEL_TYPE.TREATMENT,
        }),
      };

      if (Object.keys(needsUpdate).length > 0) {
        // 자동 초기화이므로 dirty marking을 건너뜀 (수정중 표시 방지)
        handlePatientBaseInfoChange(needsUpdate, { skipDirty: true });
      }
    }
  }, [
    currentPatientInfo,
    defaultFacilityId,
    handlePatientBaseInfoChange,
    activeReceptionId,
  ]);

  const handleSelectChange = (field: string, value: string) => {
    if (field === "facilityId") {
      handlePatientBaseInfoChange({
        [field]: Number(value),
        // roomPanel이 이미 설정되어 있으면 유지, 없으면 "treatment"로 설정
        roomPanel: currentReception?.patientBaseInfo?.roomPanel || PANEL_TYPE.TREATMENT,
      });
    } else {
      handleReceptionInfoChange({
        [field]: Number(value),
      });
    }
  };

  const editableBgClass = isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]";


  return (
    <div className={cn(
      "flex flex-col w-full bg-[var(--bg-1)] p-1 rounded-md border border-transparent transition-colors",
      "focus-within:border-[var(--main-color-2-1)] focus-within:bg-[var(--bg-base1)]",
      isHighlighted && "border-[var(--main-color-2-1)] bg-[var(--bg-base1)]"
    )}>
      <div className="text-[13px] font-semibold p-2 pb-0 text-[var(--gray-100)]">
        진료정보</div>
      <div {...getContainerProps("p-2 pt-0 space-y-2")}>
        {/* 1줄: 진료실 / 주·야·휴 / 진찰료산정 */}
        <div className="grid grid-cols-[72px_1fr_78px_1fr_78px_1fr] gap-3 items-center">
          {/* col1 */}
          <label className="text-sm text-[var(--gray-300)] shrink-0">
            진료실<span className="text-[var(--negative)]"> *</span>
          </label>
          {/* col2 */}
          <select
            className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-full ${editableBgClass}`}
            value={localFacilityId || defaultFacilityId}
            onFocus={(e) => {
              e.target.setAttribute(
                "data-previous-value",
                String(localFacilityId || defaultFacilityId)
              );
            }}
            onChange={(e) => {
              if (document.activeElement === e.target) {
                const value = Number(e.target.value);
                setLocalFacilityId(value);
                markChangedOnce();
              }
            }}
            onBlur={(e) => {
              const currentValue = Number(e.target.value);
              if (currentValue !== initialFacilityIdRef.current) {
                handleSelectChange("facilityId", String(currentValue));
              }
            }}
            disabled={isDisabled}
          >
            {sortedTreatmentFacilities.length === 0 ? (
              <option value="0">진료실 없음</option>
            ) : (
              sortedTreatmentFacilities.map((facilityDetail: Facility) => (
                <option key={facilityDetail.id} value={facilityDetail.id}>
                  {facilityDetail.name}
                </option>
              ))
            )}
          </select>

          {/* col3 */}
          <label className="text-sm text-[var(--gray-300)] shrink-0">
            주/야/휴
          </label>
          {/* col4 */}
          <select
            className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-full ${editableBgClass}`}
            value={localTimeCategory}
            onFocus={(e) => {
              e.target.setAttribute("data-previous-value", String(localTimeCategory));
            }}
            onChange={(e) => {
              if (document.activeElement === e.target) {
                const value = Number(e.target.value);
                setLocalTimeCategory(value);
                markChangedOnce();
              }
            }}
            onBlur={(e) => {
              const currentValue = Number(e.target.value);
              if (currentValue !== initialTimeCategoryRef.current) {
                handleSelectChange("timeCategory", String(currentValue));
              }
            }}
            disabled={isDisabled}
          >
            {Object.entries(주간야간휴일구분Label).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* col5 */}
          <label className="text-sm text-[var(--gray-300)] shrink-0">
            진찰료산정
          </label>
          {/* col6 */}
          <select
            className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-full ${editableBgClass}`}
            value={localReceptionType}
            onFocus={(e) => {
              e.target.setAttribute("data-previous-value", String(localReceptionType));
            }}
            onChange={(e) => {
              if (document.activeElement === e.target) {
                const value = Number(e.target.value);
                setLocalReceptionType(value);
                markChangedOnce();
              }
            }}
            onBlur={(e) => {
              const currentValue = Number(e.target.value);
              if (currentValue !== initialReceptionTypeRef.current) {
                handleSelectChange("receptionType", String(currentValue));
              }
            }}
            disabled={isDisabled}
          >
            {Object.entries(초재진Label)
              .filter(([key]) => key !== "0")
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
        </div>

        {/* 2줄: 상세구분 / 환자예외 */}
        <div className="grid grid-cols-[72px_1fr_78px_1fr_78px_1fr] gap-3 items-center">
          {/* col1 */}
          <label className="text-sm text-[var(--gray-300)] shrink-0">
            상세구분
          </label>
          {/* col2~3 */}
          <select
            className={`col-span-2 text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-full ${editableBgClass}`}
            value={localDetailCategory}
            onFocus={(e) => {
              e.target.setAttribute("data-previous-value", String(localDetailCategory));
            }}
            onChange={(e) => {
              if (document.activeElement === e.target) {
                const value = Number(e.target.value);
                setLocalDetailCategory(value);
                markChangedOnce();
              }
            }}
            onBlur={(e) => {
              const currentValue = Number(e.target.value);
              if (currentValue !== initialDetailCategoryRef.current) {
                handleSelectChange("detailCategory", String(currentValue));
              }
            }}
            disabled={isDisabled}
          >
            {Object.entries(DetailCategoryTypeLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* col4 */}
          <label className="text-sm text-[var(--gray-300)] shrink-0">
            환자예외
          </label>
          {/* col5~6 */}
          <select
            className={`col-span-2 text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-full cursor-pointer ${editableBgClass}`}
            value={currentPatientException}
            onMouseDown={(e) => {
              if (!isDisabled) {
                e.preventDefault();
                setIsExceptionModalOpen(true);
              }
            }}
            onChange={(e) => {
              e.preventDefault();
            }}
            disabled={isDisabled}
          >
            <option value="없음">없음</option>
            {currentPatientException !== "없음" && (
              <option value={currentPatientException}>
                {currentPatientException}
              </option>
            )}
          </select>
        </div>

        {/* 3줄: 만성질환 */}
        <div className="grid grid-cols-[72px_1fr_78px_1fr_78px_1fr] gap-2 items-center">
          {/* col1 */}
          <label className="text-sm text-[var(--gray-300)] shrink-0">
            만성질환
          </label>
          {/* col2~3 */}
          <div className="col-span-2 flex items-center gap-2 min-w-0">
            <label className="flex items-center gap-1 text-sm text-[var(--gray-100)] whitespace-nowrap">
              <Input
                type="checkbox"
                className="border-[var(--border-2)]"
                checked={localClinicChronicMng}
                onFocus={(e) => {
                  e.target.setAttribute(
                    "data-previous-value",
                    String(localClinicChronicMng)
                  );
                }}
                onChange={(e) => {
                  if (document.activeElement === e.target) {
                    const value = e.target.checked;
                    setLocalClinicChronicMng(value);
                    markChangedOnce();
                  }
                }}
                onBlur={(e) => {
                  const currentValue = e.target.checked;
                  if (
                    currentValue !== initialClinicChronicMngRef.current &&
                    currentReception
                  ) {
                    handleInsuranceInfoChange({
                      is의원급만성질환관리제: currentValue,
                    });
                  }
                }}
                disabled={isDisabled}
              />
              의원급 만성질환 관리제
            </label>
          </div>
          {/* col4~6 빈칸 */}
          <div className="col-span-3" />
        </div>
      </div>

      {isExceptionModalOpen && (
        <DrugSeparationExceptionCodePopup
          type={DrugSeparationExceptionCodeType.Patient}
          setOpen={setIsExceptionModalOpen}
          currentExceptionCode={currentPatientException}
          setExceptionCode={(value: string) => {
            // 변경 감지: 한 번만 markReceptionAsChanged 호출
            markChangedOnce();
            // 최종 저장: 즉시 저장 (모달에서 선택 완료 시점)
            handleReceptionInfoChange({
              exceptionCode: value,
            });
          }}
        />
      )}
    </div>
  );
}
