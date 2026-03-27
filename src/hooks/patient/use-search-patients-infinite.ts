// 해당 병원의 검색 환자 리스트 조회 (cursor 기반 무한 스크롤)

import { useInfiniteQuery } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type { PatientsListQueryParams, PatientsListResponse } from "@/types/patient-types";

export type SearchPatientsQuery = PatientsListQueryParams;

export const useSearchPatientsInfinite = (
  query: SearchPatientsQuery & { enabled?: boolean }
) => {
  const { enabled, ...searchParams } = query;
  const shouldEnable =
    enabled !== undefined
      ? enabled
      : Object.keys(searchParams).length > 0 && !!searchParams.search?.trim();

  return useInfiniteQuery({
    queryKey: ["patients", "infinite", searchParams],
    queryFn: async ({ pageParam }: { pageParam: string | number | null | undefined }) => {
      return PatientsService.getPatients({
        ...searchParams,
        cursor: pageParam ?? undefined,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: PatientsListResponse) => {
      if (lastPage?.hasNextPage === false) return undefined;
      if (lastPage?.hasNextPage === true) return lastPage?.nextCursor ?? undefined;
      // fallback: nextCursor가 있으면 다음 페이지가 있다고 간주
      return lastPage?.nextCursor ?? undefined;
    },
    enabled: shouldEnable,
    refetchOnWindowFocus: false,
  });
};


