import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmSenderService } from "@/services/crm-sender-service";
import type {
  CreateCrmSenderDto,
  CrmSenderResponseDto,
} from "@/types/crm/sender/crm-sender-crud-types";

export function useCreateSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCrmSenderDto
    ): Promise<CrmSenderResponseDto> => {
      return await CrmSenderService.createSender(data);
    },
    onSuccess: () => {
      // 발신번호 목록 쿼리 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ["crm-senders"] });
    },
  });
}
