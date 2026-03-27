"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useUserStore } from "@/store/user-store";
import type {
  PatientChatMessage,
  PatientChatListResponse,
} from "@/types/patient-chat-types";

const STORAGE_KEY_PREFIX = "patient-chat-last-read";

function getLastReadId(userId: number, patientId: number): number {
  try {
    const key = `${STORAGE_KEY_PREFIX}:${userId}:${patientId}`;
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function setLastReadId(userId: number, patientId: number, messageId: number) {
  try {
    const key = `${STORAGE_KEY_PREFIX}:${userId}:${patientId}`;
    localStorage.setItem(key, String(messageId));
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

/** infiniteQuery 캐시에서 메시지 배열 추출 */
function getMessagesFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  numericId: number
): PatientChatMessage[] {
  const cached: any = queryClient.getQueryData(["patient-chats", numericId]);
  if (!cached) return [];
  // infiniteQuery 구조: { pages: PatientChatListResponse[], pageParams }
  if (cached.pages) {
    return cached.pages.flatMap(
      (page: PatientChatListResponse) => page.items ?? []
    );
  }
  // 혹시 배열이면 그대로
  if (Array.isArray(cached)) return cached;
  return [];
}

/**
 * 환자 채팅의 읽지 않은 메시지 수를 추적하는 훅.
 * 채팅 패널이 열려있지 않을 때도 사용 가능 (아이콘 뱃지 표시용).
 * usePatientChat의 infiniteQuery 캐시를 공유해서 읽음.
 */
export function usePatientChatUnread(
  patientId: number | string | undefined | null
) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useUserStore();
  const currentUserId = user?.id ?? 0;
  const numericId = patientId ? Number(patientId) : null;

  // 캐시 변경을 구독하여 unreadCount 재계산
  const messages = useMemo(() => {
    if (!numericId) return [];
    return getMessagesFromCache(queryClient, numericId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericId, queryClient.getQueryState(["patient-chats", numericId])?.dataUpdatedAt]);

  // markAsRead 호출 시 즉시 재계산을 트리거하기 위한 state
  const [lastReadVersion, setLastReadVersion] = useState(0);

  // 읽지 않은 메시지 수 계산
  const unreadCount = useMemo(() => {
    if (!messages.length || !numericId || !currentUserId) return 0;
    const lastReadId = getLastReadId(currentUserId, numericId);
    return messages.filter(
      (msg) => msg.id > lastReadId && msg.authorId !== currentUserId
    ).length;
  }, [messages, numericId, currentUserId, lastReadVersion]);

  // 소켓 이벤트로 실시간 업데이트 (debounce로 연속 이벤트 병합)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!socket || !numericId) return;

    const handleAny = (_eventName: string, ...args: any[]) => {
      const payload = args?.[0];
      if (!_eventName?.startsWith("db.")) return;
      if (payload?.table !== "patient_chat") return;

      const record =
        payload?.new ?? payload?.data ?? payload?.record ?? payload;
      const recordPatientId = record?.patientId ?? record?.patient_id;
      if (recordPatientId && Number(recordPatientId) !== numericId) return;

      // debounce: 연속 소켓 이벤트를 300ms 내 1회로 병합
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        // type: 'all' → 비활성(패널 닫힘) 쿼리도 refetch하여 뱃지 갱신
        queryClient.refetchQueries({
          queryKey: ["patient-chats", numericId],
          type: "all",
        });
      }, 300);
    };

    socket.onAny(handleAny);
    return () => {
      socket.offAny(handleAny);
      clearTimeout(debounceTimerRef.current);
    };
  }, [socket, numericId, queryClient]);

  // 읽음 처리
  const markAsRead = useCallback(() => {
    if (!messages.length || !numericId || !currentUserId) return;
    const maxId = Math.max(...messages.map((m) => m.id));
    const currentLastRead = getLastReadId(currentUserId, numericId);
    if (maxId <= currentLastRead) return; // 이미 읽은 상태면 skip
    setLastReadId(currentUserId, numericId, maxId);
    setLastReadVersion((v) => v + 1); // unreadCount 즉시 재계산 트리거
  }, [messages, numericId, currentUserId]);

  return { unreadCount, markAsRead };
}
