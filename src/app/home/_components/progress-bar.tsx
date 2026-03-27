"use client";

import React from "react";

export default function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="rounded-[10px] bg-white border border-[#E9ECEF] px-[20px] py-[14px] mb-[4px]">
      <div className="flex items-center justify-between mb-[8px]">
        <span className="text-[13px] font-semibold text-[#495057]">오늘 진료 진행률</span>
        <span className="text-[13px] font-bold text-[#6541F2]">{completed} / {total}명 ({pct}%)</span>
      </div>
      <div className="h-[6px] rounded-[3px] bg-[#F1F3F5] overflow-hidden">
        <div
          className="h-full rounded-[3px] bg-[#6541F2] transition-all duration-[600ms] ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
