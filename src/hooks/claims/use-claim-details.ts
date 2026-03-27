import { useQuery } from "@tanstack/react-query";
import { ClaimsService } from "@/services/claims-service";

export interface ClaimDetailItem {
  id?: string;
  chartNumber?: string;
  patientName?: string;
  birthDate?: string;
  gender?: string;
  treatmentDate?: string;
  lastModifiedDate?: string;
}

export interface ClaimDetailResponse {
  success?: boolean;
  data: ClaimDetailItem[];
}

interface UseClaimDetailsParams {
  startDate?: string;
  endDate?: string;
  insurance?: "HEALTH" | "AID";
  visit?: "INPATIENT" | "OUTPATIENT";
  excludeClaimed?: string; // "true" | "false"
}

export const useClaimDetails = (params: UseClaimDetailsParams = {}, enabled = true) => {
  return useQuery({
    queryKey: ["claim-details", params],
    queryFn: async (): Promise<ClaimDetailResponse> => {
      const result = await ClaimsService.searchClaimDetails(params as Record<string, string>);
      return result;
    },
    enabled: enabled && !!params.startDate && !!params.endDate && !!params.insurance && !!params.visit,
  });
};

