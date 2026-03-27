import { useQuery } from "@tanstack/react-query";
import { CrmSenderService } from "@/services/crm-sender-service";
import type { CrmSenderListResponse } from "@/types/crm/sender/crm-sender-types";

export function useSenderList() {
  return useQuery({
    queryKey: ["crm-senders"],
    queryFn: async (): Promise<CrmSenderListResponse> => {
      return await CrmSenderService.getSenders();
    },
    staleTime: 10 * 60 * 1000,
  });
}
