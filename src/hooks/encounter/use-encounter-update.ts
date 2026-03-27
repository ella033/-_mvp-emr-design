import { useMutation } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";
import type {
  UpdateEncounterRequest,
  UpdateEncounterResponse,
} from "@/types/chart/encounter-types";

export function useUpdateEncounter(options?: {
  onSuccess?: (data: UpdateEncounterResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({
      id,
      data,
      options,
    }: {
      id: string;
      data: UpdateEncounterRequest;
      options?: { skipClaimSync?: boolean };
    }) => EncountersService.updateEncounter(id, data, options),
    ...options,
  });
}
