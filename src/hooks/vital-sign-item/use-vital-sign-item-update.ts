import { useMutation } from "@tanstack/react-query";
import { VitalSignItemsService } from "@/services/vital-sign-items-service";
import type {
  UpdateVitalSignItemRequest,
  UpdateVitalSignItemResponse,
} from "@/types/vital/vital-sign-items-types";

export function useUpdateVitalSignItem(options?: {
  onSuccess?: (data: UpdateVitalSignItemResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateVitalSignItemRequest;
    }) => VitalSignItemsService.updateVitalSignItem(id, data),
    ...options,
  });
}
