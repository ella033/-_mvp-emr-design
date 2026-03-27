import { ExternalPlatformService } from "@/services/external-platform-service";
import type { ExternalPlatformResponseDto } from "@/services/external-platform-service";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY = ["external-platform"] as const;

export function useExternalPlatformList(params?: { platformCode?: string; isActive?: boolean }) {
  return useQuery<ExternalPlatformResponseDto[]>({
    queryKey: [...QUERY_KEY, "list", params],
    queryFn: () => ExternalPlatformService.findAll(params),
  });
}

export function useExternalPlatform(platformCode: string | undefined) {
  return useQuery<ExternalPlatformResponseDto>({
    queryKey: [...QUERY_KEY, platformCode],
    queryFn: async () => {
      if (!platformCode) throw new Error("platformCode is required");
      const list = await ExternalPlatformService.findAll({ platformCode });
      const one = list.find((p) => p.platformCode === platformCode);
      if (!one) throw new Error(`External platform not found: ${platformCode}`);
      return one;
    },
    enabled: !!platformCode,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}
