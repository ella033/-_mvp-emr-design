import type { ReactNode } from "react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MyLoadingSpinner } from "./my-loading-spinner";
import { cn, highlightKeyword } from "./common/util/ui-util";
import { useDebounce } from "@/hooks/use-debounce";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
  SEARCH_INPUT_CLASS,
  INPUT_SIZE_CLASS,
} from "./common/constant/class-constants";
import { MyTooltip } from "@/components/yjg/my-tooltip";

interface SearchInputProps {
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
  showResultsOnFocus?: boolean;
  showResults?: boolean;
  onShowResultsChange?: (show: boolean) => void;
  className?: string;
  inputClassName?: string;
  itemHeight?: number;
  maxHeight?: number;
  fixedWidth?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  hideMagnifyingGlass?: boolean;
  hideClearButton?: boolean;
  parentRef?: React.RefObject<HTMLElement | null>;
  debounceMs?: number; // debounce 시간 설정 가능
  maxLength?: number; // 입력 최대 길이
  headerNode?: ReactNode;
  footerNode?: ReactNode;
  inputTooltip?: string;
  inputSize?: "xs" | "sm" | "md" | "lg";
  inputTestId?: string;
}

export default function MySearchDropDown({
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
  showResultsOnFocus = false,
  showResults = false,
  onShowResultsChange,
  className,
  inputClassName,
  itemHeight = 30,
  maxHeight = 300,
  fixedWidth,
  inputRef,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  hideMagnifyingGlass = false,
  hideClearButton = false,
  parentRef,
  debounceMs = 300, // 기본 300ms
  maxLength,
  headerNode,
  footerNode,
  inputTooltip,
  inputSize = "md",
  inputTestId,
}: SearchInputProps) {
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
  // header, footer ref 추가
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  // 드롭다운 내부 마우스 인터랙션 추적 (blur 방지용)
  const isDropdownMouseDownRef = useRef(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef || internalInputRef;
  const [headerHeight, setHeaderHeight] = useState(28); // 기본값
  const [footerHeight, setFooterHeight] = useState(28); // 기본값

  // debounce 적용된 검색어
  const debouncedValue = useDebounce(value, debounceMs);


  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
  }, []);

  // debounce된 검색어가 변경될 때 결과 표시
  useEffect(() => {
    // 검색어가 있으면 결과창 활성화 (결과 0건일 때도 빈 상태 표시)
    const hasHeaderOrFooter = headerNode || footerNode;
    if (debouncedValue.trim() && (results.length > 0 || hasHeaderOrFooter || !isLoading)) {
      onShowResultsChange?.(true);
      // 검색 결과가 있으면 첫 번째 항목 선택
      setSelectedIndex(results.length > 0 ? 0 : -1);
    } else if (!hasHeaderOrFooter) {
      onShowResultsChange?.(false);
      setSelectedIndex(-1);
    }
  }, [
    debouncedValue,
    results.length,
    onShowResultsChange,
    headerNode,
    footerNode,
    isLoading,
  ]);

  // header 높이 측정
  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      setHeaderHeight(height);
    } else {
      setHeaderHeight(0);
    }
  }, [results.length, headerNode]);

  // footer 높이 측정
  useEffect(() => {
    if (footerRef.current) {
      const height = footerRef.current.offsetHeight;
      setFooterHeight(height);
    }
  }, [results.length, footerNode]); // footer 내용이 변경될 때마다 재측정

  // 가상화 설정
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
    enabled: isClient && showResults,
  });

  // 드롭다운 높이 계산 함수를 하나로 통합 (실제 results.length 기반)
  const calculateDropdownHeight = () => {
    const emptyStateMinHeight =
      !isLoading && debouncedValue.trim() !== "" && results.length === 0 ? 30 : 0;
    return Math.min(
      Math.max(
        results.length * itemHeight +
        headerHeight +
        footerHeight +
        emptyStateMinHeight +
        (results.length > 0 ? 2 : 0),
        headerHeight + footerHeight + emptyStateMinHeight
      ),
      maxHeight
    );
  };

  // 드롭다운 위치 계산 함수
  const updateDropdownPosition = useCallback(() => {
    const targetElement = parentRef?.current || containerRef.current;

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // 통합된 높이 계산 사용
      const dropdownHeight = calculateDropdownHeight();

      // 하단에 표시할 공간이 충분한지 확인
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 하단 공간이 부족하고 상단 공간이 더 많으면 상단에 표시
      const shouldShowAbove =
        spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      // 실제 드롭다운 너비 계산 (fixedWidth가 있으면 우선 사용)
      const actualDropdownWidth = fixedWidth || rect.width;

      // 좌우 위치 조정 (화면 밖으로 나가지 않도록)
      let left = rect.left;

      // 오른쪽으로 나가면 왼쪽으로 조정
      if (left + actualDropdownWidth > viewportWidth) {
        left = viewportWidth - actualDropdownWidth - 10; // 10px 여백
      }

      // 왼쪽으로 나가면 0으로 조정
      if (left < 0) {
        left = 10; // 10px 여백
      }

      setDropdownPosition({
        top: shouldShowAbove ? rect.top - dropdownHeight - 1 : rect.bottom + 1,
        left: left,
        isAbove: shouldShowAbove,
      });
    }
  }, [
    parentRef,
    fixedWidth,
    headerHeight,
    footerHeight,
    results.length,
    itemHeight,
    maxHeight,
  ]);

  // 위치 계산에서 사용
  useEffect(() => {
    if (showResults) {
      updateDropdownPosition();
    }
  }, [
    showResults,
    results.length,
    itemHeight,
    maxHeight,
    isLoadingMore,
    parentRef,
    fixedWidth,
    updateDropdownPosition,
  ]);

  // 스크롤 시 위치 업데이트 (부모 요소들의 스크롤 감지)
  useEffect(() => {
    if (!showResults) return;

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

    // 스크롤 중 RAF가 이미 예약되어 있는지 추적
    let isRafScheduled = false;

    // 스크롤 이벤트 핸들러 (requestAnimationFrame으로 throttle)
    const handleScroll = () => {
      // 이미 RAF가 예약되어 있으면 중복 예약 방지
      if (isRafScheduled) return;

      isRafScheduled = true;
      requestAnimationFrame(() => {
        updateDropdownPosition();
        isRafScheduled = false;
      });
    };

    // 모든 스크롤 가능한 부모에 이벤트 리스너 추가
    scrollableParents.forEach((scrollParent) => {
      scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    });

    // window scroll도 감지
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollableParents.forEach((scrollParent) => {
        scrollParent.removeEventListener("scroll", handleScroll);
      });
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showResults, updateDropdownPosition, parentRef]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!showResults) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isContainerClick = containerRef.current?.contains(target);
      const isDropdownClick = dropdownRef.current?.contains(target);

      if (!isContainerClick && !isDropdownClick) {
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
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showResults, onShowResultsChange]);

  // 스크롤 이벤트 핸들러 (추가 로드)
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasMore || isLoadingMore) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // 스크롤이 하단에 가까워지면 더 많은 데이터 로드
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoadingMore]
  );

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (!showResults || results.length === 0) return;
    // macOS 등에서 키 반복(key repeat) 시 한 번만 이동하도록, 조합 중(한글 등)일 때는 방향키를 가로채지 않도록
    if (e.nativeEvent.repeat || e.nativeEvent.isComposing) return;
    e.stopPropagation();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev < results.length - 1 ? prev + 1 : prev;
          // 선택된 항목이 보이도록 스크롤
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
          // 선택된 항목이 보이도록 스크롤
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
          // DOM 업데이트가 완료된 후 focus (첫 번째 항목 추가 시 그리드 구조 변경 대응)
          setTimeout(() => {
            resolvedInputRef?.current?.focus();
          }, 0);
        }
        break;
    }
  };

  // 검색어 변경 시 결과 표시 (debounce 적용)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    // debounce된 값이 변경될 때 자동으로 결과가 표시되므로 여기서는 즉시 처리하지 않음
  };

  // 포커스 이벤트 처리
  const handleFocus = () => {
    // 검색어가 있으면 결과창 표시 (결과 0건일 때 빈 상태 표시)
    if (
      showResultsOnFocus ||
      (value.trim() && (results.length > 0 || !!headerNode || !!footerNode || !isLoading))
    ) {
      onShowResultsChange?.(true);
    }
    onFocus?.();
  };

  // 블러 이벤트 처리
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e.target.value);

    // Case 1: 드롭다운 내부 요소 클릭 중 (mousedown-mouseup 사이)
    if (isDropdownMouseDownRef.current) {
      requestAnimationFrame(() => resolvedInputRef?.current?.focus());
      return;
    }

    // Case 2: relatedTarget이 드롭다운/컨테이너 내부 → 재포커스
    const relatedTarget = e.relatedTarget as Node | null;
    if (
      relatedTarget &&
      (dropdownRef.current?.contains(relatedTarget) ||
        containerRef.current?.contains(relatedTarget))
    ) {
      requestAnimationFrame(() => resolvedInputRef?.current?.focus());
      return;
    }

    // Case 3: relatedTarget이 존재하고 외부 → Tab 이동 등 → 드롭다운 닫기
    if (relatedTarget) {
      onShowResultsChange?.(false);
      return;
    }

    // Case 4: relatedTarget이 null이고 드롭다운이 보이는 중
    // → Zustand 등 상태변화에 의한 리렌더링으로 발생한 blur
    // → input에 재포커스. 실제 외부 클릭 닫기는 handleClickOutside가 처리.
    if (showResults) {
      requestAnimationFrame(() => resolvedInputRef?.current?.focus());
      return;
    }
  };

  // 검색어 지우기
  const handleClear = () => {
    onClear();
    onShowResultsChange?.(false);
    setSelectedIndex(-1);
  };

  // 드롭다운 width 계산 (fixedWidth가 있으면 우선 사용)
  const targetElement = parentRef?.current || containerRef.current;
  const dropdownWidth = fixedWidth || targetElement?.clientWidth || 0;
  // 실제 드롭다운 높이 설정에서도 동일한 계산 사용
  const dropdownHeight = calculateDropdownHeight();

  // showResults만으로 드롭다운 표시 제어 (blur 시 onShowResultsChange(false)로 닫음)
  const shouldShowResults = showResults;

  // 가상화된 아이템 렌더링
  const VirtualizedItem = useCallback(
    (virtualItem: any) => {
      const { index, start, size } = virtualItem;
      const item = results[index];
      const isSelected = index === selectedIndex;

      // mousedown 이벤트 전파 방지 (외부 클릭 감지보다 먼저 처리)
      const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault(); // blur 방지
        onSelect?.(item);
        onShowResultsChange?.(false);
        setSelectedIndex(-1);
        // DOM 업데이트가 완료된 후 focus (첫 번째 항목 추가 시 그리드 구조 변경 대응)
        setTimeout(() => {
          resolvedInputRef?.current?.focus();
        }, 0);
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
          className={`hover:bg-[var(--bg-tertiary)] hover:font-bold cursor-pointer text-[var(--text-primary)] flex items-center ${isSelected ? "font-bold bg-[var(--bg-tertiary)]" : ""
            }`}
          onMouseDown={handleMouseDown}
        >
          {renderResultItem ? (
            renderResultItem(item, index)
          ) : (
            <div className="text-[14px] px-[5px]">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </div>
          )}
        </div>
      );
    },
    [
      results,
      selectedIndex,
      renderResultItem,
      onSelect,
      onShowResultsChange,
      resolvedInputRef,
    ]
  );

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          INPUT_COMMON_CLASS,
          INPUT_FOCUS_CLASS,
          "flex flex-row relative items-center w-full",
          className
        )}
        tabIndex={-1}
      >
        {!hideMagnifyingGlass && (
          <div className="pl-[8px] flex-shrink-0">
            <MagnifyingGlassIcon className="w-[14px] h-[14px] text-[var(--input-border)]" />
          </div>
        )}
        <MyTooltip content={inputTooltip} side="left">
          <input
            ref={resolvedInputRef}
            type="text"
            data-testid={inputTestId}
            placeholder={placeholder}
            className={cn(SEARCH_INPUT_CLASS, INPUT_SIZE_CLASS[inputSize], inputClassName)}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={maxLength}
          />
        </MyTooltip>
        <div className="flex items-center px-[5px]">
          {isLoading && (
            <div className="flex items-center">
              <MyLoadingSpinner size="sm" />
            </div>
          )}
          {value && !hideClearButton && (
            <div className="flex items-center">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={handleClear}
                aria-label="검색 지우기"
              >
                <XMarkIcon className="w-[14px] h-[14px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 드롭다운 (Portal) */}
      {shouldShowResults &&
        createPortal(
          <div
            ref={dropdownRef}
            className="flex overflow-hidden fixed z-[999] flex-col border shadow-lg"
            data-my-search-dropdown="true"
            onMouseDown={() => {
              isDropdownMouseDownRef.current = true;
            }}
            onMouseUp={() => {
              isDropdownMouseDownRef.current = false;
            }}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: `${dropdownWidth}px`,
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-primary)",
              height: dropdownHeight,
            }}
          >
            {/* 드롭다운 헤더 */}
            {headerNode && (
              <div
                ref={headerRef}
                className="flex-shrink-0 border-b border-[var(--border-primary)]"
                onMouseDown={(e) => {
                  // header 내 요소 클릭 시 input blur 방지
                  e.preventDefault();
                }}
              >
                {headerNode}
              </div>
            )}
            <div
              ref={scrollElementRef}
              className="overflow-auto flex-1 my-scroll"
              onScroll={handleScroll}
            >
              {!isLoading && value.trim() !== "" && results.length === 0 && (
                <div className="flex items-center justify-center w-full h-full text-[12px] text-[var(--text-tertiary)]">
                  검색 결과가 없습니다.
                </div>
              )}
              {isClient && results.length > 0 && (
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
            <div
              ref={footerRef}
              className="flex items-center gap-2 px-2 py-1 border-t border-[var(--border-primary)]"
              onMouseDown={(e) => {
                // footer 내 요소(체크박스 등) 클릭 시 input blur 방지
                e.preventDefault();
              }}
            >
              {isLoading || isLoadingMore ? (
                <div className="flex items-center justify-center w-full">
                  <MyLoadingSpinner size="sm" />
                </div>
              ) : (
                <div className="flex flex-1 items-center">{footerNode}</div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function highlightText(text: string, searchWord: string) {
  return highlightKeyword(text, searchWord, { splitWords: true });
}
