import { useQuery } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type { AppointmentWithHistory } from "@/types/appointments/appointment-history";

export function useAppointmentHistoryByPatient(
  patientId: number | undefined
) {
  return useQuery({
    queryKey: ["appointments", "history", "patient", patientId],
    queryFn: async (): Promise<AppointmentWithHistory[]> => {
      if (!patientId) throw new Error("Patient ID is required");
      return AppointmentsService.getAppointmentHistoryByPatient(patientId);
    },
    enabled: !!patientId && typeof patientId === "number" && patientId > 0,
  });
}
