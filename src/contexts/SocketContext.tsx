"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { AgentBinding } from "@/lib/agent/agent-binding";
import { AgentClient } from "@/lib/agent/agent-client";
import { useUserStore } from "@/store/user-store";
import { TokenStorage } from "@/lib/token-storage";
import { AuthService } from "@/services/auth-service";

// 타입 정의
export type SocketContextType = Socket | null;

type SocketContextValue = {
  socket: Socket | null;
  /** 로컬 PC 에이전트 (loopback 체크 결과) */
  localAgentStatus: "online" | "offline" | null;
  /** 병원 내 1개 이상 에이전트 연결 여부 */
  hospitalAgentOnline: boolean;
  /** 연결된 에이전트 ID 목록 */
  connectedAgentIds: Set<string>;
  /** 내 PC 에이전트 ID (바인딩된) */
  currentAgentId: string | null;
  /** @deprecated hospitalAgentOnline 사용 권장 */
  agentPresenceStatus: "online" | "offline" | null;
};

export const SocketContext = createContext<SocketContextValue | null>(null);

// Reserved for future use (kept to avoid re-adding when needed)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchJson(_url: string, _init?: RequestInit) {
  const res = await fetch(_url, _init);
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json()
    : await res.text();
  return { res, data };
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // 내부에서 로그인 상태 확인
  const { user } = useUserStore();
  const isLoggedIn = !!user && Object.keys(user).length > 0;
  const [socket, setSocket] = useState<SocketContextType>(null);
  const [localAgentStatus, setLocalAgentStatus] = useState<
    "online" | "offline" | null
  >(null);
  const [hospitalAgentOnline, setHospitalAgentOnline] = useState(false);
  const [connectedAgentIds, setConnectedAgentIds] = useState<Set<string>>(new Set());
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const orgIdRef = useRef<string | null>(null);
  const reconnectErrorCountRef = useRef<number>(0);
  const lastVisibleAtRef = useRef<number>(0);
  /** 마지막으로 소켓 이벤트를 받은 시각 (건강 체크용) */
  const lastPacketAtRef = useRef<number>(Date.now());

  // 탭 포커스 복귀 시 웹소켓 재연결 및 동기화 이벤트
  // (백그라운드 탭에서 브라우저가 소켓을 끊거나 지연시켜 밀린 메시지가 제대로 오지 않는 문제 완화)
  const wasVisibleRef = useRef(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      if (!isVisible) {
        wasVisibleRef.current = false;
        return;
      }
      // hidden → visible 전환일 때만 재연결·이벤트 발생 (중복 방지)
      if (wasVisibleRef.current) return;
      wasVisibleRef.current = true;

      const now = Date.now();
      if (now - lastVisibleAtRef.current < 2000) return;
      lastVisibleAtRef.current = now;

      const sock = socketRef.current;
      if (sock) {
        sock.disconnect();
        sock.connect();
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:visibility-visible"));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 건강 체크: 60초 이상 이벤트 없으면 조용히 죽은 연결로 간주하고 재연결
  useEffect(() => {
    const interval = setInterval(() => {
      const sock = socketRef.current;
      if (!sock) return;

      const now = Date.now();
      const diff = now - lastPacketAtRef.current;

      if (diff > 60000) {
        console.warn("⚠️ [SocketContext] Socket stale detected. Reconnecting...");
        sock.disconnect();
        sock.connect();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // initialize agent binding helper with a socket getter
  useEffect(() => {
    AgentBinding.init(
      () => socketRef.current,
      () => {
        // binding 변경 시 저장값을 즉시 반영해 UI 갱신
        syncPresenceFromStorage();
      }
    );
    AgentClient.init(() => socketRef.current);
  }, []);

  function syncPresenceFromStorage() {
    const orgId =
      orgIdRef.current != null ? Number(orgIdRef.current) : null;
    const { agentId } = AgentBinding.getBinding(orgId);
    setCurrentAgentId(agentId);
  }

  useEffect(() => {
    if (isLoggedIn && !socket) {
      // 저장된 accessToken 가져오기
      const accessToken = TokenStorage.getAccessToken();

      // 서버 URL이 프로토콜 없이 제공되면 현재 페이지 프로토콜에 맞춰 설정
      let socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL!;
      if (
        socketUrl &&
        !socketUrl.startsWith("http://") &&
        !socketUrl.startsWith("https://") &&
        !socketUrl.startsWith("ws://") &&
        !socketUrl.startsWith("wss://")
      ) {
        // 현재 페이지가 HTTPS면 HTTPS, HTTP면 HTTP 사용 (Socket.IO가 자동으로 WSS/WS 변환)
        const protocol =
          window.location.protocol === "https:" ? "https://" : "http://";
        socketUrl = `${protocol}${socketUrl}`;
      }

      const newSocket = io(socketUrl, {
        transports: ["websocket", "polling"], // websocket 실패 시 polling으로 폴백
        withCredentials: true, // httpOnly 쿠키도 전송 (fallback)
        auth: {
          token: accessToken, // ⭐ 저장된 토큰으로 인증
        },
        extraHeaders: accessToken
          ? {
            Authorization: `Bearer ${accessToken}`, // 추가 헤더로도 전송
          }
          : {},
        // 재연결 옵션
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      // 건강 체크: 어떤 이벤트든 수신 시 마지막 수신 시각 갱신
      newSocket.onAny(() => {
        lastPacketAtRef.current = Date.now();
      });

      // Socket 연결 완료
      newSocket.on("connect", async () => {
        console.log("✅ [SocketContext] Socket 연결 완료", {
          socketId: newSocket.id,
          serverUrl: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL,
          connected: newSocket.connected,
          timestamp: new Date().toISOString(),
        });

        // Agent에 병원 정보 전달
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const orgId = user.hospitalId;

            if (orgId) {
              orgIdRef.current = String(orgId);
              const fromStorage = AgentBinding.getBinding(orgId);
              setCurrentAgentId(fromStorage.agentId);
              setLocalAgentStatus(null);
              console.log("[SocketContext] Agent에 병원 정보 전달:", orgId);
              const ok = await AgentBinding.performSetHospital(orgId);
              setLocalAgentStatus(ok ? "online" : "offline");
              if (!ok) AgentBinding.start(orgId);
            }
          } catch (e) {
            console.log("[SocketContext] 사용자 정보 파싱 실패:", e);
          }
        }
      });

      // Socket 연결 해제
      newSocket.on("disconnect", async (reason) => {
        console.log("❌ [SocketContext] Socket 연결 해제", {
          reason,
          socketId: newSocket.id,
          timestamp: new Date().toISOString(),
        });
        if (orgIdRef.current) {
          AgentBinding.updateStatus(orgIdRef.current, "offline");
        }
        syncPresenceFromStorage();

        // 서버 강제 disconnect 시 토큰 갱신 후 재연결
        // Socket.IO는 "io server disconnect"일 때 자동 재연결하지 않으므로 수동 처리 필요
        if (reason === "io server disconnect") {
          reconnectErrorCountRef.current += 1;
          if (reconnectErrorCountRef.current > 3) {
            console.error(
              "[SocketContext] 서버 강제 disconnect 3회 초과 - 재연결 중단"
            );
            return;
          }
          try {
            console.log(
              `🔄 [SocketContext] 토큰 갱신 후 재연결 시도 (${reconnectErrorCountRef.current}/3)`
            );
            const response = await AuthService.refreshToken();
            if (response.accessToken) {
              newSocket.auth = { token: response.accessToken };
              newSocket.connect();
            }
          } catch (error) {
            console.error("[SocketContext] 토큰 갱신 실패 - 재연결 불가:", error);
          }
          return;
        }

        // 연결 해제되면 에이전트가 뒤늦게 살아날 수 있으므로 재시도 시작
        if (orgIdRef.current) {
          const orgIdNum =
            typeof orgIdRef.current === "string"
              ? Number(orgIdRef.current)
              : orgIdRef.current;
          if (!isNaN(orgIdNum)) {
            AgentBinding.start(orgIdNum);
          }
        }
      });

      // Socket 에러 처리
      newSocket.on("error", (error: any) => {
        console.error("[SocketContext] 서버 에러:", JSON.stringify(error));
        // 에러 시에도 저장 상태를 우선으로 동기화
        syncPresenceFromStorage();
      });

      // Socket 연결 에러 처리
      newSocket.on("connect_error", () => {
        reconnectErrorCountRef.current += 1;
        // 재연결은 자동으로 시도됨
      });

      // 재연결 성공 이벤트
      newSocket.on("reconnect", () => {
        reconnectErrorCountRef.current = 0; // 재연결 성공 시 카운터 리셋
      });

      // Agent Presence 이벤트 구독 (서버: agentIds + status)
      newSocket.on(
        "agent.presence",
        (payload: {
          agentIds?: string[];
          agentId?: string;
          status: "online" | "offline";
        }) => {
          const agentIds = payload.agentIds ?? (payload.agentId ? [payload.agentId] : []);
          const status = payload.status;
          console.log("[SocketContext] Agent Presence:", { agentIds, status });
          setConnectedAgentIds(new Set(agentIds));
          setHospitalAgentOnline(status === "online");
          const orgId =
            orgIdRef.current != null ? Number(orgIdRef.current) : null;
          if (orgId != null) {
            const binding = AgentBinding.getBinding(orgId);
            if (binding.agentId) {
              const boundOnline = agentIds.includes(binding.agentId);
              AgentBinding.setBinding(
                orgId,
                binding.agentId,
                boundOnline ? "online" : "offline"
              );
            }
            setCurrentAgentId(AgentBinding.getBinding(orgId).agentId);
          }
          if (status === "online") {
            AgentBinding.stop();
          } else if (orgIdRef.current) {
            const orgIdNum =
              typeof orgIdRef.current === "string"
                ? Number(orgIdRef.current)
                : orgIdRef.current;
            if (!isNaN(orgIdNum)) {
              AgentBinding.start(orgIdNum);
            }
          }
        }
      );

      setSocket(newSocket);
      socketRef.current = newSocket;

      return () => {
        newSocket.disconnect();
        setSocket(null);
        socketRef.current = null;
        AgentBinding.stop();
      };
    }

    if (!isLoggedIn && socket) {
      socket.disconnect();
      setSocket(null);
      socketRef.current = null;
      // 로그아웃 시 presence는 저장값 기준으로 갱신 (orgId별 정책은 상위에서 처리)
      syncPresenceFromStorage();
    }

    return undefined;
    // eslint-disable-next-line
  }, [isLoggedIn]);

  // 에이전트 바인딩 변경 동기화 (다른 탭에서 변경)
  // 참고: 토큰은 sessionStorage(탭별 독립)로 관리되므로 크로스탭 로그아웃 동기화는 불필요
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key &&
        orgIdRef.current &&
        e.key === `agent.binding.${orgIdRef.current}`
      ) {
        syncPresenceFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const agentPresenceStatus: "online" | "offline" | null = hospitalAgentOnline
    ? "online"
    : "offline";

  const value = {
    socket,
    localAgentStatus,
    hospitalAgentOnline,
    connectedAgentIds,
    currentAgentId,
    agentPresenceStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}

// Agent Presence 상태를 사용하는 훅
export function useAgentPresence(targetAgentId?: string) {
  const { agentPresenceStatus, currentAgentId } = useSocket();

  // targetAgentId가 지정되어 있으면 해당 agent만 확인
  if (targetAgentId && currentAgentId !== targetAgentId) {
    return {
      agentPresenceStatus: null,
      currentAgentId,
      badgeColor: null,
      isOnline: false,
      isOffline: false,
    };
  }

  const badgeColor =
    agentPresenceStatus === "online"
      ? ("green" as const)
      : agentPresenceStatus === "offline"
        ? ("red" as const)
        : null;

  return {
    agentPresenceStatus,
    currentAgentId,
    badgeColor,
    isOnline: agentPresenceStatus === "online",
    isOffline: agentPresenceStatus === "offline",
  };
}
