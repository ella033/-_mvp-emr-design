"use client";
import { usePathname } from "next/navigation";
import InitialDataFetcher from "@/components/fetcher/initial-data-fetcher";

export default function InitialDataFetcherWrapper() {
  const pathname = usePathname();
  // 모든 auth 경로에서 InitialDataFetcher 비활성화
  if (pathname.startsWith("/auth/")) return null;
  return <InitialDataFetcher />;
}
