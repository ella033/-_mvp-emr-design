import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type {
  CreateTemplateDto,
  CreateTemplateResponse,
} from "@/types/crm/message-template/crm-user-message-template-types";

export function useCreateUserMessageTemplate(options?: {
  onSuccess?: (data: CreateTemplateResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: CreateTemplateDto) => {
      return await CrmUserMessageTemplateService.createTemplate(data);
    },
    ...options,
  });
}
