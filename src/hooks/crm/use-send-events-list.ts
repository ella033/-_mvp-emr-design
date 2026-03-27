import { useQuery } from "@tanstack/react-query";
import { CrmSendEventsService } from "@/services/crm-send-events-service";
import type { CrmSendEventsListResponse } from "@/types/crm/send-events/crm-send-events-types";

export function useSendEventsList() {
  return useQuery({
    queryKey: ["crm-send-events"],
    queryFn: async (): Promise<CrmSendEventsListResponse> => {
      return await CrmSendEventsService.getSendEvents();
    },
    staleTime: 10 * 60 * 1000,
  });
}
