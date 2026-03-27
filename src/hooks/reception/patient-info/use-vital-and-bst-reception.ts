import { useCallback } from "react";
import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";
import { useBoardPatientRuntime } from "@/components/reception/board-patient/board-patient-runtime-context";

/**
 * VitalAndBst 컴포넌트용 Reception Hook
 */
export function useVitalAndBstReception(options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
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

  return {
    selectedReception,
    activeReceptionId,
    markChangedOnce,
  };
}
