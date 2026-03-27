import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type { PatientChartQuery } from "@/types/chart/patient-chart-type";

export const usePatientCharts = (query: PatientChartQuery) => {
  return useInfiniteQuery({
    queryKey: ["patient", query.id, "charts", query],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      return PatientsService.getPatientChart({
        ...query,
        cursor: pageParam ? Number(pageParam) : undefined,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    enabled: !!query.id && typeof query.id === "number" && query.id > 0,
    refetchOnWindowFocus: false,
  });
};

export const usePatientChartFilter = (patientId: number | undefined) => {
  return useQuery({
    queryKey: ["patient", patientId, "chartFilter"],
    queryFn: () => PatientsService.getPatientChartFilter(patientId!),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
  });
};
