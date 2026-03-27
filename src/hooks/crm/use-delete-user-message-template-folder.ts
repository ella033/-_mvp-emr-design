import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type { DeleteFolderResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";

export function useDeleteUserMessageTemplateFolder(options?: {
  onSuccess?: (data: DeleteFolderResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await CrmUserMessageTemplateService.deleteFolder(id);
    },
    ...options,
  });
}
