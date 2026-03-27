import { useQuery } from "@tanstack/react-query";
import { DiseasesService } from "@/services/diseases-service";

export const useDiseasesByEncounter = (encounterId: string) => {
  return useQuery({
    queryKey: ["diseases", encounterId],
    queryFn: async () => {
      return DiseasesService.getDiseasesByEncounter(encounterId);
    },
    enabled: !!encounterId && !["undefined", "null"].includes(encounterId),
  });
};
