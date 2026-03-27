import { useMutation } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type { CreateMedicalAidRequest, CreateMedicalAidResponse } from "@/types/medical-aid-types";

export function useCreateMedicalAid(options?: {
  onSuccess?: (data: CreateMedicalAidResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: CreateMedicalAidRequest }) =>
      PatientsService.createMedicalAid(patientId, data),
    ...options,
  });
}
