// 이 파일은 React Query의 QueryClientProvider를 래핑하여
// 앱 전체에서 React Query의 전역 상태 관리 및 캐싱 기능을 사용할 수 있도록 하는
// ReactQueryProvider 컴포넌트를 정의합니다.

"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 윈도우 포커스 시 자동 재요청 비활성화
            refetchOnWindowFocus: false,
            // 네트워크 재연결 시 자동 재요청 비활성화
            refetchOnReconnect: false,
            // 컴포넌트 마운트 시 자동 재요청 제한
            refetchOnMount: false,
            // 재시도 횟수 제한
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
