import { useMutation } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import type { DeleteHospitalResponse } from "@/types/hospital-types";

export function useDeleteHospital(options?: {
  onSuccess?: (data: DeleteHospitalResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (id: number) => HospitalsService.deleteHospital(id),
    ...options,
  });
}
