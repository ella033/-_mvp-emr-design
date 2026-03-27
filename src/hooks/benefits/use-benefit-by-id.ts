import { useQuery } from "@tanstack/react-query";
import { BenefitsService } from "@/services/benefits-service";

export function useBenefitById(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["benefit", id],
    queryFn: () => BenefitsService.getBenefitById(id),
    enabled: enabled && !!id,
  });
}
