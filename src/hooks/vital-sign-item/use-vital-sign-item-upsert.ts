import { useMutation } from "@tanstack/react-query";
import { VitalSignItemsService } from "@/services/vital-sign-items-service";
import type {
  UpsertManyVitalSignItemSettingsRequest,
  UpsertManyVitalSignItemSettingsResponse,
} from "@/types/vital/vital-sign-item-setting-types";

export function useVitalSignItemUpsert(options?: {
  onSuccess?: (data: UpsertManyVitalSignItemSettingsResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: UpsertManyVitalSignItemSettingsRequest) =>
      VitalSignItemsService.deleteUpsertManyVitalSignItems(data),
    ...options,
  });
}
