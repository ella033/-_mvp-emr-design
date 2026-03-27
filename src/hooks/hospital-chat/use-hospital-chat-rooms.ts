"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { HospitalChatsService } from "@/services/hospital-chats-service";
import type { HospitalChatRoom } from "@/types/hospital-chat-types";

export const ROOMS_KEY = ["hospital-chat-rooms"] as const;

export function useHospitalChatRooms() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const query = useQuery<HospitalChatRoom[]>({
    queryKey: ROOMS_KEY,
    queryFn: () => HospitalChatsService.getRooms(),
    // 소켓 이벤트 누락 대비 30초마다 폴링
    refetchInterval: 30_000,
  });

  const invalidateRooms = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...ROOMS_KEY] });
  }, [queryClient]);

  /** 특정 방의 unreadCount를 optimistic하게 0으로 초기화 */
  const clearRoomUnread = useCallback(
    (roomId: number) => {
      queryClient.setQueryData<HospitalChatRoom[]>([...ROOMS_KEY], (old) =>
        old?.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
      );
    },
    [queryClient],
  );

  // 소켓으로 채팅방 목록 실시간 갱신
  useEffect(() => {
    if (!socket) return;

    socket.on("chat.message", invalidateRooms);
    socket.on("chat.member", invalidateRooms);
    return () => {
      socket.off("chat.message", invalidateRooms);
      socket.off("chat.member", invalidateRooms);
    };
  }, [socket, invalidateRooms]);

  return {
    rooms: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    invalidateRooms,
    clearRoomUnread,
  };
}
