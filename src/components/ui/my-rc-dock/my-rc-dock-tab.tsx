import { getFloatPanelPosition } from "./my-rc-dock-util";

// dockbox에서 첫 번째 패널을 찾는 헬퍼 함수
function findFirstPanel(box: any): any {
  if (!box || !box.children || box.children.length === 0) {
    return null;
  }

  for (const child of box.children) {
    if (child.tabs) {
      // PanelData
      return child;
    } else if (child.children) {
      // BoxData - 재귀적으로 탐색
      const panel = findFirstPanel(child);
      if (panel) {
        return panel;
      }
    }
  }

  return null;
}

// 현재 포커스가 있는 패널을 찾는 헬퍼 함수
// data-focused="true" 속성이 있는 패널을 찾습니다
function findFocusedPanel(
  dockLayout: any
): { panelData: any; dockId: string } | null {
  try {
    // 방법 1: data-focused="true" 속성이 있는 패널 찾기 (가장 확실한 방법)
    const focusedPanel = document.querySelector(
      '.dock-panel[data-focused="true"]'
    ) as HTMLElement;

    if (focusedPanel) {
      const dockId = focusedPanel.getAttribute("data-dockid");
      if (dockId) {
        try {
          const panelData = dockLayout.find(dockId);
          if (panelData && panelData.tabs) {
            return { panelData, dockId };
          }
        } catch (findError) {
          console.warn(`패널 데이터 찾기 실패 (${dockId}):`, findError);
        }
      }
    }

    // 방법 2: activeElement를 포함하는 패널 찾기 (fallback)
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      const dockPanels = document.querySelectorAll(".dock-panel");
      for (const panel of dockPanels) {
        const panelElement = panel as HTMLElement;

        // activeElement가 이 패널 안에 있는지 확인
        if (panelElement.contains(activeElement)) {
          const dockId = panelElement.getAttribute("data-dockid");
          if (dockId) {
            try {
              const panelData = dockLayout.find(dockId);
              if (panelData && panelData.tabs) {
                return { panelData, dockId };
              }
            } catch (findError) {
              console.warn(`패널 데이터 찾기 실패 (${dockId}):`, findError);
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.warn("포커스된 패널 찾기 실패:", error);
    return null;
  }
}

// 팝아웃 매니저 (외부에서 주입)
let _popoutManager: {
  openPopoutWindow: (tabId: string) => void;
  isTabInPopout: (tabId: string) => boolean;
} | null = null;

/** 팝아웃 매니저 등록 (MyRcDock에서 호출) */
export const setPopoutManager = (manager: typeof _popoutManager) => {
  _popoutManager = manager;
};

// 공통 탭 열기 유틸리티 함수
export const openTab = (
  tabId: string,
  activeRcDockRef: React.RefObject<any>,
  loadTabFn: (savedTab: string | { id: string }) => any,
  source: string = "unknown",
  mode: "float" | "dock" | "popout" = "dock",
  restoreFloatIfMinimized?: boolean
) => {
  try {
    if (activeRcDockRef && activeRcDockRef.current) {
      const dockLayout = activeRcDockRef.current as any;
      const tabData = loadTabFn(tabId);

      if (tabData) {
        // popout 모드: 새 브라우저 창으로 열기
        if (mode === "popout") {
          if (_popoutManager?.isTabInPopout(tabId)) {
            _popoutManager.openPopoutWindow(tabId); // 이미 열려있으면 focus
            return;
          }
          // 기존 dock/float에 있으면 제거
          const existingTab = dockLayout.find(tabId);
          if (existingTab) {
            dockLayout.dockMove(existingTab, null, "remove");
          }
          _popoutManager?.openPopoutWindow(tabId);
          return;
        }

        const existingTab = dockLayout.find(tabId);

        // 팝아웃에 열려있는 탭이면 focus
        if (_popoutManager?.isTabInPopout(tabId)) {
          _popoutManager.openPopoutWindow(tabId);
          return;
        }

        if (existingTab) {
          // 새 창(window)에 열려있는 탭이면 제거 후 다시 dock에 추가
          const tabParent = (existingTab as any).parent;
          const isInWindow = tabParent?.parent?.mode === "window";
          if (isInWindow) {
            dockLayout.dockMove(existingTab, null, "remove");
            // 제거 후 아래 else 블록으로 진행하기 위해 재귀 호출
            openTab(tabId, activeRcDockRef, loadTabFn, source, mode, restoreFloatIfMinimized);
            return;
          }

          // 사이드바 등에서 호출 시: Float 최소화 상태면 먼저 복원
          if (restoreFloatIfMinimized) {
            const panel =
              "tabs" in existingTab && Array.isArray((existingTab as { tabs?: unknown[] }).tabs)
                ? existingTab
                : (existingTab as { parent?: { parent?: { mode?: string }; minimized?: boolean } }).parent;
            const p = panel as { parent?: { mode?: string }; minimized?: boolean } | undefined;
            if (p?.parent?.mode === "float" && p.minimized) {
              dockLayout.dockMove(panel, null, "restore");
            }
          }
          // 이미 열려있는 탭이면 맨 앞으로 가져오기
          dockLayout.dockMove(existingTab, null, "front");
        } else {
          if (mode === "float") {
            // float 모드로 추가 - 저장된 위치/크기 불러오기
            const savedPosition = getFloatPanelPosition(tabId);
            if (savedPosition) {
              // 저장된 위치/크기로 float 패널 생성
              dockLayout.dockMove(tabData, null, "float", {
                left: savedPosition.x,
                top: savedPosition.y,
                width: savedPosition.w,
                height: savedPosition.h,
              });
            } else {
              // 저장된 위치가 없으면 기본 위치로 생성
              dockLayout.dockMove(tabData, null, "float");
            }
          } else {
            // dock 모드: 먼저 포커스가 있는 패널 찾기
            const focusedPanel = findFocusedPanel(dockLayout);

            if (focusedPanel) {
              // 포커스가 있는 패널에 탭 추가
              dockLayout.dockMove(tabData, focusedPanel.panelData, "middle");
            } else {
              // 포커스가 있는 패널이 없으면 첫 번째 패널 찾기
              const layout = (dockLayout as any).getLayout?.();

              if (layout && layout.dockbox) {
                const firstPanel = findFirstPanel(layout.dockbox);

                if (firstPanel) {
                  // 첫 번째 패널에 탭 추가
                  dockLayout.dockMove(tabData, firstPanel, "middle");
                } else {
                  // 패널이 없으면 dockbox에 오른쪽으로 패널 추가
                  dockLayout.dockMove(tabData, null, "right");
                }
              } else {
                // layout을 가져올 수 없으면 오른쪽으로 추가
                dockLayout.dockMove(tabData, null, "right");
              }
            }
          }
        }

        // 탭에 포커스 주기 (약간의 지연 후 실행)
        setTimeout(() => {
          try {
            const dockPanels = document.querySelectorAll(".dock-panel");
            let targetPanel: HTMLElement | null = null;

            for (const panel of dockPanels) {
              const panelElement = panel as HTMLElement;
              const dockId = panelElement.getAttribute("data-dockid");

              if (dockId) {
                try {
                  const dl = activeRcDockRef.current as any;
                  if (dl) {
                    const panelData = dl.find(dockId);
                    if (panelData && panelData.activeId === tabId) {
                      targetPanel = panelElement;
                      break;
                    }
                  }
                } catch {
                  // dockLayout 접근 실패 시 무시
                }
              }
            }

            if (targetPanel) {
              targetPanel.setAttribute("tabindex", "0");
              targetPanel.focus();

              setTimeout(() => {
                if (document.activeElement !== targetPanel) {
                  targetPanel!.focus();
                }
              }, 10);
            }
          } catch (focusError) {
            console.warn(`[${source}] 포커스 설정 실패:`, focusError);
          }
        }, 100);
      }
    } else {
      console.error(`[${source}] 활성 rc-dock ref가 없습니다.`);
    }
  } catch (error) {
    console.error(`[${source}] 탭 처리 실패:`, error);
  }
};
