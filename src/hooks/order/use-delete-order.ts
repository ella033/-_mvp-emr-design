import { useMutation } from "@tanstack/react-query";
import { OrdersService } from "@/services/orders-service";
import type { DeleteOrderResponse } from "@/types/chart/order-types";

export const useDeleteOrder = (options?: {
  onSuccess?: (data: DeleteOrderResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: string) => OrdersService.deleteOrder(id),
    ...options,
  });
};
