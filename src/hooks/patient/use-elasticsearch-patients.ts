import { useQuery } from "@tanstack/react-query";
import { ElasticsearchService } from "@/services/elasticsearch-service";

interface UseElasticsearchPatientsParams {
  query: string;
  limit?: number;
  enabled?: boolean;
}

export const useElasticsearchPatients = ({
  query,
  limit = 20,
  enabled = true,
}: UseElasticsearchPatientsParams) => {
  return useQuery({
    queryKey: ["patients", "elasticsearch", query, limit],
    queryFn: async () => {
      if (!query.trim()) return [];

      return await ElasticsearchService.searchPatients(
        query.trim(),
        limit
      );
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: (failureCount, _error) => {
      // Elasticsearch 서버 연결 실패시 재시도 제한
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
};
