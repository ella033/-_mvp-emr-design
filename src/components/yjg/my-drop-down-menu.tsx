"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ReactNode,
  CSSProperties,
  cloneElement,
  isValidElement,
} from "react";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right" | "center";
  width?: number;
  className?: string;
  disabled?: boolean;
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
  onClose?: () => void;
}

export function DropdownItem({
  children,
  onClick,
  className = "",
  disabled = false,
  style,
  onClose,
}: DropdownItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick && !disabled) {
      onClick();
    }
    // 클릭 시 메뉴 닫기
    if (onClose && !disabled) {
      onClose();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full flex items-center px-[10px] py-[5px] text-left text-sm transition-colors ${className}`}
      style={{
        color: "var(--text-primary)",
        backgroundColor: "transparent",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}

export function MyDropdownMenu({
  trigger,
  children,
  align = "right",
  width = 120,
  className = "",
  disabled = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isUpward, setIsUpward] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 위치 계산
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // 기본 위치 계산
      let left = rect.left;
      let top = rect.bottom + 5;

      // 정렬에 따른 위치 계산
      if (align === "right") {
        left = rect.right - width;
      } else if (align === "center") {
        left = rect.left + (rect.width - width) / 2;
      }

      // 화면 경계 내에서 위치 조정
      left = Math.max(5, Math.min(left, viewportWidth - width - 5));

      // 화면 하단에 가까우면 위로 표시
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 아래쪽 공간이 부족하면 위로 표시
      if (spaceBelow < 150 && spaceAbove > 150) {
        // trigger의 상단 border 위에 위치하도록 계산
        top = rect.top;
        setIsUpward(true);
      } else {
        setIsUpward(false);
      }

      setDropdownPosition({
        top: Math.max(5, top),
        left: left,
      });
    }
  }, [isOpen, align, width]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 트리거 요소나 드롭다운 요소 내부 클릭인지 확인
      const isTriggerClick = triggerRef.current?.contains(target);
      const isDropdownClick = dropdownRef.current?.contains(target);

      if (!isTriggerClick && !isDropdownClick) {
        setIsOpen(false);
      }
    };

    // 약간의 지연을 두어 이벤트 버블링 문제를 해결
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // children에 onClose prop을 전달하는 함수
  const renderChildrenWithCloseHandler = () => {
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (isValidElement(child) && child.type === DropdownItem) {
          return cloneElement(child as React.ReactElement<DropdownItemProps>, {
            key: index,
            onClose: () => setIsOpen(false),
          });
        }
        return child;
      });
    } else if (isValidElement(children) && children.type === DropdownItem) {
      return cloneElement(children as React.ReactElement<DropdownItemProps>, {
        onClose: () => setIsOpen(false),
      });
    }
    return children;
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed border shadow-lg z-50 rounded-sm my-scroll"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: `${width}px`,
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
              maxHeight: "300px",
              // 위로 표시될 때 transform을 사용하여 정확한 위치에 배치
              transform: isUpward ? "translateY(-100%)" : "translateY(0)",
            }}
            onClick={handleDropdownClick}
          >
            {renderChildrenWithCloseHandler()}
          </div>,
          document.body
        )}
    </div>
  );
}
