import { BenefitsService } from "@/services/benefits-service";
import type { UpdateBenefitRequest } from "@/types/benefits-types";
import { useMutation } from "@tanstack/react-query";

export const useUpdateBenefit = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBenefitRequest }) =>
      BenefitsService.updateBenefit(id, data),
  });
};
