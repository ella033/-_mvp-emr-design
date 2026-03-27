import { useMutation } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import type {
  CreateHospitalWithCredentialRequest,
  CreateHospitalResponse,
} from "@/types/hospital-types";

export function useCreateHospitalWithCredential(options?: {
  onSuccess?: (data: CreateHospitalResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: CreateHospitalWithCredentialRequest) =>
      HospitalsService.createHospitalWithCredential(data),
    ...options,
  });
}
