import { useQuery } from "@tanstack/react-query";
import { DidService } from "@/services/did-service";
import type { DidQueuesResponse } from "@/types/did-types";

export const DID_QUEUES_QUERY_KEY = ["did", "queues"];

export function useDidQueues(options?: { refetchInterval?: number; roomName?: string }) {
  return useQuery<DidQueuesResponse>({
    queryKey: [...DID_QUEUES_QUERY_KEY, options?.roomName],
    queryFn: () => DidService.getQueues(options?.roomName),
    refetchInterval: options?.refetchInterval ?? 5000, // 기본 5초마다 새로고침
  });
}
