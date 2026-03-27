import { useQuery } from "@tanstack/react-query";
import { FileService } from "@/services/file-service";
import type { FileDownloadV2Response } from "@/types/file-types-v2";

export const DOWNLOAD_FILE_V2_QUERY_KEY = "download-file-v2";

export function useDownloadFileV2(
  uuid: string | undefined | null,
  options?: {
    enabled?: boolean;
  }
) {
  const hasUuid = typeof uuid === "string" && uuid.length > 0;
  const isEnabled = options?.enabled ?? true;

  return useQuery<FileDownloadV2Response>({
    queryKey: [DOWNLOAD_FILE_V2_QUERY_KEY, uuid],
    queryFn: async () => {
      if (!hasUuid || !uuid) {
        throw new Error("uuid is required");
      }

      return await FileService.downloadFileV2(uuid);
    },
    enabled: hasUuid && isEnabled,
    staleTime: Infinity, // 파일 다운로드는 stale하지 않음
    gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
  });
}
