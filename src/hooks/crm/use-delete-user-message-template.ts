import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type { DeleteTemplateResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";

export function useDeleteUserMessageTemplate(options?: {
  onSuccess?: (data: DeleteTemplateResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await CrmUserMessageTemplateService.deleteTemplate(id);
    },
    ...options,
  });
}
