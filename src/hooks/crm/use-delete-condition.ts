import { useMutation } from "@tanstack/react-query";
import { CrmConditionSearchService } from "@/services/crm-condition-search-service";
import type { DeleteConditionResponseDto } from "@/types/crm/condition-search/condition-management-types";

export function useDeleteCondition(options?: {
  onSuccess?: (data: DeleteConditionResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await CrmConditionSearchService.deleteCondition(id);
    },
    ...options,
  });
}
