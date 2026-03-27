import { useQuery } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";

export const useCheckRevisit = (patientId: string, baseDate: string) => {
  return useQuery({
    queryKey: ["encounters", patientId, baseDate],
    queryFn: async () => {
      return EncountersService.getCheckRevisit(patientId, baseDate);
    },
    enabled: !!patientId && !!baseDate && !["undefined", "null"].includes(patientId) && !["undefined", "null"].includes(baseDate),
  })
}