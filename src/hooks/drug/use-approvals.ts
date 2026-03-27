import { useQuery } from "@tanstack/react-query";
import { DrugsService } from "@/services/drugs-service";

export const useDrugApprovals = (id: string) => {
  return useQuery({
    queryKey: ["drug-approvals", id],
    queryFn: async () => {
      return await DrugsService.getDrugApprovals(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
  });
};
