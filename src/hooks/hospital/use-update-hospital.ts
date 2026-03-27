import { useMutation } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import type {
  UpdateHospitalRequest,
  UpdateHospitalResponse,
} from "@/types/hospital-types";

// 병원 수정 훅 정의
export function useUpdateHospital(options?: {
  onSuccess?: (data: UpdateHospitalResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHospitalRequest }) =>
      HospitalsService.updateHospital(id, data),
    ...options,
  });
}
