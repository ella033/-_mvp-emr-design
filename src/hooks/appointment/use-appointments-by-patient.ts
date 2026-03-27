import { useQuery } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type { Appointment } from "@/types/appointments/appointments";

export function useAppointmentsByPatient(patientId: number | undefined) {
  return useQuery({
    queryKey: ["appointments", "patient", patientId],
    queryFn: async (): Promise<Appointment[]> => {
      if (!patientId) throw new Error("Patient ID is required");
      const today = new Date();
      const beginDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      return AppointmentsService.getAppointmentsByPatient(
        patientId,
        beginDate,
        endDate
      );
    },
    enabled: !!patientId && typeof patientId === "number" && patientId > 0, // patientId가 있을 때만 쿼리 실행
  });
}
