import { useQuery } from "@tanstack/react-query";
import { BenefitsService } from "@/services/benefits-service";

export function useBenefits(enabled: boolean = true) {
  return useQuery({
    queryKey: ["benefits"],
    queryFn: () => BenefitsService.getBenefits(),
    enabled,
  });
}
