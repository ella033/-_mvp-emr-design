import { useMutation } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";

export function usePrescriptionUserCodesDelete() {
  return useMutation({
    mutationFn: (ids: number[]) =>
      PrescriptionUserCodeService.deletePrescriptionUserCodes(ids),
  });
}
