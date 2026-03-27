import { useMutation } from "@tanstack/react-query";
import { CrmUserMessageTemplateService } from "@/services/crm-user-message-template-service";
import type {
  MoveFolderDto,
  MoveFolderResponseDto,
} from "@/types/crm/message-template/crm-user-message-template-types";

export function useMoveUserMessageFolder(options?: {
  onSuccess?: (data: MoveFolderResponseDto) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: number;
      data: MoveFolderDto;
    }) => {
      return await CrmUserMessageTemplateService.moveFolder(folderId, data);
    },
    ...options,
  });
}
