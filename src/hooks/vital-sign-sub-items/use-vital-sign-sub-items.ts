import { useQuery } from "@tanstack/react-query";
import { VitalSignSubItemsService } from "@/services/vital-sign-sub-items-service";

export const useVitalSignSubItems = (itemId: number) => {
  return useQuery({
    queryKey: ["vital-sign-sub-items", itemId],
    queryFn: async () => {
      return VitalSignSubItemsService.getVitalSignSubItems(itemId);
    },
  });
};
