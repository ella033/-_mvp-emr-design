import { useMutation } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type {
  UpdatePatientResponse,
  UpdatePatientRequest,
} from "@/types/patient-types";

// 접수 정보 업데이트용 커스텀 훅
export function useUpdatePatient(options?: {
  onSuccess?: (data: UpdatePatientResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({
      patientId,
      updatePatient,
    }: {
      patientId: number;
      updatePatient: UpdatePatientRequest;
    }) => PatientsService.updatePatient(patientId, updatePatient),
    ...options,
  });
}
