import { useMutation } from "@tanstack/react-query";
import { UsageService } from "@/services/usage-service";

export function useUsageDelete(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await UsageService.deleteUsage(id);
    },
    ...options,
  });
}
