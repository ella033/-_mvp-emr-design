import { useQuery } from "@tanstack/react-query";
import { CrmGuideMessageTemplateService } from "@/services/crm-guide-message-template-service";
import type { GuideTemplatesByFolderResponse } from "@/types/crm/message-template/crm-guide-message-template-types";

export function useGuideMessageTemplatesByFolder(folderId: number) {
  return useQuery({
    queryKey: ["crm-guide-message-templates-by-folder", folderId],
    queryFn: async (): Promise<GuideTemplatesByFolderResponse> => {
      return await CrmGuideMessageTemplateService.getTemplatesByFolderId(
        folderId
      );
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!folderId,
  });
}
