import { BenefitsService } from "@/services/benefits-service";
import type { CreateBenefitRequest } from "@/types/benefits-types";
import { useMutation } from "@tanstack/react-query";

export const useCreateBenefit = () => {
  return useMutation({
    mutationFn: (data: CreateBenefitRequest) =>
      BenefitsService.createBenefit(data),
  });
};
