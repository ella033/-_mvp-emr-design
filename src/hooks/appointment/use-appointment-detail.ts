import { useQuery } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type { Appointment } from "@/types/appointments/appointments";

export function useAppointmentDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["appointment", "detail", id],
    queryFn: async (): Promise<Appointment> => {
      if (!id) throw new Error("Appointment ID is required");
      return AppointmentsService.getAppointment(id);
    },
    enabled: !!id && typeof id === "number" && id > 0,
  });
}
