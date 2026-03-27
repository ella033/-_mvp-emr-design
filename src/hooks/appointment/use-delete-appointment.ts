import { useMutation } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type { DeleteAppointmentResponse } from "@/types/appointments/appointments";

export function useDeleteAppointment(options?: {
  onSuccess?: (data: DeleteAppointmentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await AppointmentsService.deleteAppointment(id);
    },
    ...options,
  });
}
