import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/services/orders-service";

export const useOrdersByEncounter = (encounterId: string) => {
  return useQuery({
    queryKey: ["orders", encounterId],
    queryFn: async () => {
      return OrdersService.getOrdersByEncounter(encounterId);
    },
    enabled: !!encounterId && !["undefined", "null"].includes(encounterId),
  });
};
