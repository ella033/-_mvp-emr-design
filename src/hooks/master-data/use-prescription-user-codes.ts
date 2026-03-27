import { useInfiniteQuery } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";
import type { PrescriptionUserCodesParamType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-param-type";

export function usePrescriptionUserCodes(param?: PrescriptionUserCodesParamType) {
  const stableParam = param
    ? Object.fromEntries(
        Object.entries(param).filter(([_, value]) => value !== undefined && value !== "")
      )
    : {};

  return useInfiniteQuery({
    queryKey: ["prescription-user-codes", "search", stableParam],
    queryFn: async ({ pageParam = 0 }) => {
      return await PrescriptionUserCodeService.getPrescriptionUserCodes({
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
