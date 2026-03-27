import { useMutation } from "@tanstack/react-query";
import { CrmConditionSearchService } from "@/services/crm-condition-search-service";
import type {
  CreateConditionDto,
  CreateConditionResponseDto,
} from "@/types/crm/condition-search/condition-management-types";

export function useCreateCondition(options?: {
  onSuccess?: (data: CreateConditionResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (request: CreateConditionDto) => {
      return await CrmConditionSearchService.createCondition(request);
    },
    ...options,
  });
}
