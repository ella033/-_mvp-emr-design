import { useQuery } from "@tanstack/react-query";
import { CrmConditionSearchService } from "@/services/crm-condition-search-service";

export function useGetConditionById(
  id: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ["crm", "conditions", id],
    queryFn: async () => {
      return await CrmConditionSearchService.getConditionById(id);
    },
    enabled: id > 0 && (options?.enabled ?? true),
  });
}
