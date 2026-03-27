import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";

export function useSyncHospitalOperatingHours(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      operatingHours,
    }: {
      id: number;
      operatingHours: any[];
    }) => {
      return await HospitalsService.syncOperatingHours(id, {
        operatingHours,
      });
    },
    onSuccess: (data, variables) => {
      // 병원 관련 쿼리들을 무효화
      queryClient.invalidateQueries({
        queryKey: ["hospitals"],
      });
      queryClient.invalidateQueries({
        queryKey: ["hospital", variables.id],
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
