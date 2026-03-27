import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PrescriptionLibrariesService } from "@/services/master-data/prescription-libraries-service";
import type { PrescriptionLibrariesParamType } from "@/types/master-data/prescription-libraries/prescription-libraries-param-type";

export function useSearchPrescriptionLibraries(param?: PrescriptionLibrariesParamType) {
  const stableParam = param
    ? Object.fromEntries(
        Object.entries(param).filter(([_, value]) => value !== undefined && value !== "")
      )
    : {};

  return useInfiniteQuery({
    queryKey: ["prescription-libraries", "search", stableParam],
    queryFn: async ({ pageParam = 0 }) => {
      return await PrescriptionLibrariesService.searchPrescriptionLibraries({
        ...stableParam,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 5 * 60 * 1000, // 5분
  });
}

export function usePrescriptionLibraryById(id: number | undefined) {
  return useQuery({
    queryKey: ["prescription-libraries", "detail", id],
    queryFn: () => PrescriptionLibrariesService.getPrescriptionLibraryById(id!),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 5 * 60 * 1000, // 5분
  });
}
