import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SpecificDetailCodesService,
  type SpecificDetailCodesSearchParams,
} from "@/services/specific-detail-codes-service";
import type { SpecificDetailCode } from "@/types/chart/specific-detail-code-type";

const QUERY_KEY = "specific-detail-codes";

/**
 * 특정내역 코드 목록 조회 훅
 */
export const useSpecificDetailCodes = (
  params: SpecificDetailCodesSearchParams
) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => {
      return SpecificDetailCodesService.getSpecificDetailCodes(params);
    },
  });
};

/**
 * 특정내역 코드 상세 조회 훅
 */
export const useSpecificDetailCodeByCode = (code: string | null) => {
  return useQuery({
    queryKey: [QUERY_KEY, "code", code],
    queryFn: async () => {
      if (!code) return null;
      return SpecificDetailCodesService.getSpecificDetailCodeByCode(code);
    },
    enabled: !!code,
  });
};

/**
 * 특정내역 코드 생성 훅
 */
export const useCreateSpecificDetailCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Omit<
        SpecificDetailCode,
        "id" | "createId" | "createDateTime" | "updateId" | "updateDateTime"
      >
    ) => SpecificDetailCodesService.createSpecificDetailCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * 특정내역 코드 수정 훅
 */
export const useUpdateSpecificDetailCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<SpecificDetailCode>;
    }) => SpecificDetailCodesService.updateSpecificDetailCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * 특정내역 코드 삭제 훅
 */
export const useDeleteSpecificDetailCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      SpecificDetailCodesService.deleteSpecificDetailCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
