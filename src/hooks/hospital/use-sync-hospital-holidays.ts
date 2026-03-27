import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import type { SyncHospitalHolidaysRequest } from "@/types/hospital-types";

export function useSyncHospitalHolidays(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      holidays,
    }: {
      id: number;
      holidays: SyncHospitalHolidaysRequest[];
    }) => {
      return await HospitalsService.syncHolidays(id, {
        holidays: holidays,
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
