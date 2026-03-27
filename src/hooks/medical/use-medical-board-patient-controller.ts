import { useCallback, useMemo } from "react";
import type { Registration } from "@/types/registration-types";
import { ReceptionService } from "@/services/reception-service";
import { useReceptionStore } from "@/store/reception";
import { useBoardPatientCoreController } from "@/hooks/reception/board-patient/use-board-patient-core-controller";

interface UseMedicalBoardPatientControllerOptions {
  registration: Registration;
}

export function useMedicalBoardPatientController({
  registration,
}: UseMedicalBoardPatientControllerOptions) {
  const receptionId = registration.id?.toString() ?? null;

  const { registrations, updateRegistration } = useReceptionStore();

  // store의 registrations에서 최신 registration을 가져와서 initialReception 계산
  // store가 업데이트되면 자동으로 재계산됨
  const latestRegistration = useMemo(() => {
    if (!receptionId) return registration;
    const storeRegistration = registrations.find((r) => r.id === receptionId);
    return storeRegistration || registration;
  }, [receptionId, registrations, registration]);

  // registration → reception 변환 (기본 스냅샷)
  const initialReception = useMemo(
    () => ReceptionService.convertRegistrationToReception(latestRegistration),
    [latestRegistration]
  );

  const handleSyncToStore = useCallback(
    (mergedReception: any) => {
      if (!receptionId) return;

      const existingRegistration = registrations.find(
        (r) => r.id === receptionId
      );

      if (!existingRegistration) return;

      const updatedRegistration =
        ReceptionService.convertReceptionToRegistration(mergedReception);

      const {
        createDateTime,
        ...updatedPatientWithoutCreateDateTime
      } = updatedRegistration.patient || {};

      const mergedRegistration: Partial<Registration> = {
        ...updatedRegistration,
        id: existingRegistration.id,
        patient: existingRegistration.patient
          ? {
            ...existingRegistration.patient,
            ...updatedPatientWithoutCreateDateTime,
            id: existingRegistration.patient.id,
            createDateTime: existingRegistration.patient.createDateTime,
          }
          : updatedRegistration.patient,
      };

      updateRegistration(existingRegistration.id, mergedRegistration);
    },
    [receptionId, registrations, updateRegistration]
  );

  const { uiProps } = useBoardPatientCoreController({
    initialReception,
    receptionId,
    isDisabled: false,
    onSyncToStore: handleSyncToStore,
  });

  return {
    uiProps,
  };
}


