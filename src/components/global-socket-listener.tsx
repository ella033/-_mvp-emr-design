"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useToastHelpers } from "@/components/ui/toast";
import { useReceptionSocketListener } from "@/hooks/reception/use-reception-socket-listener";
import { usePatientSocket } from "@/hooks/patient/use-patient-socket";
import { useVitalSocketListener } from "@/hooks/vital/use-vital-socket-listener";
import { useRefocusDataSync } from "@/hooks/use-refocus-data-sync";
import { useUserStore } from "@/store/user-store";

/**
 * 전역 소켓 이벤트 리스너 컴포넌트
 * @description 앱 전체에서 사용되는 소켓 이벤트 리스너를 초기화합니다.
 */
export default function GlobalSocketListener() {
  const { socket } = useSocket();
  const { success, error } = useToastHelpers();
  const queryClient = useQueryClient();
  const hasConnectedOnceRef = useRef(false);
  const currentUserId = useUserStore((s) => (s.user as any)?.id as number | undefined);

  // 탭 포커스 복귀 시 소켓 재연결 후 주요 쿼리 무효화(밀린 소켓 이벤트 대신 최신 데이터 refetch)
  useRefocusDataSync();

  // 접수 페이지 관련 소켓 이벤트 리스너 (appointment 변경 시 캐시 무효화)
  useReceptionSocketListener();

  // 환자(patient) 테이블 변경 이벤트 수신 → 접수 관련 데이터 재조회
  usePatientSocket();

  // 바이탈 사인 측정 소켓 이벤트 리스너 (vital_sign_measurement 변경 시 쿼리 무효화)
  useVitalSocketListener();

  // 소켓 재연결 시 모든 React Query 캐시 무효화 → 끊긴 동안 놓친 변경사항 복구
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      if (hasConnectedOnceRef.current) {
        console.log(
          "🔄 [GlobalSocketListener] 소켓 재연결 감지 - 전체 쿼리 무효화"
        );
        queryClient.invalidateQueries();
      }
      hasConnectedOnceRef.current = true;
    };

    if (socket.connected) {
      hasConnectedOnceRef.current = true;
    }

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    if (!socket) return;

    const onPrinterJobUpdated = (payload: any) => {
      const { status, errorMessage, requestedBy } = payload;

      // 본인이 요청한 출력만 토스트 표시 (다른 유저의 출력 이벤트 무시)
      if (requestedBy != null && currentUserId != null && Number(requestedBy) !== Number(currentUserId)) {
        return;
      }

      if (status === "SUCCESS") {
        success("인쇄가 완료되었습니다.");
      } else if (status === "FAILED") {
        error("인쇄에 실패했습니다.", <p>{errorMessage || "알 수 없는 오류가 발생했습니다."}</p>);
      }
    };

    socket.on("printer.job.updated", onPrinterJobUpdated);

    return () => {
      socket.off("printer.job.updated", onPrinterJobUpdated);
    };
  }, [socket, success, error, currentUserId]);

  return null;
}
