import { useQuery } from "@tanstack/react-query";
import { EncountersService } from "@/services/encounters-service";

export const useEncounter = (id: string) => {
  return useQuery({
    queryKey: ["encounter", id],
    queryFn: async () => {
      return EncountersService.getEncounter(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
    refetchOnMount: true,
    staleTime: 0,
  });
};
