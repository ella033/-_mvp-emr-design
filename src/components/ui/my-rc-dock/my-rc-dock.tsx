"use client";

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { DockLayout } from "@/components/ui/my-rc-dock/rc-dock/DockLayout";
import { useRcDockStore } from "@/store/rc-dock-store";
import { setFloatPanelPosition } from "./my-rc-dock-util";
import { setPopoutManager } from "./my-rc-dock-tab";
import { usePopoutManager } from "@/hooks/use-popout-manager";

export interface MyRcDockHandle {
  /** DockLayout 인스턴스에 직접 접근 */
  getDockLayout: () => any;
  /** 레이아웃 로드 */
  loadLayout: (layout: any) => void;
  /** 탭 찾기 */
  find: (id: string) => any;
  /** 탭 업데이트 */
  updateTab: (id: string, tab: any, makeActive?: boolean) => void;
  /** 레이아웃 저장 (직렬화) */
  saveLayout: () => any;
}

interface MyRcDockProps {
  /** 기본 레이아웃 */
  defaultLayout: any;
  /** 탭 직렬화 함수 */
  saveTab?: (tabData: any) => any;
  /** 탭 역직렬화 함수 */
  loadTab?: (savedTab: any) => any;
  /** 레이아웃 변경 시 콜백 (서버 저장 등 외부 처리용) */
  onLayoutChange?: (newLayout: any) => void;
  /** 패널 그룹 설정 (panelExtra 버튼 등) */
  groups?: Record<string, any>;
  /** 추가 스타일 */
  style?: React.CSSProperties;
  /** 추가 클래스 */
  className?: string;
}

const MyRcDock = forwardRef<MyRcDockHandle, MyRcDockProps>(function MyRcDock(
  {
    defaultLayout,
    saveTab,
    loadTab,
    onLayoutChange,
    groups,
    style,
    className,
  },
  ref
) {
  const dockRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  // loadLayout 시 key를 변경하여 DockLayout 재마운트 (serializer 우회)
  const [layoutKey, setLayoutKey] = useState(0);
  // deep clone으로 원본 레이아웃 변형(mutation) 방지
  const [currentDefaultLayout, setCurrentDefaultLayout] = useState(() =>
    JSON.parse(JSON.stringify(defaultLayout))
  );

  // Zustand store에서 rc-dock ref 관리
  const { setActiveRcDockRef, clearActiveRcDockRef } = useRcDockStore();

  // 팝아웃 매니저: 자식 창 관리 (openPopoutWindow, isTabInPopout 제공)
  // 재독킹은 WindowPanel이 직접 처리하므로 여기서는 콜백 불필요
  const { openPopoutWindow, isTabInPopout } = usePopoutManager();

  // 팝아웃 매니저를 openTab에서 사용할 수 있도록 등록
  useEffect(() => {
    setPopoutManager({ openPopoutWindow, isTabInPopout });
    return () => setPopoutManager(null);
  }, [openPopoutWindow, isTabInPopout]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // rc-dock ref를 Zustand store에 등록 (layoutKey 변경 시 재등록)
  useEffect(() => {
    if (dockRef.current) {
      setActiveRcDockRef({ current: dockRef.current });
    }

    return () => {
      clearActiveRcDockRef();
    };
  }, [setActiveRcDockRef, clearActiveRcDockRef, layoutKey]);

  // 외부에서 접근할 수 있도록 imperative handle 노출
  useImperativeHandle(ref, () => ({
    getDockLayout: () => dockRef.current,
    loadLayout: (layout: any) => {
      // defaultLayout 형식(패널에 id 없음)도 지원하기 위해
      // DockLayout을 재마운트하여 serializer를 우회
      // deep clone으로 원본 레이아웃 객체 변형 방지
      try {
        setCurrentDefaultLayout(JSON.parse(JSON.stringify(layout)));
      } catch (error) {
        console.error("[MyRcDock] 레이아웃 파싱 실패, 기본 레이아웃으로 폴백:", error);
        setCurrentDefaultLayout(JSON.parse(JSON.stringify(defaultLayout)));
      }
      setLayoutKey((prev) => prev + 1);
    },
    find: (id: string) => {
      return dockRef.current?.find(id);
    },
    updateTab: (id: string, tab: any, makeActive?: boolean) => {
      dockRef.current?.updateTab(id, tab, makeActive);
    },
    saveLayout: () => {
      return dockRef.current?.saveLayout();
    },
  }), []);

  const handleLayoutChange = useCallback((newLayout: any) => {
    if (!dockRef.current) return;

    // Float 패널의 위치/크기를 개별적으로 저장
    try {
      const layout = dockRef.current.getLayout();
      if (layout && layout.floatbox && layout.floatbox.children) {
        for (const child of layout.floatbox.children) {
          if ("tabs" in child && child.tabs && child.tabs.length > 0) {
            for (const tab of child.tabs) {
              if (tab.id && child.x !== undefined && child.y !== undefined) {
                setFloatPanelPosition(tab.id, {
                  x: child.x,
                  y: child.y,
                  w: child.w || 400,
                  h: child.h || 300,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("float 패널 위치 저장 실패:", error);
    }

    // 외부 onLayoutChange 콜백 호출 (서버 저장 등)
    // DockLayout.onLayoutChange가 이미 직렬화한 newLayout을 사용 (saveLayout() 재호출 시 state 업데이트 전이라 이전 상태가 반환됨)
    if (onLayoutChange && newLayout) {
      try {
        onLayoutChange(newLayout);
      } catch (error) {
        console.error("레이아웃 변경 콜백 실패:", error);
      }
    }
  }, [onLayoutChange]);

  if (!mounted) {
    return null;
  }

  return (
    <div className={className} style={{ width: "100%", height: "100%", position: "relative", ...style }}>
      <DockLayout
        key={layoutKey}
        ref={dockRef}
        defaultLayout={currentDefaultLayout}
        saveTab={saveTab}
        loadTab={loadTab}
        groups={groups}
        style={{
          width: "100%",
          height: "100%",
        }}
        onLayoutChange={handleLayoutChange}
      />
    </div>
  );
});

export default MyRcDock;
