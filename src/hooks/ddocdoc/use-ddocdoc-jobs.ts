import { useQuery } from "@tanstack/react-query";
import { DdocDocService } from "@/services/ddocdoc-service";
import type { DdocDocJob } from "@/services/ddocdoc-service";

export interface UseDdocDocJobsOptions {
  service?: string;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

/**
 * DocDoc 일감 목록 조회 Hook
 * @description service 파라미터를 사용하여 일감 목록을 조회합니다. (기본값: "RESERVATION")
 * @param options - 쿼리 옵션
 * @returns React Query 결과
 */
export const useDdocDocJobs = (options?: UseDdocDocJobsOptions) => {
  const {
    service = "RESERVATION",
    enabled = true,
    staleTime,
    refetchInterval,
  } = options || {};

  return useQuery<DdocDocJob[]>({
    queryKey: ["ddocdoc", "jobs", service],
    queryFn: async () => {
      return DdocDocService.getJobs(service);
    },
    enabled,
    staleTime,
    refetchInterval,
  });
};
