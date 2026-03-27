import { useQuery } from "@tanstack/react-query";
import { CrmSendHistoryService } from "@/services/crm-send-history-service";
import type { GetSendHistoryDetailResponseDto } from "@/types/crm/send-history/crm-send-history-types";

export function useSendHistoryDetail(sendHistoryId: number | undefined) {
  return useQuery({
    queryKey: ["crm-send-history-detail", sendHistoryId],
    queryFn: async (): Promise<GetSendHistoryDetailResponseDto> => {
      if (!sendHistoryId) {
        throw new Error("sendHistoryId is required");
      }
      return await CrmSendHistoryService.getSendHistoryDetail(sendHistoryId);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!sendHistoryId,
  });
}
