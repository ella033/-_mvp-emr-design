import { useInfiniteQuery } from "@tanstack/react-query";
import { DiseaseLibrariesService } from "@/services/disease-libraries-service";
import type { DiseaseLibrariesParamType } from "@/types/master-data/disease-libraries/disease-libraries-param-type";

export function useSearchDiseaseLibraries(
  query?: DiseaseLibrariesParamType,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ["disease-libraries", "search", query],
    queryFn: async ({ pageParam = 0 }) => {
      return await DiseaseLibrariesService.searchDiseaseLibraries({
        ...query,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    enabled: enabled && (!!query?.keyword || query?.keyword === undefined),
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 10 * 60 * 1000, // 10분
  });
}
