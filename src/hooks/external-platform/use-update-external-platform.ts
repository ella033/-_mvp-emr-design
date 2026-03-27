import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-proxy";
import {
  ExternalPlatformService,
  type CreateExternalPlatformDto,
  type UpdateExternalPlatformDto,
} from "@/services/external-platform-service";

const QUERY_KEY = ["external-platform"] as const;

export function useCreateExternalPlatform(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExternalPlatformDto) => ExternalPlatformService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.platformCode] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

export function useUpdateExternalPlatform(
  platformCode: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExternalPlatformDto) =>
      ExternalPlatformService.update(platformCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, platformCode] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

/**
 * 똑닥 등 외부 플랫폼 연동 on/off 토글용.
 * - 켜기: 레코드 없으면 생성(POST), 있으면 isActive: true로 수정(PUT)
 * - 끄기: isActive: false로 수정(PUT). 레코드 없으면 무시.
 */
export function useSetExternalPlatformActive(
  platformCode: string,
  options?: {
    platformName?: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();
  const platformName = options?.platformName ?? platformCode;

  return useMutation({
    mutationFn: async (isActive: boolean) => {
      if (isActive) {
        try {
          await ExternalPlatformService.findOne(platformCode);
          return await ExternalPlatformService.update(platformCode, { isActive: true });
        } catch (err) {
          const status = err instanceof ApiError ? err.status : (err as any)?.status;
          if (status === 404) {
            return await ExternalPlatformService.create({
              platformCode,
              platformName,
            });
          }
          throw err;
        }
      } else {
        try {
          return await ExternalPlatformService.update(platformCode, { isActive: false });
        } catch (err) {
          const status = err instanceof ApiError ? err.status : (err as any)?.status;
          if (status === 404) return null;
          throw err;
        }
      }
    },
    onSuccess: (data) => {
      if (data != null) {
        queryClient.setQueryData([...QUERY_KEY, platformCode], data);
      }
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, "list"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
