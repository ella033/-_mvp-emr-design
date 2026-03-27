import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MaterialReportQueryParams,
  MaterialReportSavePayload,
  MaterialReportTransmitPayload,
} from "@/types/claims/material-report";
import { MaterialReportService } from "@/services/material-report-service";

const materialReportKeys = {
  list: (params: MaterialReportQueryParams) =>
    ["material-report", "list", params] as const,
  detail: (id: string) => ["material-report", "detail", id] as const,
  search: (query: string) => ["material-report", "search", query] as const,
};

export function useMaterialReports(params: MaterialReportQueryParams) {
  const isRangeReady = Boolean(params.startDate) && Boolean(params.endDate);

  return useQuery({
    queryKey: materialReportKeys.list(params),
    queryFn: async () => {
      return await MaterialReportService.getReports(params);
    },
    enabled: isRangeReady,
  });
}

export function useMaterialReportDetail(id?: string | null) {
  const hasId = Boolean(id);

  return useQuery({
    queryKey: id ? materialReportKeys.detail(id) : ["material-report", "detail"],
    queryFn: async () => {
      if (!id) return null;
      return await MaterialReportService.getReportById(id);
    },
    enabled: hasId,
  });
}

export function useMaterialReportSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MaterialReportSavePayload) => {
      return await MaterialReportService.saveReport(payload);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: ["material-report", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: materialReportKeys.detail(saved.id),
      });
    },
  });
}

export function useMaterialReportSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MaterialReportTransmitPayload) => {
      return await MaterialReportService.sendReport(payload);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["material-report", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: materialReportKeys.detail(response.id),
      });
    },
  });
}

export function useMaterialSearch(query: string) {
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return useQuery({
    queryKey: materialReportKeys.search(trimmedQuery),
    queryFn: async () => {
      return await MaterialReportService.searchMaterials(trimmedQuery);
    },
    enabled: hasQuery,
  });
}
