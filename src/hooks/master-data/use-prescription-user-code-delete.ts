import { useMutation } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";

export function usePrescriptionUserCodeDelete() {
  return useMutation({
    mutationFn: (id: string) =>
      PrescriptionUserCodeService.deletePrescriptionUserCode(id),
  });
}
