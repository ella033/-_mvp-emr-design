import { useQuery } from "@tanstack/react-query";
import { DrugsService } from "@/services/drugs-service";

export const useDrug = (id: string) => {
  return useQuery({
    queryKey: ["drug", id],
    queryFn: async () => {
      return await DrugsService.getDrug(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
  });
};
