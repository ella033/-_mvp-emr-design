// 해당 병원의 검색 환자 리스트 조회

import { useQuery } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type { PatientsListQueryParams } from "@/types/patient-types";

export const useSearchPatients = (
  query: PatientsListQueryParams & { enabled?: boolean }
) => {
  const { enabled, ...searchParams } = query;
  const shouldEnable = enabled !== undefined
    ? enabled
    : Object.keys(searchParams).length > 0 && !!searchParams.search?.trim();

  return useQuery({
    queryKey: ["patients", searchParams],
    queryFn: async () => {
      return PatientsService.getPatients(searchParams);
    },
    enabled: shouldEnable,
  });
};
