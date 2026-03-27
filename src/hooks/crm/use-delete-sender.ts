import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmSenderService } from "@/services/crm-sender-service";

export function useDeleteSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (senderNumber: string): Promise<void> => {
      return await CrmSenderService.deleteSender(senderNumber);
    },
    onSuccess: () => {
      // 발신번호 목록 쿼리 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ["crm-senders"] });
    },
  });
}
