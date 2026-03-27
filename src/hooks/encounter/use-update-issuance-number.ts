import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";
import type { Encounter } from "@/types/chart/encounter-types";

export function useUpdateIssuanceNumber(options?: {
  onSuccess?: (data: Encounter) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      issuanceNumber,
    }: {
      id: string;
      issuanceNumber: string;
    }) => EncountersService.updateIssuanceNumber(id, { issuanceNumber }),
    onSuccess: (data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
