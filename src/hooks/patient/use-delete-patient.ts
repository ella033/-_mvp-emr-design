import { useMutation } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type { DeletePatientResponse } from "@/types/patient-types";

// 환자삭제용 커스텀 훅
export function useDeletePatient(options?: {
  onSuccess?: (data: DeletePatientResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (id: number) => PatientsService.deletePatient(id),
    ...options,
  });
}
