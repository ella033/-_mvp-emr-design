import { useMutation } from "@tanstack/react-query";
import { UsageService } from "@/services/usage-service";

export function useUsageCreate(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: any) => {
      return await UsageService.createUsage(data);
    },
    ...options,
  });
}
