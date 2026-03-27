/**
 * 토큰 저장소 관리
 *
 * sessionStorage와 메모리 캐시를 조합하여 사용
 * - sessionStorage: 탭별 독립 세션 (다른 탭과 공유되지 않음)
 * - 메모리 캐시: 빠른 접근
 *
 * ⚠️ 보안:
 * - accessToken만 저장 (짧은 수명)
 * - refreshToken은 httpOnly 쿠키로만 관리 (클라이언트 접근 불가)
 * - XSS 공격에 취약하지만, 별도 소켓 서버 인증을 위해 불가피
 *
 * ⚠️ 세션 정책:
 * - 각 탭은 독립적인 로그인 세션을 가짐
 * - 한 탭의 로그아웃이 다른 탭에 영향을 주지 않음
 */

const TOKEN_KEY = 'socket_access_token';

// 메모리 캐시 (빠른 접근용)
let memoryToken: string | null = null;

// localStorage → sessionStorage 마이그레이션 (한 번만 실행)
if (typeof window !== 'undefined') {
  try {
    const oldToken = localStorage.getItem(TOKEN_KEY);
    if (oldToken && !sessionStorage.getItem(TOKEN_KEY)) {
      console.log('[TokenStorage] localStorage → sessionStorage 마이그레이션');
      sessionStorage.setItem(TOKEN_KEY, oldToken);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    // 무시
  }
}

export const TokenStorage = {
  /**
   * accessToken 저장
   */
  setAccessToken(token: string): void {
    try {
      memoryToken = token;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('[TokenStorage] 토큰 저장 실패:', error);
    }
  },

  /**
   * accessToken 조회
   */
  getAccessToken(): string | null {
    // 1. 메모리 캐시에서 먼저 확인
    if (memoryToken) {
      return memoryToken;
    }

    // 2. sessionStorage에서 복원
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        if (token) {
          memoryToken = token; // 메모리 캐시 갱신
          return token;
        }
      }
    } catch (error) {
      console.error('[TokenStorage] 토큰 조회 실패:', error);
    }

    return null;
  },

  /**
   * 토큰 제거 (로그아웃 시)
   */
  clearAccessToken(): void {
    try {
      memoryToken = null;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('[TokenStorage] 토큰 제거 실패:', error);
    }
  },

  /**
   * 토큰 존재 여부 확인
   */
  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  },
};
