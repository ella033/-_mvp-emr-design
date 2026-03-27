import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmSendEventsService } from "@/services/crm-send-events-service";

export function useDeleteSendEvent(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await CrmSendEventsService.deleteEvent(id);
    },
    onSuccess: (_, id) => {
      // CRM 발송 이벤트 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["crm-send-events"],
      });

      // 특정 이벤트 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: ["crm-send-event", id],
      });

      // 사용자 정의 onSuccess 콜백 호출
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
