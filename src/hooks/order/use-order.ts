import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/services/orders-service";

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      return OrdersService.getOrder(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
  });
};
