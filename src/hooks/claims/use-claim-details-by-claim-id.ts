import { useQuery } from "@tanstack/react-query";
import { ClaimsService } from "@/services/claims-service";

export interface ClaimDetailListItem {
  id: string;
  수진자성명: string;
  수진자주민등록번호?: string;
  updatedAt?: string;
  진료내역리스트?: any[];
  상병내역리스트?: any[];
  처방내역리스트?: any[];
  특정내역리스트?: any[];
  hasError?: boolean;
  isReviewed?: boolean;
  isExcluded?: boolean;
  hasReviewMemo?: boolean;
}

export interface ClaimDetailListResponse {
  success: boolean;
  data: ClaimDetailListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useClaimDetailsByClaimId = (
  claimId: string,
  params: {
    hasError?: boolean;
    isReviewed?: boolean;
    isExcluded?: boolean;
    hasReviewMemo?: boolean;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ["claim-details-by-claim-id", claimId, params],
    queryFn: async (): Promise<ClaimDetailListResponse> => {
      const res = await ClaimsService.getClaimDetails(claimId, params as any);
      return res as ClaimDetailListResponse;
    },
    enabled: !!claimId,
    staleTime: 0,
    refetchOnMount: true,
  });
};


