import { useInfiniteQuery } from "@tanstack/react-query";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";
import type { PrescriptionUserCodesSearchAllParamType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-param-type";

export function usePrescriptionUserCodesSearchAll(
  param: PrescriptionUserCodesSearchAllParamType
) {
  const stableParam = param
    ? Object.fromEntries(
        Object.entries(param).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      )
    : {};

  return useInfiniteQuery({
    queryKey: ["prescription-user-codes", "search-all", stableParam],
    queryFn: async ({ pageParam = {} }) => {
      // pageParam을 객체로 받아서 각 cursor별로 관리
      const cursorParams = {
        diseaseCursor:
          stableParam.diseaseCursor || pageParam.diseaseCursor || 0,
        bundleCursor: stableParam.bundleCursor || pageParam.bundleCursor || 0,
        userCodeCursor:
          stableParam.userCodeCursor || pageParam.userCodeCursor || 0,
        libraryCursor:
          stableParam.libraryCursor || pageParam.libraryCursor || 0,
      };

      return await PrescriptionUserCodeService.searchAllPrescriptionUserCodes({
        baseDate: stableParam.baseDate,
        ...stableParam,
        ...cursorParams,
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNextPage) return undefined;

      // 다음 페이지에서 사용할 cursor 값들 반환
      return {
        diseaseCursor: lastPage.nextCursor.disease,
        bundleCursor: lastPage.nextCursor.bundle,
        userCodeCursor: lastPage.nextCursor.userCode,
        libraryCursor: lastPage.nextCursor.library,
      };
    },
    initialPageParam: {
      diseaseCursor: 0,
      bundleCursor: 0,
      userCodeCursor: 0,
      libraryCursor: 0,
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 10 * 60 * 1000, // 10분
    enabled: !!stableParam.keyword,
  });
}
