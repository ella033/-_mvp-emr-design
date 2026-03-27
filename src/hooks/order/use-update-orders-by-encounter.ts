import { useMutation } from "@tanstack/react-query";
import { OrdersService } from "@/services/orders-service";
import { UpsertManyOrders } from "@/types/chart/order-types";

export function useUpdateOrdersByEncounter(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: ({
      encounterId,
      orders,
    }: {
      encounterId: string;
      orders: UpsertManyOrders[];
    }) =>
      OrdersService.deleteUpsertManyOrdersByEncounter(encounterId, {
        items: orders,
      }),
    ...options,
  });
}
