import { useCallback } from "react";
import { useReceptionTabsStore } from "@/store/reception";
import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";
import { useBoardPatientRuntime } from "@/components/reception/board-patient/board-patient-runtime-context";

/**
 * ChronicInfo 컴포넌트용 Reception Hook
 */
export function useChronicInfoReception(options?: {
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

  // 만성질환 플래그 업데이트 핸들러
  const updateChronicFlags = (chronicFlags: Reception["patientStatus"]["chronicFlags"]) => {
    if (!finalActiveReceptionId || !selectedReception) return;

    // 변경 감지: 한 번만 markReceptionAsChanged 호출
    markChangedOnce();

    // 외부 receptionId가 있고 콜백이 있으면 콜백 사용, 아니면 store 업데이트
    if (options?.receptionId && options?.onUpdateReception) {
      options.onUpdateReception({
        patientStatus: {
          ...selectedReception.patientStatus,
          chronicFlags,
        },
      });
    }
  };

  // Clear 함수용 핸들러 (모든 만성질환 체크박스 해제)
  const clearChronicInfo = () => {
    if (!finalActiveReceptionId || !selectedReception) return;

    // 외부 receptionId가 있고 콜백이 있으면 콜백 사용, 아니면 store 업데이트
    if (options?.receptionId && options?.onUpdateReception) {
      options.onUpdateReception({
        patientStatus: {
          ...selectedReception.patientStatus,
          chronicFlags: {
            hypertension: false,
            diabetes: false,
            highCholesterol: false,
          },
        },
      });
    } 
  };

  return {
    selectedReception,
    activeReceptionId,
    updateChronicFlags,
    clearChronicInfo,
    markChangedOnce,
  };
}
