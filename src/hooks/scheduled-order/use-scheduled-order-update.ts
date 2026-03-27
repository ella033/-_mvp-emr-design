import { useMutation } from "@tanstack/react-query";
import { ScheduledOrderService } from "@/services/scheduled-order-service";
import type { UpdateScheduledOrderRequest } from "@/types/scheduled-order-types";

export function useScheduledOrderUpdate(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: (data: { id: number } & UpdateScheduledOrderRequest) =>
      ScheduledOrderService.updateScheduledOrder(data.id, data),
    ...options,
  });
}
