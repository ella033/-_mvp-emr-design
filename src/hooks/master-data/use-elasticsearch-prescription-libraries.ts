import { useQuery } from "@tanstack/react-query";
import { ElasticsearchService } from "@/services/elasticsearch-service";
import type { ElasticsearchPrescriptionSearchAllResponse } from "@/types/elasticsearch/prescription-search-types";

interface UseElasticsearchPrescriptionLibrariesParams {
  keyword: string;
  limit?: number;
  enabled?: boolean;
  categories?: Array<
    | "disease"
    | "bundle"
    | "userCode"
    | "medicalLibrary"
    | "drugLibrary"
    | "materialLibrary"
  >;
}

export const useElasticsearchPrescriptionLibraries = ({
  keyword,
  limit = 100,
  categories,
  enabled = true,
}: UseElasticsearchPrescriptionLibrariesParams) => {
  const emptyResponse: ElasticsearchPrescriptionSearchAllResponse = {
    items: [],
    totalCount: {
      all: 0,
      disease: 0,
      bundle: 0,
      userCode: 0,
      medicalLibrary: 0,
      drugLibrary: 0,
      materialLibrary: 0,
    },
    nextCursor: {
      disease: -1,
      bundle: -1,
      userCode: -1,
      medicalLibrary: -1,
      drugLibrary: -1,
      materialLibrary: -1,
    },
    hasNextPage: false,
  };

  return useQuery({
    queryKey: ["prescription-libraries", "elasticsearch", keyword, limit, categories],
    queryFn: async () => {
      if (!keyword.trim()) return emptyResponse;

      return await ElasticsearchService.searchPrescriptionLibraries(
        keyword.trim(),
        limit,
        categories
      );
    },
    enabled: enabled && keyword.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: (failureCount, _error) => {
      // Elasticsearch 서버 연결 실패시 재시도 제한
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
};
