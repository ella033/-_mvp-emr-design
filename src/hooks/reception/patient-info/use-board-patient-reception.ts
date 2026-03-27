import { useMemo } from "react";
import { useReceptionTabsStore } from "@/store/reception";
import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";
import { isNewRegistrationId } from "@/lib/registration-utils";

/**
 * BoardPatient 컴포넌트용 Reception Hook
 * 
 * Props로 reception이 전달되면 우선 사용하고,
 * 없으면 store에서 조회합니다.
 */
export function useBoardPatientReception(options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  /** 외부에서 주입할 disabled 상태 */
  isDisabled?: boolean;
  /** tabs-store 기반 disabled 상태를 사용할지 여부 (기본값: true) */
  useTabsStore?: boolean;
}) {
  const { isReceptionDisabled } = useReceptionTabsStore();
  const { selectedReception, activeReceptionId } = useSelectedReception({
    reception: options?.reception,
    receptionId: options?.receptionId,
  });

  // disabled 상태 계산
  const isCurrentReceptionDisabled = useMemo(() => {
    // 외부에서 store 사용을 끄면 props 기반 disabled 만 사용
    if (options?.useTabsStore === false) {
      return options.isDisabled ?? false;
    }

    if (options?.isDisabled !== undefined) {
      return options.isDisabled;
    }
    if (activeReceptionId) {
      return isReceptionDisabled(activeReceptionId);
    }
    return false;
  }, [options?.isDisabled, activeReceptionId, isReceptionDisabled]);

  // 신규 환자 여부
  const isNewPatient = useMemo(() => {
    return isNewRegistrationId(selectedReception?.originalRegistrationId);
  }, [selectedReception]);

  // 최종 disabled 상태
  const finalIsDisabled = useMemo(() => {
    return (options?.isDisabled || isCurrentReceptionDisabled) && !isNewPatient;
  }, [options?.isDisabled, isCurrentReceptionDisabled, isNewPatient]);

  return {
    selectedReception,
    activeReceptionId,
    isCurrentReceptionDisabled,
    isNewPatient,
    finalIsDisabled,
  };
}

