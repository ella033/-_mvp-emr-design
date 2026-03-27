import { useMutation } from "@tanstack/react-query";
import { FileService } from "@/services/file-service";

export function useDeleteFile(options?: {
  onSuccess?: (data: void) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (uuid: string) => FileService.deleteFileV2(uuid),
    ...options,
  });
}