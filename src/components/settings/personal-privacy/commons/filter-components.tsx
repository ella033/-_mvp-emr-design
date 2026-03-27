"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * 필터 전체를 감싸는 컨테이너
 */
export function FilterContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 bg-white", className)}>
      {children}
    </div>
  );
}

/**
 * 필터 항목들을 한 줄로 배치하는 행 컨테이너
 */
export function FilterRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-8", className)}>
      {children}
    </div>
  );
}

/**
 * 라벨과 입력 요소를 묶는 단위 컨테이너
 */
export function FilterItem({
  children,
  className,
  width,
}: {
  children: React.ReactNode;
  className?: string;
  width?: string;
}) {
  return (
    <div 
      className={cn("flex items-center gap-2", className)}
      style={width ? { width } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * 일관된 폰트와 스타일을 가진 라벨 컴포넌트
 */
export function FilterLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "text-[#292A2D] text-center text-[12px] font-bold leading-[1.25] tracking-[-0.12px] min-w-fit",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * 필터 항목 옆의 부가 설명을 위한 컴포넌트
 */
export function FilterDescription({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "warning" | "info";
}) {
  const variantStyles = {
    default: "text-[#292A2D] text-[12px]",
    warning: "text-blue-500 text-[11px]",
    info: "text-slate-500 text-[11px]",
  };

  return (
    <span className={cn(
      "text-center leading-[1.25] tracking-[-0.12px] ml-2",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
