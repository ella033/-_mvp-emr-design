import { useMemo, useCallback } from "react";
import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { 보험구분상세, 본인부담구분코드, 성별 } from "@/constants/common/common-enum";
import { useBoardPatientRuntime } from "@/components/reception/board-patient/board-patient-runtime-context";

/**
 * MedicalInfo 컴포넌트용 Reception Hook
 */
export function useMedicalInfoReception(options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  /** 외부에서 주입할 insuranceInfo */
  insuranceInfo?: Partial<InsuranceInfo>;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
}) {
  const { selectedReception, activeReceptionId } = useSelectedReception({
    reception: options?.reception,
    receptionId: options?.receptionId,
  });

  // 최신 reception 가져오기 (insuranceInfo 계산을 위해)
  const latestReception = useMemo(() => {
    if (options?.reception !== undefined) {
      return options.reception;
    }
    return null;
  }, [options?.reception, selectedReception]);

  const currentInsuranceInfo = useMemo(() => {
    return options?.insuranceInfo || latestReception?.insuranceInfo;
  }, [options?.insuranceInfo, latestReception?.insuranceInfo]);

  const finalActiveReceptionId =
    options?.receptionId || activeReceptionId || "";

  const { dirty } = useBoardPatientRuntime();

  // 변경 감지 헬퍼: 한 번만 markReceptionAsChanged 호출
  const markChangedOnce = useCallback(() => {
    if (!finalActiveReceptionId) return;
    if (!dirty.hasChanges(finalActiveReceptionId)) {
      dirty.markChanged(finalActiveReceptionId);
    }
  }, [
    finalActiveReceptionId,
    dirty,
  ]);

  // insuranceInfo 업데이트 핸들러 (변경 감지 포함)
  const handleInsuranceDataChange = useCallback((data: Partial<InsuranceInfo>) => {
    if (!finalActiveReceptionId) return;

    // 변경 감지: 한 번만 markReceptionAsChanged 호출
    markChangedOnce();
    if (options?.receptionId && options?.onUpdateReception) {
      options.onUpdateReception({
        insuranceInfo: {
          ...latestReception?.insuranceInfo,
          ...data,
        } as InsuranceInfo,
      });
    } 
  }, [finalActiveReceptionId, options?.receptionId, options?.onUpdateReception, latestReception?.insuranceInfo, markChangedOnce]);

  // Clear 함수용 핸들러 (insuranceInfo 초기화)
  const clearInsuranceInfo = () => {
    if (!finalActiveReceptionId || !selectedReception) return;

    const resetInsuranceInfo = {
      extraQualification: {},
      // eligibilityCheck는 EligibilityCheck 타입이라 여기서는 건드리지 않음
      cardNumber: "",
      unionCode: "",
      unionName: "",
      father: "",
      fatherRrn: "",
      cfcd: 본인부담구분코드.해당없음,
      uDeptDetail: 보험구분상세.일반,
    };

    if (options?.receptionId && options?.onUpdateReception) {
      options.onUpdateReception({
        insuranceInfo: {
          ...latestReception?.insuranceInfo,
          ...resetInsuranceInfo,
        } as InsuranceInfo,
      });
    } 
  };

  /** 진료일(접수일시). 임신부 주차 계산 등에 사용 */
  const selectedDate = useMemo(() => {
    const reception = options?.reception ?? selectedReception;
    const dt = (reception as Reception | null)?.receptionDateTime;
    if (dt == null) return undefined;
    return dt instanceof Date ? dt : new Date(dt);
  }, [options?.reception, selectedReception]);

  /** 환자 성별이 여성일 때만 임신부/난임치료 체크박스 활성화 */
  const isPregnancyInfertilityEnabled = useMemo(() => {
    const reception = (options?.reception ?? selectedReception) as Reception | null;
    const gender = reception?.patientBaseInfo?.gender;
    return gender === 성별.여;
  }, [options?.reception, selectedReception]);

  return {
    selectedReception,
    activeReceptionId,
    currentInsuranceInfo,
    handleInsuranceDataChange,
    clearInsuranceInfo,
    selectedDate,
    isPregnancyInfertilityEnabled,
  };
}
