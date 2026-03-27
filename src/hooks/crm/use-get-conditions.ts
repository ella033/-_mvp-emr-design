import { useQuery } from "@tanstack/react-query";
import { CrmConditionSearchService } from "@/services/crm-condition-search-service";
import type { ConditionListResponseDto } from "@/types/crm/condition-search/condition-management-types";

export function useGetConditions(options?: {
  onSuccess?: (data: ConditionListResponseDto[]) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["crm", "conditions"],
    queryFn: async () => {
      return await CrmConditionSearchService.getConditions();
    },
    ...options,
  });
}
