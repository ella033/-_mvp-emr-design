import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type {
  MoveTemplateDto,
  MoveTemplateResponseDto,
} from "@/types/crm/message-template/crm-user-message-template-types";

export function useMoveUserMessageTemplate(options?: {
  onSuccess?: (data: MoveTemplateResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: MoveTemplateDto;
    }) => {
      return await CrmUserMessageTemplateService.moveTemplate(id, data);
    },
    ...options,
  });
}
