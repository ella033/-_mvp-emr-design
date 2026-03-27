import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmSendEventsService } from "@/services/crm-send-events-service";
import type {
  UpdateCrmSendEventDto,
  CrmSendEventResponseDto,
} from "@/types/crm/send-events/crm-send-events-types";

export function useUpdateSendEvent(options?: {
  onSuccess?: (data: CrmSendEventResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      request,
    }: {
      id: number;
      request: UpdateCrmSendEventDto;
    }) => {
      return await CrmSendEventsService.updateEvent(id, request);
    },
    onSuccess: (data) => {
      // CRM 발송 이벤트 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["crm-send-events"],
      });

      // 특정 이벤트 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["crm-send-event", data.id],
      });

      // 사용자 정의 onSuccess 콜백 호출
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
