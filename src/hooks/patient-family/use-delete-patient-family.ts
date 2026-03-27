import { useMutation } from "@tanstack/react-query";
import { PatientFamiliesService } from "@/services/patient-families-service";
import type { DeletePatientFamilyResponse } from "@/types/patient-family-types";

export const useDeletePatientFamily = (options?: {
  onSuccess?: (data: DeletePatientFamilyResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: number) => PatientFamiliesService.deletePatientFamily(id),
    ...options,
  });
};
