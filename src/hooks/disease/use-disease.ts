import { useQuery } from "@tanstack/react-query";
import { DiseasesService } from "@/services/diseases-service";

export const useDisease = (id: string) => {
  return useQuery({
    queryKey: ["disease", id],
    queryFn: async () => {
      return DiseasesService.getDisease(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
  });
};
