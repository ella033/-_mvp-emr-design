import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";

export function useUpdateAppointmentStatus(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: number }) => {
      return await AppointmentsService.updateAppointmentStatus(id, { status });
    },
    onSuccess: (data, variables) => {
      // 예약 관련 쿼리들을 무효화
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointment", "detail", variables.id],
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
