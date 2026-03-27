import { useMemo } from "react";
import { useReceptionStore, useReceptionTabsStore } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import type { Reception } from "@/types/common/reception-types";
import { isNewRegistrationId } from "@/lib/registration-utils";

/**
 * Reception 선택 로직을 통합한 공통 Hook
 * 
 * Props로 reception이 전달되면 우선 사용하고,
 * 없으면 receptionId를 통해 store에서 조회하거나
 * store의 기본 상태(openedReceptionId)를 사용합니다.
 * 
 * @param options - Reception 선택 옵션
 * @returns 선택된 reception과 관련 정보
 */
export function useSelectedReception(options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID (registrationId 등) */
  receptionId?: string | null;
  /** store를 사용하지 않고 외부 reception만 사용할지 여부 */
  useStore?: boolean;
}) {
  const { registrations } = useReceptionStore();
  const { openedReceptions, openedReceptionId } = useReceptionTabsStore();

  const selectedReception = useMemo(() => {
    // 1. receptionId가 명시적으로 전달된 경우, reception과 일치 여부 확인
    // 일치하지 않으면 reception을 무시하고 receptionId로 store에서 조회
    if (options?.receptionId !== undefined && options.receptionId !== null) {
      // reception이 함께 전달된 경우 일치 여부 확인
      if (options?.reception !== undefined && options.reception) {
        const receptionOriginalId = options.reception.originalRegistrationId?.toString();
        const expectedReceptionId = options.receptionId.toString();

        // 일치하면 reception 사용
        if (receptionOriginalId === expectedReceptionId) {
          return options.reception;
        }

        // 일치하지 않으면 reception을 무시하고 receptionId로 store에서 조회
      }

      const expectedReceptionId = options.receptionId.toString();

      // receptionId로 store에서 조회
      // openedReceptions에서 먼저 찾기
      const foundInOpened = openedReceptions.find(
        (r) => r.originalRegistrationId?.toString() === expectedReceptionId
      );
      if (foundInOpened) {
        return foundInOpened;
      }

      // registrations에서 찾아서 변환
      const registration = registrations.find(
        (r) => r.id?.toString() === expectedReceptionId
      );
      if (registration) {
        return ReceptionService.convertRegistrationToReception(registration);
      }

      return null;
    }

    // 2. reception만 전달된 경우 (receptionId 없음)
    if (options?.reception !== undefined) {
      return options.reception;
    }

    // 3. useStore가 false면 null 반환 (외부 reception만 사용)
    if (options?.useStore === false) {
      return null;
    }

    // 4. receptionId가 null로 명시적으로 전달된 경우 null 반환
    if (options?.receptionId === null) {
      return null;
    }

    // 4. store의 기본 상태 사용: openedReceptionId
    if (!openedReceptionId) {
      return null;
    }

    if (isNewRegistrationId(openedReceptionId)) {
      const found = openedReceptions.find((r) =>
        isNewRegistrationId(r.originalRegistrationId)
      ) || null;
      return found;
    }

    const found = openedReceptions.find(
      (r) => r.originalRegistrationId === openedReceptionId
    ) || null;
    return found;
  }, [
    options?.reception,
    options?.receptionId,
    options?.useStore,
    openedReceptions,
    openedReceptionId,
    registrations,
  ]);

  // activeReceptionId 계산 (업데이트 시 사용)
  // receptionId가 명시적으로 전달되면 그것을 우선 사용
  const activeReceptionId = useMemo(() => {
    if (options?.receptionId !== undefined && options?.receptionId !== null) {
      return options.receptionId;
    }
    return openedReceptionId;
  }, [options?.receptionId, openedReceptionId]);

  return {
    selectedReception,
    activeReceptionId,
  };
}

