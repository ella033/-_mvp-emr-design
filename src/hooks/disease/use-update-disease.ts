import { useMutation } from "@tanstack/react-query";
import { DiseasesService } from "@/services/diseases-service";

export function useUpdateDisease(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      DiseasesService.updateDisease(id, data),
    ...options,
  });
}
