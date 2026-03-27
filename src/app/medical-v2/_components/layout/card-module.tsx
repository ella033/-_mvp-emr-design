"use client";

import React from "react";
import { useEditMode } from "./edit-mode-context";

interface CardModuleProps {
  widgetId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 카드 모듈 래퍼
 * - 기본: border 1px #C2C4C8, rounded-[6px]
 * - 선택 시: border 2px #9EC5FF, rounded-[6px]
 *
 * 사용할 때 className에 border/rounded 관련 클래스를 넣지 말 것 — 여기서 관리
 */
export default function CardModule({ widgetId, children, className = "" }: CardModuleProps) {
  const { activeCardId } = useEditMode();
  const isActive = activeCardId === widgetId;

  // className에서 border/rounded 관련을 제거하고 CardModule이 직접 관리
  const cleanClass = className
    .replace(/border-\[[^\]]+\]/g, "")
    .replace(/border\b/g, "")
    .replace(/rounded-\[[^\]]+\]/g, "")
    .trim();

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[6px] ${cleanClass}`}
      style={{
        border: isActive ? "2px solid #9EC5FF" : "1px solid #C2C4C8",
      }}
    >
      {children}
    </div>
  );
}
