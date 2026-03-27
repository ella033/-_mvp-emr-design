import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type {
  UpdateFolderDto,
  UpdateFolderResponseDto,
} from "@/types/crm/message-template/crm-user-message-template-types";

export function useUpdateUserMessageTemplateFolder(options?: {
  onSuccess?: (data: UpdateFolderResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateFolderDto;
    }) => {
      return await CrmUserMessageTemplateService.updateFolder(id, data);
    },
    ...options,
  });
}
