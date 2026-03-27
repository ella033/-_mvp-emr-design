import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProhibitedDrugsService } from "@/services/prohibited-drugs-service";
import type {
  ProhibitedDrug,
  UpsertManyProhibitedDrugsRequest,
} from "@/types/prohibited-drugs-type";

export function useProhibitedDrugsDeleteUpsertMany(options?: {
  onSuccess?: (data: ProhibitedDrug[]) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: number;
      data: UpsertManyProhibitedDrugsRequest;
    }) =>
      ProhibitedDrugsService.deleteUpsertManyProhibitedDrugs(patientId, data),
    onSuccess: (data, variables) => {
      // 처방금지약품 목록 쿼리 무효화하여 자동 리프레시
      queryClient.invalidateQueries({
        queryKey: ["prohibited-drugs", variables.patientId],
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as Error);
    },
  });
}
