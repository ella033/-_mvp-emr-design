"use client";

import type { ReactNode } from "react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface MaterialSearchDropDownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSelect?: (item: any) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  results?: any[];
  renderResultItem?: (item: any, index: number) => ReactNode;
  showResults?: boolean;
  onShowResultsChange?: (show: boolean) => void;
  className?: string;
  inputClassName?: string;
  itemHeight?: number;
  maxHeight?: number;
  fixedWidth?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isLoading?: boolean;
  hideClearButton?: boolean;
  parentRef?: React.RefObject<HTMLElement | null>;
  debounceMs?: number;
  headerNode?: ReactNode;
  inputSize?: "xs" | "sm" | "md" | "lg";
}

const INPUT_SIZE_CLASS = {
  xs: "text-[8px] px-[2px] py-[1px]",
  sm: "text-[10px] px-[3px] py-[1px]",
  md: "text-[12px] px-[6px] py-[3px]",
  lg: "text-[14px] px-[8px] py-[4px]",
};

export default function MaterialSearchDropDown({
  value,
  onChange,
  onClear,
  onSelect,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder,
  results = [],
  renderResultItem,
  showResults = false,
  onShowResultsChange,
  className,
  inputClassName,
  itemHeight = 28,
  maxHeight = 300,
  fixedWidth,
  inputRef,
  isLoading = false,
  hideClearButton = false,
  parentRef,
  debounceMs = 300,
  headerNode,
  inputSize = "md",
}: MaterialSearchDropDownProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    isAbove: false,
  });
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(28);

  // 내부 포커스 상태
  const [isFocused, setIsFocused] = useState(false);

  // debounce 적용된 검색어
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // debounce된 검색어가 변경될 때 결과 표시
  useEffect(() => {
    const hasHeader = !!headerNode;
    if (debouncedValue.trim() && (results.length > 0 || hasHeader)) {
      onShowResultsChange?.(true);
      setSelectedIndex(results.length > 0 ? 0 : -1);
    } else if (!hasHeader) {
      onShowResultsChange?.(false);
      setSelectedIndex(-1);
    }
  }, [debouncedValue, results.length, onShowResultsChange, headerNode]);

  // header 높이 측정
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    } else {
      setHeaderHeight(0);
    }
  }, [results.length, headerNode]);

  // 가상화 설정
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
    enabled: isClient && showResults,
  });

  // 드롭다운 높이 계산
  const calculateDropdownHeight = useCallback(() => {
    return Math.min(
      Math.max(
        results.length * itemHeight + headerHeight + (results.length > 0 ? 2 : 0),
        headerHeight
      ),
      maxHeight
    );
  }, [results.length, itemHeight, headerHeight, maxHeight]);

  // 드롭다운 위치 계산
  const updateDropdownPosition = useCallback(() => {
    const targetElement = parentRef?.current || containerRef.current;
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = calculateDropdownHeight();
    const dropdownWidth = fixedWidth || targetElement.clientWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldShowAbove =
      spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10;
    }
    if (left < 0) {
      left = 10;
    }

    setDropdownPosition({
      top: shouldShowAbove ? rect.top - dropdownHeight - 1 : rect.bottom + 1,
      left,
      isAbove: shouldShowAbove,
    });
  }, [parentRef, calculateDropdownHeight, fixedWidth]);

  // showResults 변경 시 위치 업데이트
  useEffect(() => {
    if (showResults) {
      updateDropdownPosition();
    }
  }, [showResults, results.length, itemHeight, maxHeight, updateDropdownPosition]);

  // 스크롤 시 위치 업데이트
  useEffect(() => {
    if (!showResults) return;
    const targetElement = parentRef?.current || containerRef.current;
    if (!targetElement) return;

    const scrollableParents: Element[] = [];
    let parent = targetElement.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (
        ["auto", "scroll"].includes(style.overflowX) ||
        ["auto", "scroll"].includes(style.overflowY)
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

    scrollableParents.forEach((sp) =>
      sp.addEventListener("scroll", handleScroll, { passive: true })
    );
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollableParents.forEach((sp) =>
        sp.removeEventListener("scroll", handleScroll)
      );
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showResults, updateDropdownPosition, parentRef]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!showResults) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        onShowResultsChange?.(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResults, onShowResultsChange]);

  // ESC 키 감지
  useEffect(() => {
    if (!showResults) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onShowResultsChange?.(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showResults, onShowResultsChange]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (!showResults || results.length === 0) return;
    e.stopPropagation();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev < results.length - 1 ? prev + 1 : prev;
          if (virtualizer && newIndex !== prev) {
            virtualizer.scrollToIndex(newIndex, { align: "center" });
          }
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          if (virtualizer && newIndex !== prev && newIndex >= 0) {
            virtualizer.scrollToIndex(newIndex, { align: "center" });
          }
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          onSelect?.(results[selectedIndex]);
          onShowResultsChange?.(false);
          setSelectedIndex(-1);
          setTimeout(() => inputRef?.current?.focus(), 0);
        }
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const nextValue = e.target.value.trim();
    if (nextValue) {
      onShowResultsChange?.(true);
    } else if (!headerNode) {
      onShowResultsChange?.(false);
      setSelectedIndex(-1);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value.trim() && results.length > 0) {
      onShowResultsChange?.(true);
    }
    onFocus?.();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e.target.value);
    setTimeout(() => {
      const isDropdownClick = dropdownRef.current?.contains(document.activeElement);
      if (!isDropdownClick) {
        onShowResultsChange?.(false);
        setIsFocused(false);
      }
    }, 100);
  };

  const handleClear = () => {
    onClear();
    onShowResultsChange?.(false);
    setSelectedIndex(-1);
  };

  // 드롭다운 크기
  const targetElement = parentRef?.current || containerRef.current;
  const dropdownWidth = fixedWidth || targetElement?.clientWidth || 0;
  const dropdownHeight = calculateDropdownHeight();
  const shouldShowResults = showResults && isFocused;

  // 가상화된 아이템 렌더링
  const VirtualizedItem = useCallback(
    (virtualItem: any) => {
      const { index, start, size } = virtualItem;
      const item = results[index];
      const isSelected = index === selectedIndex;

      const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect?.(item);
        onShowResultsChange?.(false);
        setSelectedIndex(-1);
        setTimeout(() => inputRef?.current?.focus(), 0);
      };

      return (
        <div
          key={item?.key || index}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${size}px`,
            transform: `translateY(${start}px)`,
          }}
          className={cn(
            "hover:bg-[var(--bg-base)] cursor-pointer text-[var(--gray-300)] flex items-center",
            isSelected && "bg-[var(--bg-base)]"
          )}
          onMouseDown={handleMouseDown}
        >
          {renderResultItem ? (
            renderResultItem(item, index)
          ) : (
            <div className="text-[13px] px-2">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </div>
          )}
        </div>
      );
    },
    [results, selectedIndex, renderResultItem, onSelect, onShowResultsChange, inputRef]
  );

  return (
    <>
      <div
        ref={containerRef}
        className={cn("flex flex-row relative items-center w-full", className)}
        tabIndex={-1}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={cn(
            "flex-1 border-0 bg-transparent min-w-0 outline-none px-[6px]",
            INPUT_SIZE_CLASS[inputSize],
            inputClassName
          )}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <div className="flex items-center px-[5px]">
          {isLoading && (
            <div className="flex items-center">
              <MyLoadingSpinner size="sm" />
            </div>
          )}
          {value && !hideClearButton && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={handleClear}
              aria-label="검색 지우기"
            >
              <XMarkIcon className="w-[14px] h-[14px]" />
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 드롭다운 (Portal) - Figma 디자인 맞춤 */}
      {shouldShowResults &&
        isClient &&
        createPortal(
          <div
            ref={dropdownRef}
            className="flex overflow-hidden fixed z-99 flex-col border border-[var(--border-2)] rounded-[6px] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] bg-white"
            data-material-search-dropdown="true"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: `${dropdownWidth}px`,
              height: dropdownHeight,
            }}
          >
            {/* 드롭다운 헤더 */}
            {headerNode && (
              <div
                ref={headerRef}
                className="flex-shrink-0"
              >
                {headerNode}
              </div>
            )}
            <div
              ref={scrollElementRef}
              className="overflow-auto flex-1 my-scroll"
            >
              {results.length > 0 && (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map(VirtualizedItem)}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
