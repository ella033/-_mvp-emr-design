import HealthMedical from "@/components/medical-info/health-medical";
import BohoMedical from "@/components/medical-info/boho-medical";
import SecondMedical from "@/components/medical-info/second-medical";
import GeneralMedical from "@/components/medical-info/general-medical";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { 보험구분상세 } from "@/constants/common/common-enum";
import { useEffect } from "react";
import { useClear } from "@/contexts/ClearContext";
import { useComponentState } from "@/hooks/common/use-component-state";
import { useMedicalInfoReception } from "@/hooks/reception/patient-info/use-medical-info-reception";
import type { Reception } from "@/types/common/reception-types";
import { cn } from "@/lib/utils";

interface MedicalInfoProps {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  /** 외부에서 주입할 insuranceInfo */
  insuranceInfo?: Partial<InsuranceInfo>;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
  /** 마지막 포커스 섹션 하이라이트 */
  isHighlighted?: boolean;
}

export default function MedicalInfo({
  reception: externalReception,
  receptionId: externalReceptionId,
  insuranceInfo: externalInsuranceInfo,
  isDisabled = false,
  onUpdateReception,
  isHighlighted = false,
}: MedicalInfoProps) {
  // Hook을 통해 reception 선택 및 관리
  const {
    activeReceptionId,
    currentInsuranceInfo,
    handleInsuranceDataChange,
    clearInsuranceInfo,
    selectedDate,
    isPregnancyInfertilityEnabled,
  } = useMedicalInfoReception({
    reception: externalReception,
    receptionId: externalReceptionId,
    insuranceInfo: externalInsuranceInfo,
    onUpdateReception,
  });

  // Clear Context 등록
  const { registerMyClear, unregisterMyClear } = useClear("medical-info");

  // Component State 관리
  const { getContainerProps } = useComponentState();

  // Clear 함수 등록/해제
  useEffect(() => {
    registerMyClear(clearInsuranceInfo);
    return () => {
      unregisterMyClear();
    };
  }, [registerMyClear, unregisterMyClear, clearInsuranceInfo]);

  // uDeptDetail에 따라 적절한 컴포넌트를 렌더링하는 함수
  const renderInsuranceComponent = () => {
    // activeReceptionId가 없는 경우에만 GeneralMedical 렌더링
    if (!activeReceptionId) {
      return (
        <GeneralMedical
          key="general-empty"
          currentInsuranceInfo={undefined}
          onInsuranceDataChange={handleInsuranceDataChange}
          isDisabled={isDisabled}
          selectedDate={selectedDate}
          pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
        />
      );
    }

    // currentInsuranceInfo가 없거나 uDeptDetail이 없는 경우 GeneralMedical 렌더링
    if (!currentInsuranceInfo || !currentInsuranceInfo.uDeptDetail) {
      return (
        <GeneralMedical
          key={activeReceptionId || "general-empty"}
          currentInsuranceInfo={currentInsuranceInfo}
          onInsuranceDataChange={handleInsuranceDataChange}
          isDisabled={isDisabled}
          selectedDate={selectedDate}
          pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
        />
      );
    }

    // uDeptDetail 값이 있으면 신규환자든 기존환자든 해당하는 컴포넌트 렌더링
    const uDeptDetail = currentInsuranceInfo.uDeptDetail as 보험구분상세;
    switch (uDeptDetail) {
      case 보험구분상세.일반:
        return (
          <GeneralMedical
            key={activeReceptionId}
            currentInsuranceInfo={currentInsuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={isDisabled}
            selectedDate={selectedDate}
            pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
          />
        );

      case 보험구분상세.국민공단:
      case 보험구분상세.직장조합:
        return (
          <HealthMedical
            key={activeReceptionId}
            currentInsuranceInfo={currentInsuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={isDisabled}
            selectedDate={selectedDate}
            pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
          />
        );

      case 보험구분상세.의료급여1종:
      case 보험구분상세.의료급여2종:
      case 보험구분상세.의료급여2종장애:
        return (
          <BohoMedical
            key={activeReceptionId}
            currentInsuranceInfo={currentInsuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={isDisabled}
            selectedDate={selectedDate}
            pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
          />
        );

      case 보험구분상세.차상위1종:
      case 보험구분상세.차상위2종:
      case 보험구분상세.차상위2종장애:
        return (
          <SecondMedical
            key={activeReceptionId}
            currentInsuranceInfo={currentInsuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={isDisabled}
            selectedDate={selectedDate}
            pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
          />
        );

      default:
        return (
          <GeneralMedical
            key={activeReceptionId}
            currentInsuranceInfo={currentInsuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={isDisabled}
            selectedDate={selectedDate}
            pregnancyInfertilityEnabled={isPregnancyInfertilityEnabled}
          />
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col w-full bg-[var(--bg-1)] p-1 rounded-md border border-transparent transition-colors",
      "focus-within:border-[var(--main-color-2-1)] focus-within:bg-[var(--bg-base1)]",
      isHighlighted && "border-[var(--main-color-2-1)] bg-[var(--bg-base1)]"
    )}>
      <div className="text-[13px] font-semibold p-2 pb-0 text-[var(--gray-100)]">
        보험정보
      </div>

      {/* 보험정보 컴포넌트 추가 */}
      <div {...getContainerProps("p-2 pt-1")}>{renderInsuranceComponent()}</div>
    </div>
  );
}
