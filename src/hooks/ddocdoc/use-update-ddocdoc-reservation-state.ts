import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DdocDocService } from "@/services/ddocdoc-service";
import type { components } from "@/generated/api/types";

export function useUpdateDdocdocReservationState(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      data,
    }: {
      reservationId: string;
      data: components["schemas"]["UpdateReservationStateDto"];
    }) => DdocDocService.updateReservationState(reservationId, data),
    onSuccess: () => {
      // 일감 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["ddocdoc", "jobs"],
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

