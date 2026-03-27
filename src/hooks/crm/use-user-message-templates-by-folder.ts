import { useQuery } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type { TemplatesByFolderResponse } from "@/types/crm/message-template/crm-user-message-template-types";

export function useUserMessageTemplatesByFolder(folderId: number) {
  return useQuery({
    queryKey: ["crm-user-message-templates-by-folder", folderId],
    queryFn: async (): Promise<TemplatesByFolderResponse> => {
      return await CrmUserMessageTemplateService.getTemplatesByFolderId(
        folderId
      );
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!folderId,
  });
}
