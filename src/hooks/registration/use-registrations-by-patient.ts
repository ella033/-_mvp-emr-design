import { useQuery } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";
import type { Registration } from "@/types/registration-types";

export function useRegistrationsByPatient(
  patientId: string,
  beginDate: Date | null,
  endDate: Date | null
) {
  return useQuery({
    queryKey: ["registrations", patientId],
    queryFn: async (): Promise<Registration[]> => {
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
      const beginDateStr = beginDate
        ? beginDate.toISOString()
        : startOfDay.toISOString();
      const endDateStr = endDate
        ? endDate.toISOString()
        : endOfDay.toISOString();

      return RegistrationsService.getRegistrationsByPatient(
        patientId,
        beginDateStr,
        endDateStr
      );
    },
    enabled: !!patientId && !["undefined", "null"].includes(patientId), // patientId가 있을 때만 쿼리 실행
  });
}
