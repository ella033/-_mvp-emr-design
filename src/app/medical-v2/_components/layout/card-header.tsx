"use client";

import React from "react";
import { useEditMode } from "./edit-mode-context";

interface CardHeaderProps {
  widgetId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 카드 모듈 헤더 — 클릭 시 해당 카드 선택, #9EC5FF 배경 + outline 적용
 */
export default function CardHeader({ widgetId, children, className = "" }: CardHeaderProps) {
  const { activeCardId, setActiveCardId } = useEditMode();
  const isActive = activeCardId === widgetId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardId(isActive ? null : widgetId);
  };

  return (
    <div
      className={`flex h-[32px] items-center px-[12px] shrink-0 cursor-pointer transition-colors ${isActive ? "bg-[#D6E6FF]" : "bg-[#E8ECF6]"} ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
