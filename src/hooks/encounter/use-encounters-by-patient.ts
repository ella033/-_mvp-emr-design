import { useQuery } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";

export const useEncountersByPatient = (patientId: string) => {
  return useQuery({
    queryKey: ["encounters", patientId],
    queryFn: async () => {
      const today = new Date();
      const beginDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      return EncountersService.getEncountersByPatient(
        patientId,
        beginDate,
        endDate
      );
    },
    enabled: !!patientId && !["undefined", "null"].includes(patientId),
  });
};
