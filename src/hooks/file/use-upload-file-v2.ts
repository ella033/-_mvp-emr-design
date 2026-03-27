import { useMutation } from "@tanstack/react-query";
import { FileService } from "@/services/file-service";
import { type FileUploadV2Request, type FileUploadV2Response } from "@/types/file-types-v2";

export function useUploadFileV2(options?: {
  onSuccess?: (data: FileUploadV2Response) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (request: FileUploadV2Request) => FileService.uploadFileV2(request),
    ...options,
  });
}
