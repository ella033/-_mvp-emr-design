"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean; // 구분선 표시 여부
  className?: string; // 아이템별 커스텀 클래스
  style?: React.CSSProperties; // 아이템별 커스텀 스타일
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onCloseAction: () => void;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onCloseAction,
  className,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseAction();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseAction();
      }
    };

    if (position) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [position, onCloseAction]);

  // 화면 경계를 벗어나지 않도록 위치 조정
  useEffect(() => {
    if (position && menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      // 우측 경계 체크
      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 10;
      }

      // 하단 경계 체크
      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 10;
      }

      // 좌측 경계 체크
      if (x < 0) {
        x = 10;
      }

      // 상단 경계 체크
      if (y < 0) {
        y = 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  if (!position) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      onCloseAction();
    }
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[160px] py-1",
        "bg-white rounded-md shadow-lg",
        "border border-[var(--border-1)]",
        className
      )}
      style={{
        left: `${adjustedPosition?.x || position.x}px`,
        top: `${adjustedPosition?.y || position.y}px`,
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.divider && index > 0 && (
            <div className="h-px bg-[var(--border-1)] my-1" />
          )}
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
              "transition-colors",
              item.disabled
                ? "text-[var(--gray-500)] cursor-not-allowed opacity-50"
                : "text-[var(--fg-main)] hover:bg-[var(--bg-1)] cursor-pointer",
              item.className
            )}
            style={item.style}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
          >
            {item.icon && (
              <span className="flex items-center justify-center w-4 h-4">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ContextMenu;
