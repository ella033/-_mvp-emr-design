"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export interface MyContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export interface MyContextMenuProps {
  isOpen: boolean;
  onCloseAction: () => void;
  items: MyContextMenuItem[];
  position: { x: number; y: number };
  className?: string;
  width?: number;
  /** 포탈 z-index. 드롭다운 등 다른 오버레이보다 위에 띄울 때 사용 (예: 1000) */
  zIndex?: number;
}

export function MyContextMenu({
  isOpen,
  onCloseAction,
  items,
  position,
  className = "",
  width = 120,
  zIndex,
}: MyContextMenuProps) {
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  // 위치 조정 계산
  React.useEffect(() => {
    if (!isOpen) return;

    const menuRef = document.createElement("div");
    menuRef.style.position = "fixed";
    menuRef.style.visibility = "hidden";
    menuRef.style.pointerEvents = "none";
    menuRef.style.zIndex = "-1";
    menuRef.className = `bg-[var(--card-bg)] border border-[var(--card-border)] rounded-sm shadow-lg`;

    // 임시로 메뉴를 DOM에 추가하여 크기 측정
    document.body.appendChild(menuRef);

    // 가장 긴 label 길이 계산
    const maxLabelLength = Math.max(...items.map((item) => item.label.length));
    const estimatedWidth = Math.max(50, maxLabelLength * 8 + 40); // 최소 120px, 글자당 8px + 패딩 40px

    // 메뉴 아이템들을 추가하여 실제 크기 측정
    items.forEach((item) => {
      const button = document.createElement("button");
      button.className = "w-full px-3 py-2 text-left text-sm";
      button.textContent = item.label;
      menuRef.appendChild(button);
    });

    // 계산된 너비 적용
    menuRef.style.width = `${estimatedWidth}px`;

    const rect = menuRef.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // 오른쪽 경계 체크
    if (position.x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10; // 10px 여백
    }

    // 왼쪽 경계 체크
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // 하단 경계 체크
    if (position.y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10; // 10px 여백
    }

    // 상단 경계 체크
    if (adjustedY < 10) {
      adjustedY = 10;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });

    // 임시 요소 제거
    document.body.removeChild(menuRef);
  }, [isOpen, position, items]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      // MyContextMenu 내부 클릭은 무시
      if (target.closest('[data-my-context-menu="true"]')) {
        return;
      }
      onCloseAction();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseAction();
      }
    };

    if (isOpen) {
      // 약간의 지연을 두어 우클릭 이벤트가 처리된 후 외부 클릭 감지 시작
      const timer = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      document.addEventListener("keydown", handleEscape);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return undefined;
  }, [isOpen, onCloseAction]);

  if (!isOpen) return null;

  // 가장 긴 label 길이 계산
  const maxLabelLength = Math.max(...items.map((item) => item.label.length));
  const estimatedWidth = Math.max(width, maxLabelLength * 8 + 40); // 최소 120px, 글자당 8px + 패딩 40px

  return createPortal(
    <div
      data-my-context-menu="true"
      className={`context-menu fixed z-99 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-sm shadow-lg ${className}`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        width: `${estimatedWidth}px`,
        ...(zIndex !== undefined && { zIndex }),
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          type="button"
          className={`w-full px-3 py-2 text-left text-sm transition-colors first:rounded-t-sm last:rounded-b-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed ${item.className || ""}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!item.disabled) {
              item.onClick();
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}
