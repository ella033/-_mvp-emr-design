import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmSenderService } from "@/services/crm-sender-service";
import type {
  UpdateCrmSenderDto,
  CrmSenderResponseDto,
} from "@/types/crm/sender/crm-sender-crud-types";

interface UpdateSenderParams {
  senderNumber: string;
  data: UpdateCrmSenderDto;
}

export function useUpdateSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      senderNumber,
      data,
    }: UpdateSenderParams): Promise<CrmSenderResponseDto> => {
      return await CrmSenderService.updateSender(senderNumber, data);
    },
    onSuccess: () => {
      // 발신번호 목록 쿼리 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ["crm-senders"] });
    },
  });
}
