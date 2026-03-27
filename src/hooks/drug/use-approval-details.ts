import { useQuery } from "@tanstack/react-query";
import { DrugsService } from "@/services/drugs-service";

export const useDrugApprovalDetails = (id: string) => {
  return useQuery({
    queryKey: ["drug-approval-details", id],
    queryFn: async () => {
      return await DrugsService.getDrugApprovalDetails(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
  });
};
