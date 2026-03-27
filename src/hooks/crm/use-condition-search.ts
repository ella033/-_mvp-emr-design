import { useMutation } from "@tanstack/react-query";
import { CrmConditionSearchService } from "@/services/crm-condition-search-service";
import type {
  ConditionSearchRequest,
  ConditionSearchResponse,
} from "@/types/crm/condition-search/condition-search-types";

export function useConditionSearch(options?: {
  onSuccess?: (data: ConditionSearchResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (request: ConditionSearchRequest) => {
      return await CrmConditionSearchService.searchPatients(request);
    },
    ...options,
  });
}
