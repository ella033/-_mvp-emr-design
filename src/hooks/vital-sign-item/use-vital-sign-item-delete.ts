import { useMutation } from "@tanstack/react-query";
import { VitalSignItemsService } from "@/services/vital-sign-items-service";
import type { DeleteVitalSignItemResponse } from "@/types/vital/vital-sign-items-types";

export const useDeleteVitalSignItem = (options?: {
  onSuccess?: (data: DeleteVitalSignItemResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: number) => VitalSignItemsService.deleteVitalSignItem(id),
    ...options,
  });
};
