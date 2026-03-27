import { useQuery } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type { GetTemplateResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";

export function useGetTemplateById(id: number) {
  return useQuery({
    queryKey: ["crm-user-message-template", id],
    queryFn: async (): Promise<GetTemplateResponseDto> => {
      return await CrmUserMessageTemplateService.getTemplateById(id);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}
