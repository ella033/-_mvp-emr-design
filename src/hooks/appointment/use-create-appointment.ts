import { useMutation } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type {
  CreateAppointmentRequest,
  CreateAppointmentResponse,
} from "@/types/appointments/appointments";

export function useCreateAppointment(options?: {
  onSuccess?: (data: CreateAppointmentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: CreateAppointmentRequest) => {
      return await AppointmentsService.createAppointment(data);
    },
    ...options,
  });
}
