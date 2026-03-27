import { useMutation } from "@tanstack/react-query";
import { OrdersService } from "@/services/orders-service";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
} from "@/types/chart/order-types";

export function useCreateOrder(options?: {
  onSuccess?: (data: CreateOrderResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (order: CreateOrderRequest) => OrdersService.createOrder(order),
    ...options,
  });
}
