import { useMutation } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";
import type { PrescriptionUserCodesUpsertType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";

export function usePrescriptionUserCodeUpsert() {
  return useMutation({
    mutationFn: (data: PrescriptionUserCodesUpsertType) => {
      const stableData = data
        ? Object.fromEntries(
            Object.entries(data).filter(
              ([_, value]) => value !== undefined && value !== ""
            )
          )
        : {};

      return PrescriptionUserCodeService.upsertPrescriptionUserCode(
        stableData as PrescriptionUserCodesUpsertType
      );
    },
  });
}
