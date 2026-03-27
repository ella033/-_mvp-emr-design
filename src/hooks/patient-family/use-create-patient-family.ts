import { useMutation } from "@tanstack/react-query";
import { PatientFamiliesService } from "@/services/patient-families-service";
import type {
  CreatePatientFamilyRequest,
  CreatePatientFamilyResponse,
} from "@/types/patient-family-types";

export function useCreatePatientFamily(options?: {
  onSuccess?: (data: CreatePatientFamilyResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (family: CreatePatientFamilyRequest) =>
      PatientFamiliesService.createPatientFamily(family),
    ...options,
  });
}
