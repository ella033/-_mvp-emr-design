import { useMutation } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import type {
  CreateHospitalRequest,
  CreateHospitalResponse,
} from "@/types/hospital-types";

export function useCreateHospital(options?: {
  onSuccess?: (data: CreateHospitalResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: CreateHospitalRequest) =>
      HospitalsService.createHospital(data),
    ...options,
  });
}
