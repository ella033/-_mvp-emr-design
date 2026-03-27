// CustomThemeProvider는 next-themes의 ThemeProvider를 환경에 따라 다르게 적용합니다.
// - 운영(Production) 환경: SSR 지원 StaticProvider를 사용해 퍼포먼스와 SEO를 챙깁니다.
// - 개발(Development) 환경: 동적 import(DynProvider, ssr: false)로 클라이언트에서만 렌더링하여 hydration 에러를 방지합니다.
// 이렇게 하면 개발 중에는 SSR/CSR 불일치로 인한 에러를 줄이고, 운영에서는 최적화된 SSR을 활용할 수 있습니다.

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeProvider as StaticProvider } from "next-themes";

const DynProvider = dynamic(
  () => import("next-themes").then((e) => e.ThemeProvider),
  { ssr: false }
);

export function CustomThemeProvider({
  children,
  ...props
}: React.PropsWithChildren<any>) {
  const NextThemeProvider =
    process.env.NODE_ENV === "production" ? StaticProvider : DynProvider;
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
