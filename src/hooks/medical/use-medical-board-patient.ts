import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReceptionStore } from "@/store/reception";
import { RegistrationsService } from "@/services/registrations-service";
import { ReceptionService } from "@/services/reception-service";
import type { Reception } from "@/types/common/reception-types";

/**
 * /medical 라우트에서 board-patient 용으로 사용할 경량 훅
 * - tabs-store(openedReceptions, openedReceptionId 등)에 의존하지 않고
 * - reception-store(registrations)에 없으면 API로 registration을 조회한 뒤 Reception으로 변환
 * - 조회된 값은 store에 저장하지 않는다(일회성 사용)
 */
export function useMedicalBoardPatient(receptionId: string | null) {
  const { registrations } = useReceptionStore();

  // 1) store에서 먼저 찾기
  const registrationFromStore = useMemo(() => {
    if (!receptionId) return null;
    return (
      registrations.find((r) => r.id?.toString() === receptionId) ?? null
    );
  }, [registrations, receptionId]);

  // 2) 없으면 API로 조회
  const registrationQuery = useQuery({
    queryKey: ["registration", receptionId ?? ""],
    queryFn: async () => {
      // enabled 가드가 있지만 타입 안전을 위해 한번 더 체크
      if (!receptionId) throw new Error("registrationId가 없습니다.");
      return await RegistrationsService.getRegistration(receptionId);
    },
    enabled:
      !!receptionId &&
      !["undefined", "null"].includes(receptionId) &&
      !registrationFromStore,
  });

  const resolvedRegistration = registrationFromStore ?? registrationQuery.data ?? null;

  const selectedReception = useMemo<Reception | null>(() => {
    if (!resolvedRegistration) return null;
    return ReceptionService.convertRegistrationToReception(resolvedRegistration);
  }, [resolvedRegistration]);

  return {
    selectedReception,
    activeReceptionId: receptionId,
    isLoading: registrationQuery.isLoading,
    error: registrationQuery.error,
  };
}


