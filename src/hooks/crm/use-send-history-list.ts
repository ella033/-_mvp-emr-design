import { useQuery } from "@tanstack/react-query";
import { CrmSendHistoryService } from "@/services/crm-send-history-service";
import type {
  CrmSendHistoryListResponse,
  GetSendHistoryParams,
} from "@/types/crm/send-history/crm-send-history-types";

export function useSendHistoryList(params: GetSendHistoryParams) {
  return useQuery({
    queryKey: ["crm-send-history", params],
    queryFn: async (): Promise<CrmSendHistoryListResponse> => {
      return await CrmSendHistoryService.getSendHistories(params);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!params.from && !!params.to,
  });
}
