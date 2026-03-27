import { useCallback, useMemo } from "react";
import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";
import { useBoardPatientRuntime } from "@/components/reception/board-patient/board-patient-runtime-context";

/**
 * MemoInfo 컴포넌트용 Reception Hook
 *
 * - dirty(unsaved) 변경 감지는 BoardPatientRuntime(dirtyController) 전략을 통해 수행
 * - 값 반영은 onUpdateReception이 있으면 콜백
 */
export function useMemoInfoReception(options?: {
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

  const currentReception = useMemo(() => {
    if (options?.reception !== undefined) {
      return options.reception ?? null;
    }
    return (selectedReception as Reception | null) ?? null;
  }, [options?.reception, selectedReception]);

  const finalActiveReceptionId =
    options?.receptionId || activeReceptionId || "";

  const { dirty } = useBoardPatientRuntime();

  const markChangedOnce = useCallback(() => {
    if (!finalActiveReceptionId) return;
    if (!dirty.hasChanges(finalActiveReceptionId)) {
      dirty.markChanged(finalActiveReceptionId);
    }
  }, [dirty, finalActiveReceptionId]);

  const updatePatientMemo = useCallback(
    (memo: string) => {
      const patientInfo = currentReception?.patientBaseInfo;
      if (!patientInfo) return;

      if (options?.onUpdateReception) {
        options.onUpdateReception({
          patientBaseInfo: {
            ...patientInfo,
            patientMemo: memo,
          } as any,
        });
        return;
      }
    },
    [activeReceptionId, currentReception?.patientBaseInfo, options?.onUpdateReception]
  );

  const updateReceptionMemo = useCallback(
    (memo: string) => {
      const patientInfo = currentReception?.patientBaseInfo;
      if (!patientInfo) return;

      if (options?.onUpdateReception) {
        options.onUpdateReception({
          patientBaseInfo: {
            ...patientInfo,
            receptionMemo: memo,
          } as any,
        });
        return;
      }
    },
    [activeReceptionId, currentReception?.patientBaseInfo, options?.onUpdateReception]
  );

  const clearMemoInfoToReception = useCallback(() => {
    const patientInfo = currentReception?.patientBaseInfo;
    if (!patientInfo) return;

    if (options?.onUpdateReception) {
      options.onUpdateReception({
        patientBaseInfo: {
          ...patientInfo,
          patientMemo: "",
          receptionMemo: "",
        } as any,
      });
      return;
    }
  }, [activeReceptionId, currentReception?.patientBaseInfo, options?.onUpdateReception]);

  return {
    currentReception,
    activeReceptionId: finalActiveReceptionId,
    markChangedOnce,
    updatePatientMemo,
    updateReceptionMemo,
    clearMemoInfoToReception,
  };
}


