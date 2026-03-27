import { useMutation } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";
import type {
  CreateEncounterRequest,
  CreateEncounterResponse,
} from "@/types/chart/encounter-types";

export function useCreateEncounter(options?: {
  onSuccess?: (data: CreateEncounterResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (encounter: CreateEncounterRequest) =>
      EncountersService.createEncounter(encounter),
    ...options,
  });
}
