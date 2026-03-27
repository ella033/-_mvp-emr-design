import { useMutation } from "@tanstack/react-query";
import { VitalSignItemsService } from "@/services/vital-sign-items-service";
import type {
  CreateVitalSignItemRequest,
  CreateVitalSignItemResponse,
} from "@/types/vital/vital-sign-items-types";

export function useCreateVitalSignItem(options?: {
  onSuccess?: (data: CreateVitalSignItemResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (item: CreateVitalSignItemRequest) =>
      VitalSignItemsService.createVitalSignItem(item),
    ...options,
  });
}
