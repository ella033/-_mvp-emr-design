import { useMutation } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";

export function usePrescriptionUserCodeToggleActive() {
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      PrescriptionUserCodeService.toggleActivePrescriptionUserCode(
        id,
        isActive
      ),
  });
}
