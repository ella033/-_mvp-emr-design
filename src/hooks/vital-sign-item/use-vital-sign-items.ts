import { useQuery } from "@tanstack/react-query";
import { VitalSignItemsService } from "@/services/vital-sign-items-service";

export const useVitalSignItems = (isActive?: boolean) => {
  return useQuery({
    queryKey: ["vital-sign-items"],
    queryFn: async () => {
      return VitalSignItemsService.getVitalSignItems(isActive);
    },
  });
};
