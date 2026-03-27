import { useMemo, useState, useEffect, useCallback } from "react";
import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";
import { useBoardPatientRuntime } from "@/components/reception/board-patient/board-patient-runtime-context";
import {
  주간야간휴일구분,
  초재진,
  DetailCategoryType,
} from "@/constants/common/common-enum";
import { PANEL_TYPE } from "@/constants/reception";

/**
 * ReceptionInfo 컴포넌트용 Reception Hook
 * 
 * Props로 reception이 전달되면 우선 사용하고,
 * 없으면 store에서 조회합니다.
 */
export function useReceptionInfoReception(options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
}) {

  const { selectedReception, activeReceptionId } = useSelectedReception({
    reception: options?.reception,
    receptionId: options?.receptionId,
  });

  // 현재 활성화된 reception ID 계산
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

  const [localReception, setLocalReception] = useState<Reception | null>(
    options?.receptionId && options?.reception ? options.reception : null
  );

  useEffect(() => {
    if (options?.receptionId && options?.reception) {
      setLocalReception(options.reception);
    }
  }, [options?.reception, options?.receptionId]);

  // 외부 receptionId가 있으면 로컬 상태를 우선 사용, 없으면 selectedReception 사용
  const currentReception = useMemo(() => {
    if (options?.receptionId && localReception) {
      return localReception;
    }
    return selectedReception;
  }, [options?.receptionId, localReception, selectedReception]);

  const currentPatientInfo = currentReception?.patientBaseInfo;

  // receptionInfo 업데이트 핸들러
  const handleReceptionInfoChange = (data: Partial<Reception["receptionInfo"]>) => {
    if (!finalActiveReceptionId || !currentReception) return;

    // 변경 감지: 한 번만 markReceptionAsChanged 호출
    markChangedOnce();

    // 외부 receptionId가 있고 콜백이 있으면 콜백 사용, 아니면 store 업데이트
    if (options?.receptionId && options?.onUpdateReception) {
      const updatedReception: Reception = {
        ...currentReception,
        receptionInfo: {
          ...currentReception.receptionInfo,
          ...data,
        },
      };
      // 로컬 상태 업데이트
      setLocalReception(updatedReception);
      // 콜백 호출
      options.onUpdateReception({
        receptionInfo: updatedReception.receptionInfo,
      });
    }
  };

  // insuranceInfo 업데이트 핸들러
  const handleInsuranceInfoChange = (data: Partial<Reception["insuranceInfo"]>) => {
    if (!finalActiveReceptionId || !currentReception) return;

    // 변경 감지: 한 번만 markReceptionAsChanged 호출
    markChangedOnce();

    if (options?.receptionId && options?.onUpdateReception) {
      const updatedReception: Reception = {
        ...currentReception,
        insuranceInfo: {
          ...currentReception.insuranceInfo,
          ...data,
        },
      };
      // 로컬 상태 업데이트
      setLocalReception(updatedReception);
      // 콜백 호출
      options.onUpdateReception({
        insuranceInfo: updatedReception.insuranceInfo,
      });
    }
  };

  // patientBaseInfo 업데이트 핸들러
  // skipDirty: 자동 초기화(기본값 설정 등)에서는 dirty marking을 건너뛰기 위한 옵션
  const handlePatientBaseInfoChange = (
    data: Partial<Reception["patientBaseInfo"]>,
    changeOptions?: { skipDirty?: boolean }
  ) => {
    if (!currentReception) return;

    // 변경 감지: 한 번만 markReceptionAsChanged 호출 (skipDirty가 아닌 경우에만)
    if (!changeOptions?.skipDirty) {
      markChangedOnce();
    }

    if (options?.receptionId && options?.onUpdateReception) {
      const updatedPatientBaseInfo = {
        ...currentPatientInfo,
        ...data,
      } as Reception["patientBaseInfo"];
      const updatedReception: Reception = {
        ...currentReception,
        patientBaseInfo: updatedPatientBaseInfo,
      };
      // 로컬 상태 업데이트
      setLocalReception(updatedReception);
      // 콜백 호출
      options.onUpdateReception({
        patientBaseInfo: updatedPatientBaseInfo,
      });
    } 
  };

  const clearReceptionInfo = (defaultFacilityId: number) => {
    if (!currentReception || !currentPatientInfo) return;

    const updates: Partial<Reception> = {
      patientBaseInfo: {
        ...currentPatientInfo,
        facilityId: defaultFacilityId,
        roomPanel: currentReception?.patientBaseInfo?.roomPanel || PANEL_TYPE.TREATMENT,
        receptionMemo: "",
      } as Reception["patientBaseInfo"],
      receptionInfo: {
        ...currentReception.receptionInfo,
        timeCategory: 주간야간휴일구분.주간,
        receptionType: 초재진.초진,
        detailCategory: DetailCategoryType.없음,
        exceptionCode: null,
        checkup: null,
      },
    };

    // 외부 receptionId가 있고 콜백이 있으면 콜백 사용, 아니면 store 업데이트
    if (options?.receptionId && options?.onUpdateReception) {
      const updatedReception: Reception = {
        ...currentReception,
        ...updates,
        patientBaseInfo: updates.patientBaseInfo!,
        receptionInfo: updates.receptionInfo!,
      };
      // 로컬 상태 업데이트
      setLocalReception(updatedReception);
      // 콜백 호출
      options.onUpdateReception(updates);
    }
  };

  return {
    selectedReception: currentReception,
    activeReceptionId,
    currentPatientInfo,
    handleReceptionInfoChange,
    handleInsuranceInfoChange,
    handlePatientBaseInfoChange,
    clearReceptionInfo,
    markChangedOnce,
  };
}
