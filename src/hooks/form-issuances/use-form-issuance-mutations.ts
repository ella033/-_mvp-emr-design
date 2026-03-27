import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormIssuancesService } from "@/services/form-issuances-service";
import type { components } from "@/generated/api/types";
import { ISSUANCE_HISTORY_QUERY_KEY } from "@/app/document/_components/IssuanceHistoryTab";

type CreateFormIssuanceDto = components["schemas"]["CreateFormIssuanceDto"];
type UpdateFormIssuanceDto = components["schemas"]["UpdateFormIssuanceDto"];

export function useCreateFormIssuance(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateFormIssuanceDto) =>
      FormIssuancesService.createFormIssuance(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ISSUANCE_HISTORY_QUERY_KEY] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

export function useUpdateFormIssuance(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issuanceId,
      body,
    }: {
      issuanceId: number;
      body: UpdateFormIssuanceDto;
    }) => FormIssuancesService.updateFormIssuance(issuanceId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ISSUANCE_HISTORY_QUERY_KEY] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
