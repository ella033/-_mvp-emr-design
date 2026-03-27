import { BenefitsService } from "@/services/benefits-service";
import { useMutation } from "@tanstack/react-query";

export const useDeleteBenefit = () => {
  return useMutation({
    mutationFn: (id: string) => BenefitsService.deleteBenefit(id),
  });
};
