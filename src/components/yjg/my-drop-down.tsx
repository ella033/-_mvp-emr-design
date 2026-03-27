"use client";

import type { ReactNode } from "react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "./common/util/ui-util";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
} from "./common/constant/class-constants";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface MyDropDownProps {
  /** 트리거 영역 (버튼, div 등 자유롭게 전달 가능) */
  trigger?: ReactNode;
  /** 트리거 영역에 표시될 값 (trigger가 없을 때 기본 트리거에서 사용) */
  value?: string;
  /** 값이 없을 때 표시될 placeholder (trigger가 없을 때 기본 트리거에서 사용) */
  placeholder?: string;
  /** dropdown이 열렸을 때 표시될 children */
  children: ReactNode;
  /** dropdown 열림/닫힘 상태 (controlled) */
  isOpen?: boolean;
  /** dropdown 열림/닫힘 상태 변경 핸들러 */
  onOpenChange?: (isOpen: boolean) => void;
  /** 트리거 영역 className (기본 트리거에서 사용) */
  className?: string;
  /** dropdown 영역 className */
  dropdownClassName?: string;
  /** dropdown 최대 높이 */
  maxHeight?: number;
  /** dropdown 고정 너비 (미지정 시 트리거 너비와 동일) */
  fixedWidth?: number;
  /** dropdown 최소 너비 (트리거보다 좁을 때 이 값으로 확장) */
  minWidth?: number;
  /** 위치 계산 기준이 될 부모 요소 ref */
  parentRef?: React.RefObject<HTMLElement | null>;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export default function MyDropDown({
  trigger,
  value,
  placeholder = "선택",
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  dropdownClassName,
  maxHeight = 300,
  fixedWidth,
  minWidth,
  parentRef,
  disabled = false,
}: MyDropDownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    isAbove: false,
  });
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // controlled vs uncontrolled
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 드롭다운 위치 계산 함수
  const updateDropdownPosition = useCallback(() => {
    const targetElement = parentRef?.current || containerRef.current;

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // 하단에 표시할 공간이 충분한지 확인
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 하단 공간이 부족하고 상단 공간이 더 많으면 상단에 표시
      const shouldShowAbove = spaceBelow < maxHeight && spaceAbove > spaceBelow;

      // 실제 드롭다운 너비 계산
      const actualDropdownWidth = fixedWidth || rect.width;

      // 좌우 위치 조정 (화면 밖으로 나가지 않도록)
      let left = rect.left;

      // 오른쪽으로 나가면 왼쪽으로 조정
      if (left + actualDropdownWidth > viewportWidth) {
        left = viewportWidth - actualDropdownWidth - 10;
      }

      // 왼쪽으로 나가면 0으로 조정
      if (left < 0) {
        left = 10;
      }

      // 트리거에 밀착: 아래로 열릴 땐 top 기준, 위로 열릴 땐 bottom 기준으로 붙임
      setDropdownPosition({
        top: shouldShowAbove ? 0 : rect.bottom,
        bottom: shouldShowAbove ? viewportHeight - rect.top : 0,
        left: left,
        isAbove: shouldShowAbove,
      });
    }
  }, [parentRef, fixedWidth, minWidth, maxHeight]);

  // dropdown 열릴 때 위치 계산
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, updateDropdownPosition]);

  // 스크롤 시 위치 업데이트
  useEffect(() => {
    if (!isOpen) return;

    const targetElement = parentRef?.current || containerRef.current;
    if (!targetElement) return;

    // 모든 스크롤 가능한 부모 요소 찾기
    const scrollableParents: Element[] = [];
    let parent = targetElement.parentElement;

    while (parent) {
      const style = getComputedStyle(parent);
      const overflowX = style.overflowX;
      const overflowY = style.overflowY;

      if (
        overflowX === "auto" ||
        overflowX === "scroll" ||
        overflowY === "auto" ||
        overflowY === "scroll"
      ) {
        scrollableParents.push(parent);
      }
      parent = parent.parentElement;
    }

    let isRafScheduled = false;

    const handleScroll = () => {
      if (isRafScheduled) return;

      isRafScheduled = true;
      requestAnimationFrame(() => {
        updateDropdownPosition();
        isRafScheduled = false;
      });
    };

    scrollableParents.forEach((scrollParent) => {
      scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollableParents.forEach((scrollParent) => {
        scrollParent.removeEventListener("scroll", handleScroll);
      });
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, updateDropdownPosition, parentRef]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isContainerClick = containerRef.current?.contains(target);
      const isDropdownClick = dropdownRef.current?.contains(target);

      if (!isContainerClick && !isDropdownClick) {
        setIsOpen(false);
      }
    };

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

  // 트리거 클릭 핸들러
  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // 드롭다운 width 계산 (minWidth 적용 시 부모보다 넓게 표시)
  const targetElement = parentRef?.current || containerRef.current;
  const baseWidth = fixedWidth ?? targetElement?.clientWidth ?? 0;
  const dropdownWidth =
    minWidth != null ? Math.max(minWidth, baseWidth) : baseWidth;

  return (
    <>
      {/* 트리거 영역 */}
      {trigger ? (
        // 커스텀 트리거: 클릭 이벤트를 감싸서 처리
        <div
          ref={containerRef}
          onClick={handleTriggerClick}
          className={cn(
            "flex-1 h-full",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {trigger}
        </div>
      ) : (
        // 기본 트리거: input 스타일 박스
        <div
          ref={containerRef}
          className={cn(
            INPUT_COMMON_CLASS,
            INPUT_FOCUS_CLASS,
            "flex relative items-center justify-between w-full mx-[1px] cursor-pointer select-none",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onClick={handleTriggerClick}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTriggerClick();
            }
          }}
        >
          <span
            className={cn(
              "flex-1 truncate text-[14px] px-[8px]",
              !value && "text-[var(--text-tertiary)]"
            )}
          >
            {value || placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              "w-[14px] h-[14px] flex-shrink-0 mr-[4px] transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      )}

      {/* Dropdown (Portal) */}
      {isOpen &&
        isClient &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              "flex overflow-hidden fixed z-99 flex-col border shadow-md rounded-md",
              dropdownClassName
            )}
            style={{
              ...(dropdownPosition.isAbove
                ? { bottom: dropdownPosition.bottom, top: "auto" }
                : { top: dropdownPosition.top }),
              left: dropdownPosition.left,
              width: `${dropdownWidth}px`,
              maxHeight: maxHeight,
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-primary)",
            }}
          >
            <div className="overflow-auto flex-1 my-scroll">{children}</div>
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * Dropdown을 닫기 위한 컨텍스트 훅 (children 내부에서 사용)
 */
export function useDropDownClose(onOpenChange?: (isOpen: boolean) => void) {
  const close = useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  return { close };
}
