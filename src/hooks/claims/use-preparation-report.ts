import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PreparationReportQueryParams,
  PreparationReportSavePayload,
} from "@/types/claims/preparation-report";
import { PreparationReportService } from "@/services/preparation-report-service";

const preparationReportKeys = {
  list: (params: PreparationReportQueryParams) =>
    ["preparation-report", "list", params] as const,
  detail: (id: string) => ["preparation-report", "detail", id] as const,
};

export function usePreparationReports(params: PreparationReportQueryParams) {
  const isRangeReady = Boolean(params.startDate) && Boolean(params.endDate);

  return useQuery({
    queryKey: preparationReportKeys.list(params),
    queryFn: async () => {
      return await PreparationReportService.getReports(params);
    },
    enabled: isRangeReady,
  });
}

export function usePreparationReportDetail(id?: string | null) {
  const hasId = Boolean(id);

  return useQuery({
    queryKey: id
      ? preparationReportKeys.detail(id)
      : ["preparation-report", "detail"],
    queryFn: async () => {
      if (!id) return null;
      return await PreparationReportService.getReportById(id);
    },
    enabled: hasId,
  });
}

export function usePreparationReportSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PreparationReportSavePayload) => {
      return await PreparationReportService.saveReport(payload);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: ["preparation-report", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: preparationReportKeys.detail(saved.id),
      });
    },
  });
}

export function usePreparationReportSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await PreparationReportService.sendReport(id);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["preparation-report", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: preparationReportKeys.detail(response.id),
      });
    },
  });
}
