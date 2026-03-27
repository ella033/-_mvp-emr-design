"use client";

import { useMemo } from "react";
import { useHospitalChatRooms } from "./use-hospital-chat-rooms";

/**
 * 병원 그룹 채팅 전체 안읽은 메시지 수 (뱃지 표시용)
 * useHospitalChatRooms 쿼리를 직접 구독하여 항상 최신 상태 유지.
 */
export function useHospitalChatUnread() {
  const { rooms } = useHospitalChatRooms();

  const totalUnread = useMemo(() => {
    return rooms.reduce((sum, room) => sum + room.unreadCount, 0);
  }, [rooms]);

  return { totalUnread };
}
