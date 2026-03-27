import { useMutation } from "@tanstack/react-query";
import { ScheduledOrderService } from "@/services/scheduled-order-service";
import type { CreateScheduledOrderRequest } from "@/types/scheduled-order-types";

export function useScheduledOrderCreate(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: CreateScheduledOrderRequest) => {
      return await ScheduledOrderService.createScheduledOrder(data);
    },
    ...options,
  });
}
