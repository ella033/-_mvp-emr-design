import { useQuery } from "@tanstack/react-query";
import { CrmSendEventsService } from "@/services/crm-send-events-service";
import type { CrmSendEventResponseDto } from "@/types/crm/send-events/crm-send-events-types";

export function useSendEventDetail(id: number) {
  return useQuery({
    queryKey: ["crm-send-event", id],
    queryFn: async (): Promise<CrmSendEventResponseDto> => {
      return await CrmSendEventsService.getSendEventById(id);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}
