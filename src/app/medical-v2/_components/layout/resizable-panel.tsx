"use client";

import React from "react";

interface ResizablePanelProps {
  children: React.ReactNode;
  widgetId?: string;
  defaultWidth: number;
  widthPx?: number;
  className?: string;
}

/**
 * 패널 래퍼 — 너비는 부모(SplitLayout)가 제어
 * 개별 리사이즈 핸들 없음 (스플리터가 담당)
 */
export default function ResizablePanel({
  children,
  widgetId,
  defaultWidth,
  widthPx,
  className = "",
}: ResizablePanelProps) {
  const style: React.CSSProperties = widthPx != null
    ? { width: widthPx, flexShrink: 0, flexGrow: 0, height: "100%" }
    : { flex: `${defaultWidth} 1 0%`, minWidth: 0, height: "100%" };

  return (
    <div className={`relative flex flex-col min-h-0 ${className}`} style={style}>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
