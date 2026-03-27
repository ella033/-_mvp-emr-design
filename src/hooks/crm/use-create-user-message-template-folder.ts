import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type {
  CreateFolderDto,
  CreateFolderResponseDto,
} from "@/types/crm/message-template/crm-user-message-template-types";

export function useCreateUserMessageTemplateFolder(options?: {
  onSuccess?: (data: CreateFolderResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: CreateFolderDto) => {
      return await CrmUserMessageTemplateService.createFolder(data);
    },
    ...options,
  });
}
