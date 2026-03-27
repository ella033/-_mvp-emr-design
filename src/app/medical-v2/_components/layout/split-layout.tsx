"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface SplitLayoutProps {
  children: React.ReactNode[];
  /** 각 패널의 초기 flex 비율 (예: [14, 20, 28, 18, 20]) */
  defaultRatios: number[];
  /** 각 패널 최소 너비(px) */
  minWidths?: number[];
  gap?: number;
}

/**
 * 스플리터 기반 수평 분할 레이아웃
 * - 카드 사이 경계를 드래그하면 양쪽 카드가 동시에 리사이즈
 * - 전체 너비를 항상 유지하여 겹침/빈공간 없음
 */
export default function SplitLayout({
  children,
  defaultRatios,
  minWidths,
  gap = 6,
}: SplitLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<number[] | null>(null);
  const childArray = React.Children.toArray(children);
  const count = childArray.length;
  const mins = minWidths || childArray.map(() => 160);

  /* 컨테이너 크기 변경 시 초기 비율로 너비 계산 */
  useEffect(() => {
    function calc() {
      if (!containerRef.current) return;
      const totalW = containerRef.current.offsetWidth - gap * (count - 1);
      const ratioSum = defaultRatios.reduce((a, b) => a + b, 0);
      const newWidths = defaultRatios.map((r) => Math.round((r / ratioSum) * totalW));
      // 반올림 오차 보정
      const diff = totalW - newWidths.reduce((a, b) => a + b, 0);
      if (newWidths.length > 0) newWidths[newWidths.length - 1] += diff;
      setWidths(newWidths);
    }

    calc();
    const observer = new ResizeObserver(calc);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, gap]);

  /* 스플리터 드래그 */
  const onSplitterMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      if (!widths) return;

      const startX = e.clientX;
      const leftW = widths[index];
      const rightW = widths[index + 1];

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newLeft = Math.max(mins[index], leftW + delta);
        const newRight = Math.max(mins[index + 1], rightW - delta);

        // 양쪽 모두 최소 너비를 만족하는지 확인
        const actualDelta = newLeft - leftW;
        if (rightW - actualDelta < mins[index + 1]) return;

        setWidths((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          next[index] = newLeft;
          next[index + 1] = newRight;
          return next;
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [widths, mins]
  );

  return (
    <div ref={containerRef} className="flex w-full h-full min-h-0">
      {childArray.map((child, i) => (
        <React.Fragment key={i}>
          {/* 패널 — 스플리터가 gap 역할을 하므로 gap 없음 */}
          <div
            className="flex flex-col min-h-0 h-full overflow-hidden"
            style={
              widths
                ? { width: widths[i], flexShrink: 0, flexGrow: 0 }
                : { flex: `${defaultRatios[i]} 1 0%`, minWidth: 0 }
            }
          >
            {child}
          </div>

          {/* 스플리터: 6px (3px 여백 + 라인 + 3px 여백) */}
          {i < count - 1 && (
            <div
              className="relative flex items-center justify-center shrink-0 cursor-col-resize group"
              style={{ width: gap }}
              onMouseDown={(e) => onSplitterMouseDown(i, e)}
            >
              <div className="absolute inset-y-0 w-[2px] bg-transparent group-hover:bg-[#453EDC] group-active:bg-[#453EDC] opacity-0 group-hover:opacity-40 group-active:opacity-60 transition-all rounded-full" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
