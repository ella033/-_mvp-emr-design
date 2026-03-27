import { useQuery } from "@tanstack/react-query";
import { CrmSendHistoryService } from "@/services/crm-send-history-service";
import type {
  CrmSendReservedHistoryListResponse,
  GetSendReservedHistoryParams,
} from "@/types/crm/send-history/crm-send-history-types";

export function useSendReservedHistoryList(
  params: GetSendReservedHistoryParams
) {
  return useQuery({
    queryKey: ["crm-send-reserved-history", params],
    queryFn: async (): Promise<CrmSendReservedHistoryListResponse> => {
      return await CrmSendHistoryService.getSendReservedHistories(params);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!params.from && !!params.to,
  });
}
