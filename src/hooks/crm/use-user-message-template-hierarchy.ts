import { useQuery } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type { TreeHierarchyResponse } from "@/types/crm/message-template/crm-user-message-template-types";

export function useUserMessageTemplateHierarchy(messageType: number) {
  return useQuery({
    queryKey: ["crm-user-message-template-hierarchy", messageType],
    queryFn: async (): Promise<TreeHierarchyResponse> => {
      return await CrmUserMessageTemplateService.getHierarchy(messageType);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!messageType,
  });
}
