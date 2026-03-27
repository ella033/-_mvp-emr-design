import { useMutation } from "@tanstack/react-query";
import { ScheduledOrderService } from "@/services/scheduled-order-service";

export function useScheduledOrderDelete(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await ScheduledOrderService.deleteScheduledOrder(id);
    },
    ...options,
  });
}
