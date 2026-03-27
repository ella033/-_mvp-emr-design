import { useQuery } from "@tanstack/react-query";
import { ProhibitedDrugsService } from "@/services/prohibited-drugs-service";

export const useProhibitedDrugs = (patientId: number | null) => {
  return useQuery({
    queryKey: ["prohibited-drugs", patientId],
    queryFn: async () => {
      if (!patientId) {
        return [];
      }
      return ProhibitedDrugsService.getProhibitedDrugs(patientId);
    },
    enabled: !!patientId && typeof patientId === "number" && patientId > 0,
  });
};
