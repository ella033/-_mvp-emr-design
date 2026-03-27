import { AccessLogsService } from "@/services/access-logs-service";
import { useInfiniteQuery } from "@tanstack/react-query";

export const usePersonalAccessLogs = (params: any) => {
  const { enabled, ...apiParams } = params;
  return useInfiniteQuery({
    queryKey: ["personal-access-logs", apiParams],
    queryFn: ({ pageParam = 1 }) => 
      AccessLogsService.getAccessLogs({ ...apiParams, type: "PERSONAL", page: pageParam, limit: 50 }),
    getNextPageParam: (lastPage: any) => {
      const { page, lastPage: totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!apiParams.startDate && !!apiParams.endDate && enabled !== false,
  });
};

export const useMedicalAccessLogs = (params: any) => {
  const { enabled, ...apiParams } = params;
  return useInfiniteQuery({
    queryKey: ["medical-access-logs", apiParams],
    queryFn: ({ pageParam = 1 }) => 
      AccessLogsService.getAccessLogs({ ...apiParams, type: "CLINICAL", page: pageParam, limit: 50 }),
    getNextPageParam: (lastPage: any) => {
      const { page, lastPage: totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!apiParams.startDate && !!apiParams.endDate && enabled !== false,
  });
};
