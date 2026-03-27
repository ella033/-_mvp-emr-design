import { useQuery } from "@tanstack/react-query";
import { CrmGuideMessageTemplateService } from "@/services/crm-guide-message-template-service";
import type { GuideFoldersResponse } from "@/types/crm/message-template/crm-guide-message-template-types";
import { CrmMessageType } from "@/constants/crm-enums";

export function useGuideMessageTemplateFolders(messageType: number) {
  // messageType이 유효한 값(1: 문자, 2: 알림톡)인지 확인
  const isValidMessageType = messageType === CrmMessageType.문자 || messageType === CrmMessageType.알림톡;
  
  return useQuery({
    queryKey: ["crm-guide-message-template-folders", messageType],
    queryFn: async (): Promise<GuideFoldersResponse> => {
      return await CrmGuideMessageTemplateService.getFolders(messageType);
    },
    staleTime: 30 * 60 * 1000,
    enabled: isValidMessageType,
  });
}
