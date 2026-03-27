// api-proxy.ts
// -----------------------------
// 백엔드 API로의 HTTP 요청을 프록시(Proxy)하는 로우레벨 유틸리티.
// fetch, 타임아웃, 에러 파싱, Content-Type별 응답 파싱,
// GET/POST/PUT/DELETE 등 편의 함수(proxyGet 등) 제공.
// 비즈니스 로직/에러 래핑 없이 순수 HTTP 통신만 담당.
// -----------------------------

import { config } from "@/lib/config";
import { TokenStorage } from "@/lib/token-storage";
import type { AuthRefreshResponse } from "@/types/auth-types";

// API 에러 타입
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 토큰 갱신 상태 관리
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const dispatchTokenExpiredEvent = () => {
  if (typeof window !== "undefined") {
    TokenStorage.clearAccessToken();
    window.dispatchEvent(new CustomEvent("auth:token-expired"));
    
    // 현재 경로에 따라 해당 로그인 페이지로 리다이렉트
    const currentPath = window.location.pathname;
    const isTabletPath = currentPath.includes("/tablet") || currentPath.includes("/auth/tablet");
    const isDidPath = currentPath.includes("/did") || currentPath.includes("/auth/did");
    const redirectPath = isTabletPath
      ? "/auth/tablet/sign-in?expired=true"
      : isDidPath
        ? "/auth/did/sign-in?expired=true"
        : "/auth/sign-in?expired=true";
    
    window.location.href = redirectPath;
  }
};

// 대기 중인 요청 처리
const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

async function refreshToken(): Promise<void> {
  // 이미 리프레시 요청 중인 상태이면 대기열에 추가
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  try {
    isRefreshing = true;

    // DID 경로인 경우 X-Client-Type 헤더 추가
    const refreshHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath.includes("/did") || currentPath.includes("/auth/did")) {
        refreshHeaders["X-Client-Type"] = "did";
      }
    }

    const response = await fetch(`${config.apiProxyPath}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: refreshHeaders,
      body: JSON.stringify({
        refreshToken: "string",
      }),
    });

    if (!response.ok) {
      throw new ApiError("토큰 갱신 실패", response.status);
    }

    const refreshData: AuthRefreshResponse = await response.json();

    // 갱신된 accessToken 저장
    if (refreshData.accessToken) {
      TokenStorage.setAccessToken(refreshData.accessToken);
      console.log("accessToken 갱신 완료");
    }

    // 성공하면 대기 중인 모든 요청 해제
    processQueue();
  } catch (error) {
    // 실패하면 대기 중인 모든 요청에 에러 전파
    processQueue(error as Error);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

interface ProxyOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string>;
  autoRefreshToken?: boolean;
}

export async function proxyApiResponse(
  apiUrl: string,
  options: ProxyOptions = {}
) {
  const {
    method = "GET",
    body,
    headers = {},
    timeout = 10000,
    params,
    autoRefreshToken = true,
  } = options;

  const apiBase = config.apiProxyPath;
  if (!apiBase) {
    throw new Error("API URL is not configured");
  }

  // params가 있으면 URL query string으로 추가
  let fullUrl = apiUrl;
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    const separator = apiUrl.includes("?") ? "&" : "?";
    fullUrl = `${apiUrl}${separator}${queryString}`;
  }

  const backendUrl = `${apiBase}${fullUrl}`;

  const callRequest = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const isBodyMethod = method !== "GET";
    const isFormData = body instanceof FormData;

    const finalHeaders: Record<string, string> = {
      ...headers,
      ...(isBodyMethod && body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
    };

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      // DID 경로인 경우 X-Client-Type 헤더 추가
      if (currentPath.includes("/did") || currentPath.includes("/auth/did")) {
        finalHeaders["X-Client-Type"] = "did";
      }
      // 접근 로그 집계용 현재 페이지 경로
      finalHeaders["X-Page-Path"] = currentPath;
    }

    const fetchOptions: RequestInit = {
      method,
      credentials: "include", // httpOnly쿠키 포함
      headers: finalHeaders,
      signal: controller.signal,
      next: { revalidate: 0 },
    };

    if (isBodyMethod && body) {
      if (isFormData) {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    const res = await fetch(backendUrl, fetchOptions);
    clearTimeout(timeoutId);
    return res;
  };

  try {
    let res = await callRequest();

    // Unauthorized 반환 시 리프레시 토큰 요청
    if (res.status === 401 && autoRefreshToken) {
      const isRefreshRequest = apiUrl.includes("/auth/refresh");

      if (!isRefreshRequest) {
        try {
          await refreshToken();

          // 토큰 갱신 성공 후 기존 요청 재 호출
          res = await callRequest();

          if (!res.ok && res.status === 401) {
            throw new ApiError(
              "Authentication failed after token refresh",
              401
            );
          }
        } catch (refreshError) {
          dispatchTokenExpiredEvent();
          throw new ApiError("Token expired", 401);
        }
      } else {
        dispatchTokenExpiredEvent();
        throw new ApiError("Token expired", 401);
      }
    }

    // 성공 응답만 반환, 에러는 throw
    if (res.ok) {
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        return await res.json();
      }

      if (contentType?.includes("text/")) {
        return await res.text();
      }

      return res.body;
    }

    // 다른 에러 응답 처리
    const contentType = res.headers.get("content-type");
    let errorMessage = res.statusText;
    let errorData: any = null;

    try {
      if (contentType?.includes("application/json")) {
        errorData = await res.json();
        errorMessage = errorData.message || errorData.error || res.statusText;
      } else {
        errorMessage = await res.text();
      }
    } catch (parseError) {
      console.warn("Failed to parse error response:", parseError);
    }

    // 에러를 throw하여 상위에서 처리하도록 함
    throw new ApiError(
      errorMessage,
      res.status,
      errorData?.errorCode,
      errorData
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }

      // 이미 status가 있는 에러는 그대로 전달
      if (error instanceof ApiError) {
        throw error;
      }
    }

    // 네트워크 오류
    throw new ApiError("Service unavailable", 503);
  }
}

// 편의 함수들
export const proxyGet = (
  apiUrl: string,
  params?: Record<string, string>,
  options?: Omit<ProxyOptions, "method">
) => proxyApiResponse(apiUrl, { ...options, method: "GET", params });

export const proxyPost = (
  apiUrl: string,
  body: any,
  options?: Omit<ProxyOptions, "method" | "body">
) => proxyApiResponse(apiUrl, { ...options, method: "POST", body });

export const proxyPut = (
  apiUrl: string,
  body: any,
  options?: Omit<ProxyOptions, "method" | "body">
) => proxyApiResponse(apiUrl, { ...options, method: "PUT", body });

export const proxyDelete = (
  apiUrl: string,
  body?: any,
  options?: Omit<ProxyOptions, "method" | "body">
) => proxyApiResponse(apiUrl, { ...options, method: "DELETE", body });

export const proxyPatch = (
  apiUrl: string,
  body?: any,
  options?: Omit<ProxyOptions, "method" | "body">
) => proxyApiResponse(apiUrl, { ...options, method: "PATCH", body });
