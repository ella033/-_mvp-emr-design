"use client";

import { useQuery } from "@tanstack/react-query";
import { HospitalChatsService } from "@/services/hospital-chats-service";
import type { MentionPatientResult } from "@/types/hospital-chat-types";

/**
 * @멘션 환자 검색 (debounce는 호출측에서 처리)
 */
export function usePatientMention(query: string) {
  return useQuery<MentionPatientResult[]>({
    queryKey: ["mention-patients", query],
    queryFn: () => HospitalChatsService.searchMentionPatients(query),
    enabled: query.length >= 1,
    staleTime: 10_000,
  });
}
