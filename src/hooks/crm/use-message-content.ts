import { useQuery } from "@tanstack/react-query";
import { CrmSendHistoryService } from "@/services/crm-send-history-service";
import type { GetMessageContentResponseDto } from "@/types/crm/send-history/crm-send-history-types";

export function useMessageContent(ubmsMessageId: number | undefined) {
  return useQuery({
    queryKey: ["crm-message-content", ubmsMessageId],
    queryFn: async (): Promise<GetMessageContentResponseDto> => {
      if (!ubmsMessageId) {
        throw new Error("ubmsMessageId is required");
      }
      return await CrmSendHistoryService.getMessageContent(ubmsMessageId);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!ubmsMessageId,
  });
}
