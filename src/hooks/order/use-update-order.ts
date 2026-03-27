import { useMutation } from "@tanstack/react-query";
import { OrdersService } from "@/services/orders-service";
import type {
  UpdateOrderRequest,
  UpdateOrderResponse,
} from "@/types/chart/order-types";

export function useUpdateOrder(options?: {
  onSuccess?: (data: UpdateOrderResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      OrdersService.updateOrder(id, data),
    ...options,
  });
}
