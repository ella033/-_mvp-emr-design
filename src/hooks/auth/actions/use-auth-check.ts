import { useEffect, useRef } from "react";
import { AuthService } from "@/services/auth-service";
import { TokenStorage } from "@/lib/token-storage";

const ACTIVITY_WINDOW_MS = 55 * 60 * 1000; // 55분 이내 활동 시 "활동 중"으로 간주 (1시간 비활동 로그아웃 정책)
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 세션 ping
const THROTTLE_MS = 30_000; // 활동 이벤트 30초 쓰로틀

export function useAuthCheck() {
  const lastActivityRef = useRef(Date.now());

  // 1. DOM 이벤트로 유저 활동 추적 (throttled)
  useEffect(() => {
    let throttled = false;
    const handler = () => {
      if (throttled) return;
      throttled = true;
      lastActivityRef.current = Date.now();
      setTimeout(() => {
        throttled = false;
      }, THROTTLE_MS);
    };
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((e) =>
      window.addEventListener(e, handler, { passive: true })
    );
    return () =>
      events.forEach((e) => window.removeEventListener(e, handler));
  }, []);

  // 2. 주기적 체크: 활동 중이면 sessionPing 호출
  //    - 서버가 토큰 만료 임박 시 새 토큰을 반환하면 저장
  //    - 401 발생 시 api-proxy가 쿠키로 refresh 후 재시도
  useEffect(() => {
    const check = async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime > ACTIVITY_WINDOW_MS) return; // 비활동 → 호출 안 함

      try {
        const result = await AuthService.sessionPing();
        // 서버가 선제적으로 토큰을 갱신한 경우 새 accessToken 저장
        if (result?.refreshed && result?.accessToken) {
          TokenStorage.setAccessToken(result.accessToken);
        }
      } catch (error) {
        // 네트워크/타임아웃 등은 경고만. 인증 실패(401)는 api-proxy에서 이미 refresh 또는 리다이렉트 처리됨
        console.warn("세션 ping 실패:", error);
      }
    };

    check(); // 초기 1회
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
