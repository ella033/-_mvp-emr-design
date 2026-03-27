"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// 간편한 사용을 위한 래퍼 컴포넌트들
interface MyTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode | null;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  activateBaseClassName?: boolean;
  className?: string;
  delayDuration?: number;
}

export function MyTooltip({
  children,
  content,
  side = "top",
  align: _align = "center",
  activateBaseClassName = true,
  className,
  delayDuration = 0,
}: MyTooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasContent = content !== null && content !== undefined && content !== "";

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!hasContent) return;
    const x = e.clientX;
    const y = e.clientY;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPos({ x, y });
      setVisible(true);
    }, delayDuration);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasContent) return;
    if (visible) {
      setPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const GAP = 8;
  const tooltipStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = { position: "fixed", zIndex: 9999, pointerEvents: "none" };
    switch (side) {
      case "bottom": return { ...base, left: pos.x, top: pos.y + GAP, transform: "translateX(-50%)" };
      case "left": return { ...base, right: (typeof window !== "undefined" ? window.innerWidth : 0) - pos.x + GAP, top: pos.y, transform: "translateY(-50%)" };
      case "right": return { ...base, left: pos.x + GAP, top: pos.y, transform: "translateY(-50%)" };
      default: return { ...base, left: pos.x, top: pos.y - GAP, transform: "translate(-50%, -100%)" };
    }
  })();

  return (
    <>
      <span
        ref={wrapperRef}
        style={{ display: "contents" }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {hasContent && visible && typeof window !== "undefined" &&
        createPortal(
          <div
            style={tooltipStyle}
            className={cn(
              "z-[9999] overflow-hidden rounded-md border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]",
              activateBaseClassName
                ? "px-[8px] py-[4px] bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] border-[var(--tooltip-border)] text-[12px] max-w-[40vw]"
                : "",
              className
            )}
          >
            {content}
          </div>,
          wrapperRef.current?.ownerDocument?.body ?? document.body
        )
      }
    </>
  );
}
