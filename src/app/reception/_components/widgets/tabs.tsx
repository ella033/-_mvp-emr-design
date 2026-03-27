"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  testId?: string;
  visible?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onVisibilityChange?: (tabId: string, visible: boolean) => void;
  showSettings?: boolean;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabsProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleTabsCount, setVisibleTabsCount] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 보이는 탭들만 필터링
  const visibleTabs = useMemo(() =>
    tabs.filter((tab) => tab.visible !== false),
    [tabs]
  );

  // 컨테이너 크기 업데이트
  const updateContainerSize = useCallback(() => {
    if (!tabsContainerRef.current) return;

    const newWidth = tabsContainerRef.current.offsetWidth;
    if (newWidth !== containerWidth && newWidth > 0) {
      setContainerWidth(newWidth);
    }
  }, [containerWidth]);

  // 탭 개수 계산 (동적 버튼 공간 계산)
  const calculateVisibleTabs = useCallback(() => {
    if (containerWidth === 0) return;

    const estimatedTabWidth = 75;
    const navigationButtonWidth = 10;

    // 1단계: 모든 탭이 들어가는지 확인
    const allTabsWidth = visibleTabs.length * estimatedTabWidth;

    if (allTabsWidth <= containerWidth) {
      setVisibleTabsCount(visibleTabs.length);
      setStartIndex(0);
      return;
    }

    // 2단계: 현재 상황에서 필요한 버튼들 확인
    const needsLeftButton = startIndex > 0;

    // 3단계: 실제 공간 활용 최적화 계산
    let bestVisibleCount = 1;

    // 시나리오 1: 왼쪽만 + 오른쪽 없음
    let scenario1ReservedWidth = needsLeftButton ? navigationButtonWidth : 0;
    let scenario1Available = containerWidth - scenario1ReservedWidth;
    let scenario1Count = Math.floor(scenario1Available / estimatedTabWidth);
    scenario1Count = Math.min(scenario1Count, visibleTabs.length - startIndex); // 실제 표시 가능한 탭 수

    const scenario1NeedsRightButton = startIndex + scenario1Count < visibleTabs.length;

    // 시나리오 2: 왼쪽 + 오른쪽 둘 다
    let scenario2ReservedWidth = needsLeftButton ? navigationButtonWidth : 0;
    if (scenario1NeedsRightButton) {
      scenario2ReservedWidth += navigationButtonWidth;
    }
    let scenario2Available = containerWidth - scenario2ReservedWidth;
    let scenario2Count = Math.floor(scenario2Available / estimatedTabWidth);
    scenario2Count = Math.min(scenario2Count, visibleTabs.length - startIndex);

    // 더 많은 탭을 보여줄 수 있는 시나리오 선택
    if (!scenario1NeedsRightButton || scenario1Count >= scenario2Count) {
      // 시나리오 1이 더 유리하거나 오른쪽 버튼이 불필요
      bestVisibleCount = scenario1Count;
    } else {
      // 시나리오 2 선택
      bestVisibleCount = scenario2Count;
    }

    const newVisibleCount = Math.max(1, bestVisibleCount);

    // 6단계: visibleTabsCount 업데이트 및 startIndex 조정
    if (newVisibleCount > visibleTabsCount && startIndex > 0) {
      // 더 많은 탭을 보여줄 수 있게 되었으면 앞쪽으로 당기기
      const currentEndIndex = startIndex + newVisibleCount;
      if (currentEndIndex > visibleTabs.length) {
        const newStartIndex = Math.max(0, visibleTabs.length - newVisibleCount);
        setStartIndex(newStartIndex);
      }
    }

    setVisibleTabsCount(newVisibleCount);

    // 최종 안전장치
    const maxStartIndex = Math.max(0, visibleTabs.length - newVisibleCount);
    if (startIndex > maxStartIndex) {
      setStartIndex(maxStartIndex);
    }
  }, [containerWidth, visibleTabs.length, startIndex, visibleTabsCount]);

  // ResizeObserver 설정
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(updateContainerSize, 100);
    });

    if (tabsContainerRef.current?.parentElement) {
      resizeObserver.observe(tabsContainerRef.current.parentElement);
    }

    // 초기 크기 설정
    updateContainerSize();

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [updateContainerSize]);

  // 컨테이너 크기 변경 시 탭 개수 재계산
  useEffect(() => {
    calculateVisibleTabs();
  }, [calculateVisibleTabs]);

  // 스크롤 함수들
  const scrollLeft = () => {
    setStartIndex(prev => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setStartIndex(prev => {
      const maxStartIndex = Math.max(0, visibleTabs.length - visibleTabsCount);
      return Math.min(maxStartIndex, prev + 1);
    });
  };

  // 현재 표시할 탭들
  const safeStartIndex = Math.max(0, Math.min(startIndex, visibleTabs.length - 1));
  const safeEndIndex = Math.min(visibleTabs.length, safeStartIndex + visibleTabsCount);
  const displayedTabs = visibleTabs.slice(safeStartIndex, safeEndIndex);

  // 네비게이션 버튼 표시 여부
  const showLeftButton = safeStartIndex > 0;
  const showRightButton = safeEndIndex < visibleTabs.length;

  // 모든 탭이 다 보이는지 확인 (모든 탭이 들어갈 수 있는지)
  const allTabsFit = useMemo(() => {
    if (containerWidth === 0 || visibleTabs.length === 0) return false;
    const estimatedTabWidth = 75;
    const allTabsWidth = visibleTabs.length * estimatedTabWidth;
    return allTabsWidth <= containerWidth;
  }, [containerWidth, visibleTabs.length]);

  // 모든 탭이 다 보일 때 각 탭의 너비 계산
  const tabWidth = useMemo(() => {
    if (!allTabsFit || containerWidth === 0 || visibleTabs.length === 0) return undefined;
    return containerWidth / visibleTabs.length;
  }, [allTabsFit, containerWidth, visibleTabs.length]);

  return (
    <div className={`flex justify-between items-center ${className}`}>
      <div className="flex items-center flex-1 min-w-0 rounded-sm border border-[var(--border-1)] bg-[var(--bg-3)]">
        {/* 왼쪽 스크롤 버튼 */}
        {showLeftButton && (
          <button
            onClick={scrollLeft}
            className="flex-shrink-0 rounded-sm px-1 py-1 text-[var(--gray-300)] hover:text-[var(--gray-100)] hover:bg-[var(--bg-main)] cursor-pointer"
            title="이전 탭들 보기"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* 탭 컨테이너 */}
        <div ref={tabsContainerRef} className="flex items-center overflow-hidden flex-1">
          {displayedTabs.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              data-testid={tab.testId}
              onClick={() => onTabChange(tab.id)}
              style={tabWidth ? { width: `${tabWidth}px` } : undefined}
              className={`px-3 py-1.5 text-sm transition-colors cursor-pointer whitespace-nowrap ${allTabsFit ? "" : "flex-shrink-0"} rounded-sm border
                ${activeTab === tab.id
                  ? "bg-[var(--bg-main)] text-[var(--main-color)] border-[var(--main-color)] font-semibold"
                  : "bg-transparent text-[var(--gray-300)] border-transparent hover:text-[var(--gray-100)]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 오른쪽 스크롤 버튼 */}
        {showRightButton && (
          <button
            onClick={scrollRight}
            className="flex-shrink-0 rounded-sm px-1 py-1 text-[var(--gray-300)] hover:text-[var(--gray-100)] hover:bg-[var(--bg-main)] cursor-pointer"
            title="다음 탭들 보기"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 설정 메뉴 */}
      {/*{showSettings && (
        <div
          className="h-full flex items-center justify-end flex-nowrap relative flex-shrink-0 bg-[var(--bg-1)]"
        >
          <button
            className="p-2 bg-transparent border-none cursor-pointer"
          >
            <Settings className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-full bg-[var(--background)] border rounded-md shadow-lg z-10 min-w-[80px]">
              <div className="p-0 border-b">
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tabs.every((tab) => tab.visible !== false)}
                    onChange={(e) =>
                      tabs.forEach((tab) =>
                        handleTabVisibility(tab.id, e.target.checked)
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm whitespace-nowrap">전체</span>
                </label>
              </div>
              <div className="p-0">
                {tabs.map((tab) => (
                  <label
                    key={tab.id}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={tab.visible !== false}
                      onChange={(e) =>
                        handleTabVisibility(tab.id, e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm whitespace-nowrap">
                      {tab.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      */}
    </div>
  );
}
