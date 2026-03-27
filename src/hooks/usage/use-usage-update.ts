import { useMutation } from "@tanstack/react-query";
import { UsageService } from "@/services/usage-service";

export function useUsageUpdate(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: (data: any) => UsageService.updateUsage(data.id, data),
    ...options,
  });
}
