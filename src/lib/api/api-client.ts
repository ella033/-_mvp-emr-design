// api-client.ts
// -----------------------------
// api-proxy를 래핑하여, 비즈니스 코드에서 사용할 수 있는 제네릭 API 클라이언트 제공.
// ApiClient.get/post/put/delete 등 메서드로 HTTP 요청 수행.
// 에러를 ApiError로 래핑하여 일관된 에러 핸들링 제공.
// 타입 보장 및 공통 응답 타입(ApiResponse) 정의.
// -----------------------------

import {
  proxyDelete,
  proxyGet,
  proxyPost,
  proxyPut,
  proxyPatch,
} from "@/lib/api/api-proxy";

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Prisma Unique constraint 에러인지 확인하는 헬퍼 함수
function isUniqueConstraintError(error: any): boolean {
  const errorData = error?.data;

  if (!errorData?.error) {
    return false;
  }

  const errorName = errorData.error.name;
  const errorStack = errorData.error.stack || "";

  return (
    errorName === "PrismaClientKnownRequestError" &&
    errorStack.includes("Unique constraint failed on the fields: (`hospital_id`,`rrn_hash`)")
  );
}

// handleApiError: 재시도 로직 담당
export const handleApiError = async <T>(
  fn: (retryCount: number) => Promise<T>,
  retryCount: number = 0
): Promise<T> => {
  const MAX_RETRY_COUNT = 3;
  try {
    return await fn(retryCount);
  } catch (error: any) {
    // Unique constraint 에러는 재시도하지 않음
    if (isUniqueConstraintError(error)) {
      throw error;
    }

    if (
      (error.status >= 500 || error.status === 0) &&
      error.status !== 401 && error.status !== 403 &&
      retryCount < MAX_RETRY_COUNT
    ) {
      console.log(`재시도 중... (${retryCount + 1}/${MAX_RETRY_COUNT})`);
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return await handleApiError(fn, retryCount + 1);
    }

    // 403 Forbidden 에러 처리 (전역)
    if (error.status === 403 && typeof window !== "undefined") {
      // 메시지 체크가 필요한 경우 조건 추가 가능: e.g., error.message === "..."
      // 현재는 403 발생 시 일괄 리다이렉트 처리
      window.location.replace("/auth/forbidden");
      // 리다이렉트 후에도 에러를 throw 해야 호출부에서 실행 흐름이 끊기거나 처리할 수 있음.
      // 하지만 페이지 이동이므로 크게 중요치 않을 수 있음.
    }

    throw error;
  }
};

// 제네릭 API 클라이언트 (모든 메서드에 자동 재시도 적용)
export class ApiClient {
  static async get<T>(
    url: string,
    params?: Record<string, string>,
    options?: any
  ): Promise<T> {
    return await handleApiError((_) => proxyGet(url, params, options), 0);
  }

  static async post<T>(url: string, body: any, options?: any): Promise<T> {
    return await handleApiError((_) => proxyPost(url, body, options), 0);
  }

  static async put<T>(url: string, body: any): Promise<T> {
    return await handleApiError((_) => proxyPut(url, body), 0);
  }

  static async patch<T>(url: string, body?: any): Promise<T> {
    return await handleApiError((_) => proxyPatch(url, body), 0);
  }

  static async delete<T>(url: string, body?: any, options?: any): Promise<T> {
    return await handleApiError((_) => proxyDelete(url, body, options), 0);
  }
}
