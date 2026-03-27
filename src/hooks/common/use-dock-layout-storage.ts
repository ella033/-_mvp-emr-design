import { useState, useCallback, useRef, useEffect } from "react";
import {
  safeLocalStorage,
  safeJsonParse,
} from "@/components/yjg/common/util/ui-util";

interface UseDockLayoutStorageOptions {
  /** localStorage 키 */
  storageKey: string;
  /** 기본 레이아웃 (저장된 것이 없을 때 사용) */
  defaultLayout: any;
  /** 저장 debounce 시간 (ms), 기본값: 0 (즉시 저장) */
  debounceMs?: number;
}

interface UseDockLayoutStorageReturn {
  /** DockLayout에 전달할 레이아웃 (저장된 것 또는 기본값) */
  layout: any;
  /** DockLayout의 onLayoutChange에 전달할 핸들러 */
  handleLayoutChange: (
    newLayout: any,
    currentTabId?: string | null,
    direction?: string
  ) => void;
  /** 수동으로 레이아웃 저장 */
  saveLayout: (layout: any) => void;
  /** 저장된 레이아웃 초기화 (기본 레이아웃으로 복원) */
  resetLayout: () => void;
}

/**
 * DockLayout의 레이아웃을 localStorage에 저장/불러오는 훅
 *
 * @example
 * ```tsx
 * const { layout, handleLayoutChange } = useDockLayoutStorage({
 *   storageKey: "dock-layout-medical-page-V1",
 *   defaultLayout: baseDefaultLayout,
 * });
 *
 * return (
 *   <DockLayout
 *     defaultLayout={layout}
 *     onLayoutChange={handleLayoutChange}
 *     // ...other props
 *   />
 * );
 * ```
 */
export function useDockLayoutStorage({
  storageKey,
  defaultLayout,
  debounceMs = 0,
}: UseDockLayoutStorageOptions): UseDockLayoutStorageReturn {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 저장된 레이아웃 불러오기 (초기화 시 한 번만)
  const [layout] = useState<any>(() => {
    const savedLayout = safeLocalStorage.getItem(storageKey);
    if (savedLayout) {
      try {
        const parsed = safeJsonParse(savedLayout, null);
        if (parsed) {
          return parsed;
        }
      } catch (error) {
        console.error(
          `[useDockLayoutStorage] 레이아웃 불러오기 실패 (${storageKey}):`,
          error
        );
      }
    }
    return defaultLayout;
  });

  // 레이아웃 저장
  const saveLayout = useCallback(
    (layoutToSave: any) => {
      if (layoutToSave) {
        safeLocalStorage.setItem(storageKey, JSON.stringify(layoutToSave));
      }
    },
    [storageKey]
  );

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback(
    (newLayout: any, _currentTabId?: string | null, _direction?: string) => {
      if (!newLayout) return;

      // debounce 적용
      if (debounceMs > 0) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveLayout(newLayout);
        }, debounceMs);
      } else {
        // 즉시 저장
        saveLayout(newLayout);
      }
    },
    [saveLayout, debounceMs]
  );

  // 레이아웃 초기화
  const resetLayout = useCallback(() => {
    safeLocalStorage.removeItem(storageKey);
  }, [storageKey]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    layout,
    handleLayoutChange,
    saveLayout,
    resetLayout,
  };
}
