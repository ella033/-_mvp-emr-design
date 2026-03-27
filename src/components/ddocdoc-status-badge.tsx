"use client";

import { useHospitalServiceEnabled } from "@/hooks/hospital/use-hospital-service-enabled";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api/api-proxy";
import { cn } from "@/lib/utils";

export function DdocdocStatusBadge() {
  const { data, error, isLoading } = useHospitalServiceEnabled("ddocdoc");

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <div className="bg-gray-300 rounded-full animate-pulse size-3" />
        <span>연동 확인 중...</span>
      </Badge>
    );
  }
  let statusText = "똑닥 연동 없음";
  let statusIcon = <AlertCircle className="size-3" />;
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" =
    "outline";
  let customClassName = "";

  // 에러가 있는 경우
  if (error) {
    // ApiError 인스턴스인지 확인하거나 status/statusCode 속성이 있는지 확인
    let errorStatus: number | undefined;

    if (error instanceof ApiError) {
      errorStatus = error.status;
    } else {
      // ApiError가 아닌 경우에도 status 또는 data.statusCode 확인
      const anyError = error as any;
      errorStatus =
        anyError?.status || anyError?.data?.statusCode || anyError?.statusCode;
    }

    // 404 에러인 경우: 연동 없음
    if (errorStatus === 404) {
      statusText = "똑닥 연동 없음";
      statusIcon = <AlertCircle className="size-3" />;
      badgeVariant = "outline";
    } else {
      // 다른 에러인 경우: 연동 실패
      statusText = "똑닥 연동 실패";
      statusIcon = <XCircle className="size-3 text-[var(--negative)]" />;
      badgeVariant = "secondary";
      customClassName = "hover:border-[var(--negative)]";
    }
  }
  // 데이터가 있는 경우
  if (data) {
    if (data.enabled === true) {
      statusText = "똑닥 연동 성공";
      statusIcon = (
        <CheckCircle2 className="size-3 text-[var(--positive-secondary)]" />
      );
      badgeVariant = "secondary";
      customClassName = "hover:border-[var(--positive-secondary)]";
    } else {
      statusText = "똑닥 연동 실패";
      statusIcon = <XCircle className="size-3 text-[var(--negative)]" />;
      badgeVariant = "secondary";
      customClassName = "hover:border-[var(--negative)]";
    }
  }

  return (
    <Badge variant={badgeVariant} className={cn("gap-1 py-1", customClassName)}>
      {statusIcon}
      <span>{statusText}</span>
    </Badge>
  );
}
