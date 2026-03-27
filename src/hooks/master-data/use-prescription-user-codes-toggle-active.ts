import { useMutation } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";

export function usePrescriptionUserCodesToggleActive() {
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: number[]; isActive: boolean }) =>
      PrescriptionUserCodeService.toggleActivePrescriptionUserCodes(
        ids,
        isActive
      ),
  });
}
