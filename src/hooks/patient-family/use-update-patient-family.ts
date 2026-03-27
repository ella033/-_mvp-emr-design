import { useMutation } from "@tanstack/react-query";
import { PatientFamiliesService } from "@/services/patient-families-service";
import type { UpdatePatientFamilyResponse } from "@/types/patient-family-types";

// 환자 가족 정보 수정용 커스텀 훅
export function useUpdatePatientFamily(options?: {
  onSuccess?: (data: UpdatePatientFamilyResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (family: any) =>
      PatientFamiliesService.updatePatientFamily(family.id, family),
    ...options,
  });
}
