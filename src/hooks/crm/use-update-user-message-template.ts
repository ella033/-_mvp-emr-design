import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type {
  UpdateTemplateDto,
  UpdateTemplateResponseDto,
} from "@/types/crm/message-template/crm-user-message-template-types";

export function useUpdateUserMessageTemplate(options?: {
  onSuccess?: (data: UpdateTemplateResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateTemplateDto;
    }) => {
      return await CrmUserMessageTemplateService.updateTemplate(id, data);
    },
    ...options,
  });
}
