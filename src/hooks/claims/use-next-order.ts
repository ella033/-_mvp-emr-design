import { useQuery } from "@tanstack/react-query";
import { ClaimsService } from "@/services/claims-service";

export interface NextOrderResponse {
  nextOrder: string;
}

interface UseNextOrderParams {
  claimClassification?: string;
  formNumber?: string;
  treatmentYearMonth?: string;
  treatmentType?: string;
}

export const useNextOrder = (params: UseNextOrderParams = {}) => {
  const isEnabled = !!params.formNumber && !!params.treatmentYearMonth;
  
  return useQuery({
    queryKey: ["nextOrder", params],
    queryFn: async (): Promise<NextOrderResponse> => {
      const response = await ClaimsService.getNextOrder(params);
      return response;
    },
    enabled: isEnabled,
  });
}; 