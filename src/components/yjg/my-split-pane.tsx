import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useCreateOrUpdateSetting } from "@/hooks/api/use-settings";

// Split pane 설정 상수
const SPLIT_PANE_SETTINGS = {
  scope: "user" as const,
  category: "split-pane",
};

// debounce 타이머 저장용 맵
const saveRatiosTimers: Map<string, NodeJS.Timeout> = new Map();

interface SplitPaneProps {
  splitPaneId: string;
  isVertical?: boolean;
  isHideBorder?: boolean;
  panes: React.ReactNode[];
  /**
   * 저장/복원 방식
   * - ratio: 기존 방식 (container size에 따라 px이 같이 변함)
   * - px: paneSizesPx로 고정 폭 저장/복원 (window resize와 무관하게 px 유지)
   */
  saveMode?: "ratio" | "px";
  minPaneRatio?: number;
  /**
   * pane 별 최소 크기(px)
   * - isVertical=false(가로 분할)일 때: minWidth
   * - isVertical=true(세로 분할)일 때: minHeight
   * - 배열 길이는 panes.length 와 같아야 적용됨
   */
  minPaneSizesPx?: number[];
  /**
   * pane 별 최대 크기(px)
   * - isVertical=false(가로 분할)일 때: maxWidth
   * - isVertical=true(세로 분할)일 때: maxHeight
   * - 배열 길이는 panes.length 와 같아야 적용됨
   */
  maxPaneSizesPx?: number[];
  initialRatios?: number[];
  /**
   * 저장된 비율이 없을 때 적용할 pane 별 초기 크기(px)
   * - isVertical=false(가로 분할)일 때: width
   * - isVertical=true(세로 분할)일 때: height
   * - 배열 길이는 panes.length 와 같아야 적용됨
   *
   * NOTE: container size를 알아야 하므로 마운트 이후에 비율로 변환해 적용됨.
   */
  initialPaneSizesPx?: number[];
  onResizeEnd?: (ratios: number[]) => void;
  gap?: number;
  testId?: string; // E2E 테스트용 data-testid
}

interface ResizerProps {
  isVertical: boolean;
  isHideBorder: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  size: number;
}

function Resizer({ isVertical, isHideBorder, onMouseDown, size }: ResizerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const resizerStyle: React.CSSProperties = {
    [isVertical ? "height" : "width"]: size,
    cursor: isVertical ? "row-resize" : "col-resize",
    backgroundColor: "transparent",
    position: "relative",
    flex: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Calculate padding to center the 1px line
  // If line is 1px, we need (size - 1) / 2 padding on each side
  const checkSize = Math.max(1, size);
  const paddingValue = (checkSize - 1) / 2;

  const lineContainerStyle: React.CSSProperties = {
    height: "100%",
    width: "100%",
    backgroundColor: "transparent",
    padding: isVertical
      ? `${paddingValue}px 0`
      : `0 ${paddingValue}px`,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const lineStyle: React.CSSProperties = {
    height: "100%",
    width: "100%",
    backgroundColor: isHovered
      ? "royalblue"
      : isHideBorder
        ? "transparent"
        : "var(--border)",
  };

  return (
    <div
      style={resizerStyle}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={lineContainerStyle}>
        <div style={lineStyle} />
      </div>
    </div>
  );
}

export default function MySplitPane({
  splitPaneId,
  isVertical = true,
  isHideBorder = false,
  panes,
  saveMode = "ratio",
  minPaneRatio = 0,
  minPaneSizesPx,
  maxPaneSizesPx,
  initialRatios,
  initialPaneSizesPx,
  onResizeEnd,
  gap = 5,
  testId,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const saveSettingMutation = useCreateOrUpdateSetting();
  const hasUserResizedRef = useRef(false);
  const isPxMode = saveMode === "px";
  const pxFixedPaneIndex = 0; // 현재 px 모드는 "왼쪽(첫 번째) pane 고정" 용도로만 사용
  const [containerWidthPx, setContainerWidthPx] = useState<number>(0);

  const [fixedSizePx, setFixedSizePx] = useState<number | null>(() => {
    if (!isPxMode) return null;

    const state = useSettingsStore.getState();
    const savedSetting = state.getSettingsByCategoryAndPageContext(
      SPLIT_PANE_SETTINGS.category,
      splitPaneId
    );
    const savedFixedSize = savedSetting?.settings?.fixedSizePx;
    if (Number.isFinite(Number(savedFixedSize)) && Number(savedFixedSize) >= 0) {
      return Number(savedFixedSize);
    }

    // legacy: paneSizesPx[0]를 fixed로 간주
    const savedSizes = savedSetting?.settings?.paneSizesPx;
    if (savedSizes && Array.isArray(savedSizes) && savedSizes.length >= 1) {
      const first = Number(savedSizes[0]);
      if (Number.isFinite(first) && first >= 0) return first;
    }

    if (initialPaneSizesPx && initialPaneSizesPx.length === panes.length) {
      const first = Number(initialPaneSizesPx[pxFixedPaneIndex]);
      return Number.isFinite(first) ? Math.max(0, first) : null;
    }

    return null;
  });

  const [ratios, setRatios] = useState(() => {
    if (isPxMode) {
      // px 모드에서는 ratio state는 기본값으로만 유지 (렌더에는 사용되지 않음)
      return Array(panes.length).fill(1 / panes.length);
    }

    // Settings store에서 저장된 비율 가져오기
    const state = useSettingsStore.getState();
    const savedSetting = state.getSettingsByCategoryAndPageContext(
      SPLIT_PANE_SETTINGS.category,
      splitPaneId
    );
    const savedRatios = savedSetting?.settings?.ratios;

    if (savedRatios && Array.isArray(savedRatios) && savedRatios.length === panes.length) {
      return savedRatios;
    }

    // 저장된 값이 없으면 initialRatios 사용
    if (initialRatios && initialRatios.length === panes.length) {
      return initialRatios;
    }

    // 기본적으로 동일한 비율로 분할
    return Array(panes.length).fill(1 / panes.length);
  });
  const [dragging, setDragging] = useState(false);

  const [activeDividerIndex, setActiveDividerIndex] = useState<number | null>(
    null
  );

  const getMinRatioByIndex = useCallback(
    (index: number, totalSize: number) => {
      const minByRatio = minPaneRatio;
      const minPx =
        minPaneSizesPx && minPaneSizesPx.length === panes.length
          ? minPaneSizesPx[index]
          : undefined;
      const minByPx =
        typeof minPx === "number" && Number.isFinite(minPx) && minPx > 0 && totalSize > 0
          ? minPx / totalSize
          : 0;
      return Math.max(minByRatio, minByPx);
    },
    [minPaneRatio, minPaneSizesPx, panes.length]
  );

  const applyInitialPxRatiosIfNeeded = useCallback(() => {
    if (!containerRef.current) return;
    if (!initialPaneSizesPx || initialPaneSizesPx.length !== panes.length) return;
    if (hasUserResizedRef.current) return;
    if (isPxMode) return; // px 모드에서는 비율로 변환하지 않음

    const state = useSettingsStore.getState();
    const savedSetting = state.getSettingsByCategoryAndPageContext(
      SPLIT_PANE_SETTINGS.category,
      splitPaneId
    );
    const savedRatios = savedSetting?.settings?.ratios;
    const hasSavedRatios =
      savedRatios && Array.isArray(savedRatios) && savedRatios.length === panes.length;
    if (hasSavedRatios) return;

    const rect = containerRef.current.getBoundingClientRect();
    const totalSize = isVertical ? rect.height : rect.width;
    if (!Number.isFinite(totalSize) || totalSize <= 0) return;

    const pxSizes = initialPaneSizesPx.map((v) =>
      Number.isFinite(v) ? Math.max(0, v) : 0
    );
    const rawRatios = pxSizes.map((px) => px / totalSize);

    // sum을 1로 맞추기: 마지막 pane을 remainder로 채움
    const sumExceptLast = rawRatios
      .slice(0, rawRatios.length - 1)
      .reduce((acc, r) => acc + r, 0);
    const nextRatios = [...rawRatios];
    if (nextRatios.length >= 2) {
      nextRatios[nextRatios.length - 1] = Math.max(0, 1 - sumExceptLast);
    }

    // 최소 사이즈/비율을 고려해 클램프 (2-pane 케이스 우선)
    if (nextRatios.length === 2) {
      const min0 = getMinRatioByIndex(0, totalSize);
      const min1 = getMinRatioByIndex(1, totalSize);
      let r0 = nextRatios[0] ?? 0.5;
      r0 = Math.max(min0, r0);
      r0 = Math.min(1 - min1, r0);
      const r1 = Math.max(min1, 1 - r0);
      setRatios([Number(r0.toFixed(3)), Number(r1.toFixed(3))]);
      return;
    }

    // n-pane 케이스: 최소 비율만 적용하고 sum이 1이 되도록 정규화
    const clamped = nextRatios.map((r, idx) => {
      const minR = getMinRatioByIndex(idx, totalSize);
      return Math.max(minR, r);
    });
    const sum = clamped.reduce((acc, r) => acc + r, 0);
    if (sum > 0) {
      setRatios(clamped.map((r) => Number((r / sum).toFixed(3))));
    }
  }, [getMinRatioByIndex, initialPaneSizesPx, isVertical, panes.length, splitPaneId]);

  const calculateRatios = useCallback(
    (clientX: number, clientY: number, dividerIndex: number): number[] => {
      if (!containerRef.current) return ratios;
      if (isPxMode) return ratios;

      const rect = containerRef.current.getBoundingClientRect();
      const totalSize = isVertical ? rect.height : rect.width;
      const mousePosition = isVertical
        ? clientY - rect.top
        : clientX - rect.left;

      // 현재 divider의 위치를 기준으로 이전 패널과 다음 패널의 비율을 계산
      const newRatios = [...ratios];
      const currentRatio = mousePosition / totalSize;

      // 이전 패널들의 총 비율
      const prevTotalRatio = ratios
        .slice(0, dividerIndex)
        .reduce((sum: number, ratio: number) => sum + ratio, 0);
      // 다음 패널들의 총 비율
      const nextTotalRatio = ratios
        .slice(dividerIndex + 2)
        .reduce((sum: number, ratio: number) => sum + ratio, 0);

      // 현재 divider의 위치에 따른 새로운 비율 계산
      const newCurrentRatio = currentRatio - prevTotalRatio;
      const newNextRatio = 1 - currentRatio - nextTotalRatio;

      // 최소 비율 제한
      const minCurrent = getMinRatioByIndex(dividerIndex, totalSize);
      const minNext = getMinRatioByIndex(dividerIndex + 1, totalSize);

      if (newCurrentRatio >= minCurrent && newNextRatio >= minNext) {
        newRatios[dividerIndex] = newCurrentRatio;
        newRatios[dividerIndex + 1] = newNextRatio;
      }

      return newRatios.map((ratio) => Number(ratio.toFixed(3)));
    },
    [isVertical, ratios, getMinRatioByIndex, isPxMode]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent, dividerIndex: number) => {
      setDragging(true);
      setActiveDividerIndex(dividerIndex);
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || activeDividerIndex === null) return;
      // px 모드: 드래그 중에도 고정 폭을 즉시 반영
      if (isPxMode && !isVertical && panes.length === 2 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const totalSize = rect.width;
        const mousePosition = e.clientX - rect.left;
        const min0 =
          minPaneSizesPx && minPaneSizesPx.length === 2
            ? Math.max(0, minPaneSizesPx[0] ?? 0)
            : 0;
        const min1 =
          minPaneSizesPx && minPaneSizesPx.length === 2
            ? Math.max(0, minPaneSizesPx[1] ?? 0)
            : 0;
        const max0 =
          maxPaneSizesPx && maxPaneSizesPx.length === 2
            && typeof maxPaneSizesPx[0] === "number" && Number.isFinite(maxPaneSizesPx[0]!)
            ? maxPaneSizesPx[0]!
            : Infinity;

        let left = Math.max(min0, mousePosition);
        left = Math.min(totalSize - min1, left);
        left = Math.min(max0, left);
        setFixedSizePx(Number(left.toFixed(0)));
        return;
      }

      const newRatios = calculateRatios(e.clientX, e.clientY, activeDividerIndex);
      setRatios(newRatios);
    },
    [dragging, activeDividerIndex, calculateRatios, isPxMode, isVertical, panes.length, minPaneSizesPx, maxPaneSizesPx]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragging || activeDividerIndex === null) return;

      // px 모드 (현재는 2-pane + 가로 분할에서만 지원)
      if (isPxMode && !isVertical && panes.length === 2 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const totalSize = rect.width;
        const mousePosition = e.clientX - rect.left;

        const min0 =
          minPaneSizesPx && minPaneSizesPx.length === 2 ? Math.max(0, minPaneSizesPx[0] ?? 0) : 0;
        const min1 =
          minPaneSizesPx && minPaneSizesPx.length === 2 ? Math.max(0, minPaneSizesPx[1] ?? 0) : 0;
        const max0 =
          maxPaneSizesPx && maxPaneSizesPx.length === 2
            && typeof maxPaneSizesPx[0] === "number" && Number.isFinite(maxPaneSizesPx[0]!)
            ? maxPaneSizesPx[0]!
            : Infinity;

        let left = Math.max(min0, mousePosition);
        // 오른쪽 pane의 min을 보장해야 한다면 여기서 제한
        left = Math.min(totalSize - min1, left);
        left = Math.min(max0, left);
        const finalFixed = Number(left.toFixed(0));

        setFixedSizePx(finalFixed);
        setDragging(false);
        setActiveDividerIndex(null);
        hasUserResizedRef.current = true;

        useSettingsStore.getState().updateSettingLocally({
          scope: SPLIT_PANE_SETTINGS.scope,
          category: SPLIT_PANE_SETTINGS.category,
          pageContext: splitPaneId,
          settings: { fixedSizePx: finalFixed },
        });

        const existingTimer = saveRatiosTimers.get(splitPaneId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          saveSettingMutation.mutate(
            {
              scope: SPLIT_PANE_SETTINGS.scope,
              category: SPLIT_PANE_SETTINGS.category,
              pageContext: splitPaneId,
              settings: { fixedSizePx: finalFixed },
            },
            {
              onError: (error) => {
                console.error("[MySplitPane] px 저장 실패:", error);
              },
            }
          );
          saveRatiosTimers.delete(splitPaneId);
        }, 500);

        saveRatiosTimers.set(splitPaneId, timer);
        if (onResizeEnd) onResizeEnd([finalFixed / Math.max(1, totalSize), 1 - finalFixed / Math.max(1, totalSize)]);
        return;
      }

      const finalRatios = calculateRatios(e.clientX, e.clientY, activeDividerIndex);
      setDragging(false);
      setActiveDividerIndex(null);
      hasUserResizedRef.current = true;

      // Settings store 즉시 업데이트 (다른 곳에서 참조할 때 최신 값 사용)
      useSettingsStore.getState().updateSettingLocally({
        scope: SPLIT_PANE_SETTINGS.scope,
        category: SPLIT_PANE_SETTINGS.category,
        pageContext: splitPaneId,
        settings: { ratios: finalRatios },
      });

      // 기존 타이머 클리어
      const existingTimer = saveRatiosTimers.get(splitPaneId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // 500ms debounce 후 API로 저장
      const timer = setTimeout(() => {
        saveSettingMutation.mutate(
          {
            scope: SPLIT_PANE_SETTINGS.scope,
            category: SPLIT_PANE_SETTINGS.category,
            pageContext: splitPaneId,
            settings: { ratios: finalRatios },
          },
          {
            onError: (error) => {
              console.error("[MySplitPane] 비율 저장 실패:", error);
            },
          }
        );

        saveRatiosTimers.delete(splitPaneId);
      }, 500);

      saveRatiosTimers.set(splitPaneId, timer);

      if (onResizeEnd) onResizeEnd(finalRatios);
    },
    [
      dragging,
      activeDividerIndex,
      calculateRatios,
      splitPaneId,
      onResizeEnd,
      saveSettingMutation,
      isPxMode,
      isVertical,
      panes.length,
      minPaneSizesPx,
      maxPaneSizesPx,
    ]
  );

  // Settings store에서 해당 splitPaneId의 설정을 구독
  // (강새로고침 시 API 응답이 늦게 도착해도 반영되도록)
  const savedSettingFromStore = useSettingsStore(
    useCallback(
      (s: { settings: any[] }) =>
        s.settings.find(
          (item: any) =>
            item.category === SPLIT_PANE_SETTINGS.category &&
            item.pageContext === splitPaneId
        ),
      [splitPaneId]
    )
  );

  // splitPaneId가 변경될 때만 저장된 비율 불러오기
  // initialRatios와 ratios.length를 의존성에서 제외하여 불필요한 재실행 방지
  useEffect(() => {
    // px 모드: 저장된 paneSizesPx를 splitPaneId 변경 시 반영
    if (isPxMode) {
      const state = useSettingsStore.getState();
      const savedSetting = state.getSettingsByCategoryAndPageContext(
        SPLIT_PANE_SETTINGS.category,
        splitPaneId
      );
      const savedFixedSize = savedSetting?.settings?.fixedSizePx;
      if (Number.isFinite(Number(savedFixedSize)) && Number(savedFixedSize) >= 0) {
        setFixedSizePx(Number(savedFixedSize));
        return;
      }

      // legacy: paneSizesPx[0]
      const savedSizes = savedSetting?.settings?.paneSizesPx;
      if (savedSizes && Array.isArray(savedSizes) && savedSizes.length >= 1) {
        const first = Number(savedSizes[0]);
        if (Number.isFinite(first) && first >= 0) {
          setFixedSizePx(first);
          return;
        }
      }

      if (initialPaneSizesPx && initialPaneSizesPx.length === panes.length) {
        const first = Number(initialPaneSizesPx[pxFixedPaneIndex]);
        setFixedSizePx(Number.isFinite(first) ? Math.max(0, first) : null);
      } else {
        setFixedSizePx(null);
      }
      return;
    }

    const state = useSettingsStore.getState();
    const savedSetting = state.getSettingsByCategoryAndPageContext(
      SPLIT_PANE_SETTINGS.category,
      splitPaneId
    );
    const savedRatios = savedSetting?.settings?.ratios;

    if (savedRatios && Array.isArray(savedRatios) && savedRatios.length === panes.length) {
      setRatios(savedRatios);
      return;
    }

    // 저장된 값이 없으면 initialRatios 또는 기본값 사용
    if (initialRatios && initialRatios.length === panes.length) {
      setRatios(initialRatios);
    } else {
      // pane 개수에 맞게 동일한 비율로 분할
      const defaultRatios = Array(panes.length).fill(1 / panes.length);
      setRatios(defaultRatios);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitPaneId]);

  // Settings store가 늦게 로드되었을 때(강새로고침 등) 저장된 값으로 갱신
  // - 유저가 이미 직접 리사이즈한 경우에는 덮어쓰지 않음
  useEffect(() => {
    if (hasUserResizedRef.current) return;
    if (!savedSettingFromStore?.settings) return;

    if (isPxMode) {
      const savedFixedSize = savedSettingFromStore.settings.fixedSizePx;
      if (Number.isFinite(Number(savedFixedSize)) && Number(savedFixedSize) >= 0) {
        // 이미 동일한 값이면 불필요한 업데이트 방지
        setFixedSizePx((prev) => {
          const next = Number(savedFixedSize);
          return prev === next ? prev : next;
        });
        return;
      }

      // legacy: paneSizesPx[0]
      const savedSizes = savedSettingFromStore.settings.paneSizesPx;
      if (savedSizes && Array.isArray(savedSizes) && savedSizes.length >= 1) {
        const first = Number(savedSizes[0]);
        if (Number.isFinite(first) && first >= 0) {
          setFixedSizePx((prev) => (prev === first ? prev : first));
          return;
        }
      }
    } else {
      const savedRatios = savedSettingFromStore.settings.ratios;
      if (savedRatios && Array.isArray(savedRatios) && savedRatios.length === panes.length) {
        // 값이 동일하면 새 배열 참조를 만들지 않아 불필요한 리렌더 방지
        setRatios((prev) => {
          const isSame =
            prev.length === savedRatios.length &&
            prev.every((v, i) => v === savedRatios[i]);
          return isSame ? prev : savedRatios;
        });
      }
    }
  }, [savedSettingFromStore, isPxMode, panes.length]);

  // 저장된 비율이 없을 때, initialPaneSizesPx(픽셀) 기반으로 초기 비율 적용
  // + 컨테이너 리사이즈(윈도우 리사이즈 포함) 시에도 픽셀 폭을 유지하도록 비율을 재계산
  useEffect(() => {
    if (isPxMode) return; // px 모드는 고정 폭이므로 ratio 재계산 불필요
    applyInitialPxRatiosIfNeeded();
  }, [applyInitialPxRatiosIfNeeded]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!initialPaneSizesPx || initialPaneSizesPx.length !== panes.length) return;
    if (isPxMode) return; // px 모드는 고정 폭이므로 observer 불필요

    const el = containerRef.current;
    let rafId = 0;

    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        applyInitialPxRatiosIfNeeded();
      });
    };

    // ResizeObserver 우선 사용 (가능한 환경)
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => schedule());
      observer.observe(el);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }

    // Fallback: window resize
    const onResize = () => schedule();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [applyInitialPxRatiosIfNeeded, initialPaneSizesPx, panes.length, isPxMode]);

  // px 모드: 컨테이너 크기 변경(윈도우 리사이즈/상위 레이아웃 변경) 시에도
  // 고정 pane 폭은 유지하되, 우측 pane이 완전히 0이 되지 않도록 동적으로 clamp 하기 위해 width 추적
  useEffect(() => {
    if (!containerRef.current) return;
    if (!isPxMode) return;
    if (isVertical) return; // 현재 px 모드는 가로 분할(좌/우)만 지원
    if (panes.length !== 2) return;

    const el = containerRef.current;
    let rafId = 0;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(0, rect.width);
      setContainerWidthPx((prev) => (prev === w ? prev : w));
    };

    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    schedule();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => schedule());
      observer.observe(el);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }

    const onResize = () => schedule();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [isPxMode, isVertical, panes.length]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
    return undefined;
  }, [dragging, onMouseMove, onMouseUp]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    height: "100%",
    width: "100%",
    minWidth: "0",
    boxSizing: "border-box",
    userSelect: "none",
    [isVertical ? "minHeight" : "minWidth"]: 0,
  };

  const paneStyle = (index: number): React.CSSProperties => {
    const isPxTwoPaneHorizontal =
      isPxMode && fixedSizePx !== null && !isVertical && panes.length === 2;

    // 컨테이너가 너무 작아졌을 때도 우측 pane(min1)을 보장하기 위해 fixed 폭을 clamp
    const min0 =
      !isVertical &&
        minPaneSizesPx &&
        minPaneSizesPx.length === 2 &&
        typeof minPaneSizesPx[0] === "number" &&
        Number.isFinite(minPaneSizesPx[0]!)
        ? Math.max(0, minPaneSizesPx[0]!)
        : 0;
    const min1 =
      !isVertical &&
        minPaneSizesPx &&
        minPaneSizesPx.length === 2 &&
        typeof minPaneSizesPx[1] === "number" &&
        Number.isFinite(minPaneSizesPx[1]!)
        ? Math.max(0, minPaneSizesPx[1]!)
        : 0;

    const max0Prop =
      !isVertical &&
        maxPaneSizesPx &&
        maxPaneSizesPx.length === 2 &&
        typeof maxPaneSizesPx[0] === "number" &&
        Number.isFinite(maxPaneSizesPx[0]!)
        ? maxPaneSizesPx[0]!
        : Infinity;
    const maxLeft =
      containerWidthPx > 0
        ? Math.min(max0Prop, Math.max(min0, containerWidthPx - min1))
        : max0Prop < Infinity
          ? max0Prop
          : undefined;
    const effectiveFixedSizePx =
      maxLeft == null
        ? Math.max(0, fixedSizePx ?? 0)
        : Math.min(Math.max(min0, fixedSizePx ?? 0), maxLeft);

    return {
      ...(isPxTwoPaneHorizontal
        ? index === pxFixedPaneIndex
          ? {
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: `${Math.max(0, effectiveFixedSizePx)}px`,
          }
          : { flexGrow: 1, flexShrink: 1, flexBasis: 0 }
        : { flexGrow: ratios[index], flexShrink: 1, flexBasis: 0 }),
      minWidth:
        !isVertical &&
          minPaneSizesPx &&
          minPaneSizesPx.length === panes.length &&
          typeof minPaneSizesPx[index] === "number" &&
          Number.isFinite(minPaneSizesPx[index]!)
          ? Math.max(0, minPaneSizesPx[index]!)
          : 0,
      minHeight:
        isVertical &&
          minPaneSizesPx &&
          minPaneSizesPx.length === panes.length &&
          typeof minPaneSizesPx[index] === "number" &&
          Number.isFinite(minPaneSizesPx[index]!)
          ? Math.max(0, minPaneSizesPx[index]!)
          : 0,
      maxWidth:
        !isVertical &&
          maxPaneSizesPx &&
          maxPaneSizesPx.length === panes.length &&
          typeof maxPaneSizesPx[index] === "number" &&
          Number.isFinite(maxPaneSizesPx[index]!) &&
          maxPaneSizesPx[index]! > 0
          ? maxPaneSizesPx[index]!
          : undefined,
      maxHeight:
        isVertical &&
          maxPaneSizesPx &&
          maxPaneSizesPx.length === panes.length &&
          typeof maxPaneSizesPx[index] === "number" &&
          Number.isFinite(maxPaneSizesPx[index]!) &&
          maxPaneSizesPx[index]! > 0
          ? maxPaneSizesPx[index]!
          : undefined,
      overflow: "hidden",
    };
  };

  return (
    <div ref={containerRef} style={containerStyle} data-testid={testId}>
      {panes.map((pane, index) => (
        <React.Fragment key={index}>
          <div style={paneStyle(index)}>{pane}</div>
          {index < panes.length - 1 && (
            <Resizer
              isVertical={isVertical}
              isHideBorder={isHideBorder}
              onMouseDown={(e) => onMouseDown(e, index)}
              size={gap}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
