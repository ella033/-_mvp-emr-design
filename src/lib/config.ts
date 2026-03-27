// 환경별 설정 관리
export const config = {
  // 개발 환경에서는 NEXT_PUBLIC_ 환경변수 사용
  // 프로덕션에서는 런타임 환경변수 사용
  apiProxyPath: "/api",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "",
};

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";
