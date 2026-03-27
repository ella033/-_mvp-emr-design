"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";

// 공통 조건 패널 컴포넌트
interface ConditionPanelProps {
  conditionNumber: number;
  title: string;
  onRemoveAction: () => void;
  children: React.ReactNode;
}

export const ConditionPanel: React.FC<ConditionPanelProps> = ({
  conditionNumber,
  title,
  onRemoveAction,
  children,
}) => {
  return (
    <div className="w-full border border-[var(--border-2)] rounded-lg bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-t-lg bg-[var(--bg-1)]">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-white text-[var(--gray-100)] text-xs px-2 py-1 border border-[var(--border-1)] font-medium"
          >
            <span className="mt-[2px]">조건 {conditionNumber}</span>
          </Badge>
          <span className="text-sm font-medium text-[var(--gray-100)] translate-y-[0.5px]">
            {title}
          </span>
        </div>
        <div className="flex items-center">
          <Trash
            size={13}
            className="cursor-pointer"
            color="#222"
            onClick={onRemoveAction}
          />
        </div>
      </div>

      {/* 내용 */}
      <div className="p-4">{children}</div>
    </div>
  );
};
