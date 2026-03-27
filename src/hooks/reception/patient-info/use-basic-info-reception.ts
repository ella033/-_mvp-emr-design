import { useSelectedReception } from "../use-selected-reception";
import type { Reception } from "@/types/common/reception-types";

/**
 * BasicInfo 컴포넌트용 Reception Hook
 * 
 * Props로 reception이 전달되면 우선 사용하고,
 * 없으면 store에서 조회합니다.
 * 
 * Note: useBasicInfo hook이 이미 store를 직접 사용하고 있어서,
 * 이 hook은 reception 선택만 담당합니다.
 */
export function useBasicInfoReception(options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
}) {
  const { selectedReception } = useSelectedReception({
    reception: options?.reception,
    receptionId: options?.receptionId,
  });

  return {
    selectedReception,
  };
}

