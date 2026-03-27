import { useMutation } from "@tanstack/react-query";
import { ScheduledOrderService } from "@/services/scheduled-order-service";
import type { DeleteUpsertManyScheduledOrdersRequest } from "@/types/scheduled-order-types";

export function useScheduledOrderDeleteUpsertMany(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      patientId,
      request,
    }: {
      patientId: number;
      request: DeleteUpsertManyScheduledOrdersRequest;
    }) => {
      return await ScheduledOrderService.deleteUpsertMany(patientId, request);
    },
    ...options,
  });
}
