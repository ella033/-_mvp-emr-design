import { ClaimsService } from "@/services/claims-service";
import { useQuery } from "@tanstack/react-query";

export interface ClaimsResponse {
  id: string;
  progress: string;
  청구서서식버전: string;
  명세서서식버전: string;
  청구번호: string;
  서식번호: string;
  요양기관_의료급여기관_기호: string;
  수신기관: string;
  보험자종별구분_의료급여진료구분: string | null;
  청구구분: string;
  청구단위구분: string;
  진료구분: string;
  진료분야구분: string;
  진료형태: string;
  진료년월: string;
  건수: string;
  "요양급여비용총액 1": string;
  본인일부부담금: string;
  본인부담상한액_초과금총액: string;
  청구액: string;
  지원금: string;
  장애인의료비: string;
  "요양급여비용총액 2 진료비총액": string;
  보훈청구액: string;
  "건강보험 의료급여 100분의100본인부담금총액": string;
  보훈_본인일부부담금: string;
  "100분의100미만 총액": string;
  "100분의100미만 본인일부부담금": string;
  "100분의100미만 청구액": string;
  "100분의100미만 보훈청구액": string;
  차등수가적용구분_진료_조제_일수: string;
  의사_약사_수: string;
  차등지수: string;
  차등수가청구액: string;
  청구일자: string;
  청구인: string;
  작성자성명: string;
  작성자생년월일: string;
  검사승인번호: string;
  대행청구단체_기호: string;
  참조란: string;
}

export interface ClaimsApiResponse {
  success: boolean;
  data: ClaimsResponse[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchCriteria: {
    medicalInstitutionCode: string;
    claimFormVersion: string;
    formNumber: string;
    treatmentYearMonth: string;
    treatmentType: string;
    claimClassification: string;
  };
}

interface UseClaimsParams {
  progressStatus?: string;
  formNumber?: string;
  treatmentYearMonth?: string;
  treatmentType?: string;
  claimClassification?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const useClaims = (params: UseClaimsParams = {}) => {  
  return useQuery({
    queryKey: ["claims", params],
    queryFn: async (): Promise<ClaimsApiResponse> => {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "ALL") {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await ClaimsService.getClaims(Object.fromEntries(searchParams.entries()));
      return response;
    },
  });
}; 

export const useClaimById = (id: string) => {  
  return useQuery({
		queryKey: ["claim", id],
		queryFn: async () => {
			const res = await ClaimsService.getClaimById(id);
			return (res as any)?.data ?? res;
		},
    staleTime: 0,
    refetchOnMount: true,
	});
};