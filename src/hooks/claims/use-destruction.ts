import { ClaimsService } from "@/services/claims-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface DestructionCandidatesParams {
  type: string;
  startDate: string;
  endDate: string;
  medicalInstitutionCode?: string;
  patientName?: string;
  page?: number;
  limit?: number;
}

export const useDestructionCandidates = (params: DestructionCandidatesParams) => {
  return useQuery({
    queryKey: ["destruction-candidates", params],
    queryFn: async () => {
      if (!params.startDate || !params.endDate) return { data: [], pagination: { totalCount: 0, totalPages: 0, page: 1, limit: 20 } };
      const res = await ClaimsService.getDestructionCandidates(params);
      return res;
    },
    enabled:
      !!params.type &&
      !!params.startDate &&
      !!params.endDate &&
      params.startDate !== 'Invalid Date' &&
      params.endDate !== 'Invalid Date',
  });
};

export const useDestroyClaimDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { type: string; claimDetailIds: string[]; reason: string }) => {
      return await ClaimsService.destroyClaimDetails(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destruction-candidates"] });
    },
  });
};

export const useDestroyDestructionCandidatesByRange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { type: string; startDate: string; endDate: string; medicalInstitutionCode?: string; reason: string }) => {
      return await ClaimsService.destroyDestructionCandidatesByRange(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destruction-candidates"] });
    },
  });
};

export const useDestructionLogs = (params: { startDate?: string; endDate?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["destruction-logs", params],
    queryFn: async () => {
      return await ClaimsService.getDestructionLogs(params);
    },
  });
};
