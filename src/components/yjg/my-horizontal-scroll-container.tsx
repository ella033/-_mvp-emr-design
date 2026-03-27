"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyHorizontalScrollContainerProps {
  /** 스크롤할 children */
  children: React.ReactNode;
  /** 컨테이너 className */
  className?: string;
  /** 스크롤 컨테이너 className */
  scrollClassName?: string;
  /** 스크롤 버튼 className */
  buttonClassName?: string;
  /** 스크롤 버튼 아이콘 크기 className */
  iconClassName?: string;
  /** 한 번에 스크롤할 양 (px) */
  scrollAmount?: number;
  /** 스크롤 버튼 표시 여부 (기본: true) */
  showButtons?: boolean;
  /** 스크롤 버튼 숨기기 조건 (스크롤 불필요 시 완전히 숨김) */
  hideButtonsWhenNoScroll?: boolean;
  /** children 사이 gap */
  gap?: number;
}

export default function MyHorizontalScrollContainer({
  children,
  className,
  scrollClassName,
  buttonClassName,
  iconClassName = "w-[14px] h-[14px]",
  scrollAmount = 150,
  showButtons = true,
  hideButtonsWhenNoScroll = false,
  gap = 2,
}: MyHorizontalScrollContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);

  // 스크롤 상태 업데이트
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    setNeedsScroll(hasOverflow);
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  // 스크롤 버튼 클릭 핸들러
  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    },
    [scrollAmount]
  );

  // 스크롤 상태 감지
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, children]);

  const shouldShowButtons =
    showButtons && (needsScroll || !hideButtonsWhenNoScroll);

  return (
    <div className={cn("flex flex-row items-center gap-1", className)}>
      {/* 왼쪽 스크롤 버튼 */}
      {shouldShowButtons && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className={cn(
            "shrink-0 p-[2px] rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
            !canScrollLeft && "opacity-30 pointer-events-none",
            buttonClassName
          )}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className={iconClassName} />
        </button>
      )}

      {/* 스크롤 가능한 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex flex-row w-full overflow-x-auto scrollbar-hide px-[1px]",
          scrollClassName
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          gap: `${gap}px`,
        }}
      >
        {children}
      </div>

      {/* 오른쪽 스크롤 버튼 */}
      {shouldShowButtons && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className={cn(
            "shrink-0 p-[2px] rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
            !canScrollRight && "opacity-30 pointer-events-none",
            buttonClassName
          )}
          disabled={!canScrollRight}
        >
          <ChevronRight className={iconClassName} />
        </button>
      )}
    </div>
  );
}
