import { useCallback } from "react";
import { useLogout } from "@/hooks/auth/use-logout";
import { useUserStore } from "@/store/user-store";
import { useRouter } from "next/navigation";
import type { AuthUserType } from "@/types/auth-types";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import { TokenStorage } from "./token-storage";
import { useQueryClient } from "@tanstack/react-query";

export function useHandleLogout() {
  const { mutateAsync: logout } = useLogout();
  const { setUser } = useUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    try {
      await logout();
    } catch (error) {
      console.error("[auth-utils] 로그아웃 에러:", error);
    } finally {
      // 에러 발생 여부와 관계없이 클라이언트 상태 초기화
      setUser({} as AuthUserType);
      
      // 현재 경로가 태블릿 경로면 태블릿 관련 데이터만 삭제, 아니면 전체 삭제
      const currentPath = window.location.pathname;
      const isTabletPath = currentPath.includes("/tablet") || currentPath.includes("/auth/tablet");
      
      if (isTabletPath) {
        // 태블릿 로그아웃: 태블릿 관련 데이터만 삭제
        safeLocalStorage.removeItem("user_tablet");
        TokenStorage.clearAccessToken(); // 소켓용 토큰 제거
        queryClient.clear(); // 모든 쿼리 캐시 초기화
      } else {
        // 일반 로그아웃: 전체 삭제
        safeLocalStorage.clear();
        TokenStorage.clearAccessToken(); // 소켓용 토큰 제거
        queryClient.clear(); // 모든 쿼리 캐시 초기화 (병원 변경 시 데이터 혼크 방지)
      }
      
      // 현재 경로가 태블릿 로그인 페이지면 같은 경로로 리다이렉트
      const redirectPath = isTabletPath
        ? "/auth/tablet/sign-in"
        : "/auth/sign-in";
      
      router.push(redirectPath);
    }
  }, [logout, setUser, router, queryClient]);
}
