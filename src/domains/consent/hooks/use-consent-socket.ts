import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useHospitalStore } from "@/store/hospital-store";
import type { ConsentRequest, ConsentData } from "../types";

interface UseConsentSocketProps {
  onConsentRequest?: (
    data: Omit<ConsentRequest, "id" | "requestedAt" | "status">
  ) => void;
  onConsentCompleted?: (data: ConsentData) => void;
  //db.* 이벤트 중 `patient_consents` 테이블 변경을 감지했을 때 호출된다.
  onPatientConsentsTableChanged?: (payload: any, eventName: string) => void;
}

export function useConsentSocket({
  onConsentRequest,
  onConsentCompleted,
  onPatientConsentsTableChanged,
}: UseConsentSocketProps) {
  const { socket } = useSocket();
  const { hospital } = useHospitalStore();

  useEffect(() => {
    if (!socket) return;

    // 동의서 요청 수신
    if (onConsentRequest) {
      socket.on("consent.request", onConsentRequest);
    }

    // 동의서 완료 수신
    if (onConsentCompleted) {
      socket.on("consent.completed", onConsentCompleted);
    }

    // db.* 이벤트에서 patient_consents 변경 수신 (onAny)
    const handleAnyMessage = async (eventName: string, ...args: any[]) => {
      if (!onPatientConsentsTableChanged) return;
      const payload = args?.[0];
      const isDbEvent =
        typeof eventName === "string" && eventName.startsWith("db.");
      if (!isDbEvent) return;

      const table = payload?.table;
      if (table !== "patient_consents") return;

      // 병원 컨텍스트가 있으면 같은 병원 이벤트만 반영
      if (hospital?.id) {
        const evtHospitalId =
          payload?.hospitalId ??
          payload?.data?.hospitalId ??
          payload?.data?.hospital_id ??
          payload?.hospital?.id ??
          payload?.new?.hospitalId ??
          payload?.record?.hospitalId;

        if (evtHospitalId && Number(evtHospitalId) !== Number(hospital.id)) {
          return;
        }
      }

      onPatientConsentsTableChanged(payload, eventName);
    };

    const handleConnect = () => {
      if (!onPatientConsentsTableChanged) return;
      socket.onAny(handleAnyMessage);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    return () => {
      if (onConsentRequest) {
        socket.off("consent.request", onConsentRequest);
      }
      if (onConsentCompleted) {
        socket.off("consent.completed", onConsentCompleted);
      }

      socket.off("connect", handleConnect);
      if (socket.connected) {
        socket.offAny(handleAnyMessage);
      }
    };
  }, [
    socket,
    hospital?.id,
    onConsentRequest,
    onConsentCompleted,
    onPatientConsentsTableChanged,
  ]);

  // 동의서 요청 전송
  const sendConsentRequest = (
    data: Omit<ConsentRequest, "id" | "requestedAt" | "status">
  ) => {
    if (socket) {
      socket.emit("consent.request", data);
    }
  };

  // 동의서 완료 전송
  const sendConsentCompleted = (data: ConsentData) => {
    if (socket) {
      socket.emit("consent.completed", data);
    }
  };

  return {
    sendConsentRequest,
    sendConsentCompleted,
    isConnected: socket?.connected || false,
  };
}