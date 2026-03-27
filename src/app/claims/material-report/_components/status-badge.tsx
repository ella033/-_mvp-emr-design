"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "sent" | "pending";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === "pending") {
    return <span className="text-[#989BA2]">-</span>;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[36px] bg-[#E9F6ED] text-[#2EA652] text-[12px] font-semibold leading-[1.25] -tracking-[0.01em] h-[20px] w-[48px]",
        className
      )}
    >
      <img src="/icon/ic_filled_check.svg" alt="" className="w-3.5 h-3.5" />
      <span>완료</span>
    </div>
  );
}
