import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmSendEventsService } from "@/services/crm-send-events-service";
import type {
  CreateCrmSendEventDto,
  CreateCrmSendEventResponseDto,
} from "@/types/crm/send-events/crm-send-events-types";

export function useCreateSendEvent(options?: {
  onSuccess?: (data: CreateCrmSendEventResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCrmSendEventDto) => {
      return await CrmSendEventsService.createEvent(request);
    },
    onSuccess: (data) => {
      // CRM 발송 이벤트 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["crm-send-events"],
      });

      // 사용자 정의 onSuccess 콜백 호출
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
