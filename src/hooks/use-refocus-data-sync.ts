"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 탭 포커스 복귀 시 소켓으로 밀려 있던 이벤트에 의존하지 않고
 * 주요 쿼리를 무효화하여 최신 데이터를 refetch 하도록 합니다.
 *
 * - 백그라운드 탭에서 웹소켓이 끊기거나 지연되면, 복귀 후에도
 *   밀린 메시지가 순서대로 오지 않거나 누락될 수 있음.
 * - visibility 복귀 시 소켓 재연결은 SocketContext에서 하고,
 *   여기서는 데이터 일관성을 위해 해당 구간에 해당하는 쿼리만 무효화.
 */
export function useRefocusDataSync() {
  const queryClient = useQueryClient();
  const syncInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);

  useEffect(() => {
    const handleVisibilityRefocus = () => {
      const now = Date.now();
      if (syncInFlightRef.current || now - lastSyncAtRef.current < 5000) {
        return;
      }
      syncInFlightRef.current = true;
      lastSyncAtRef.current = now;

      try {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            if (!Array.isArray(key) || key.length === 0) return false;
            const first = key[0];
            return (
              first === "registrations" ||
              first === "appointments" ||
              first === "vital-sign-measurements" ||
              first === "patients"
            );
          },
        });
      } finally {
        syncInFlightRef.current = false;
      }
    };

    window.addEventListener("app:visibility-visible", handleVisibilityRefocus);
    return () => window.removeEventListener("app:visibility-visible", handleVisibilityRefocus);
  }, [queryClient]);
}
