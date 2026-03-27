import { useQuery } from "@tanstack/react-query";
import { CrmCostService } from "@/services/crm-cost-service";
import type { GetCostResponseDto } from "@/types/crm/cost/crm-cost-types";

export function useCost(targetMonth: string) {
  return useQuery({
    queryKey: ["crm-cost", targetMonth],
    queryFn: async (): Promise<GetCostResponseDto> => {
      return await CrmCostService.getCost(targetMonth);
    },
    enabled: !!targetMonth,
    staleTime: 10 * 60 * 1000,
  });
}

