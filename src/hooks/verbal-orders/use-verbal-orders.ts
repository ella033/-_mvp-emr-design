import { useQuery } from "@tanstack/react-query";
import { VerbalOrdersService } from "@/services/verbal-orders-service";
export const useVerbalOrders = (baseDate: string) => {
  return useQuery({
    queryKey: ["verbal-orders", baseDate],
    queryFn: () => VerbalOrdersService.getVerbalOrders(baseDate),
  });
};