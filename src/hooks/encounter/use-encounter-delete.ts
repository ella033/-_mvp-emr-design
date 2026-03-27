import { useMutation } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";
import type { DeleteEncounterResponse } from "@/types/chart/encounter-types";

export const useDeleteEncounter = (options?: {
  onSuccess?: (data: DeleteEncounterResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: string) => EncountersService.deleteEncounter(id),
    ...options,
  });
};
