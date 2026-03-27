// @ts-nocheck
import * as React from "react";
import { DockContext, DockContextType, PanelData } from "./DockData";
import {
  createPopoutChannel,
  loadPopoutGeometry,
  addOpenPopout,
  removeOpenPopout,
  loadDockOrigin,
  removeDockOrigin,
  type PopoutMessage,
} from "@/lib/popout-channel";

/** dockbox 트리에서 첫 번째 PanelData를 재귀적으로 찾기 */
function findFirstPanel(box: any): any | null {
  if (!box?.children) return null;
  for (const child of box.children) {
    if (child.tabs) return child; // PanelData
    const found = findFirstPanel(child);
    if (found) return found;
  }
  return null;
}

interface Props {
  panelData: PanelData;
}

/**
 * WindowPanel: rc-dock의 "new-window" 방향으로 이동된 패널을 처리.
 * window.open()으로 /popout/[tabId] 페이지를 열고,
 * BroadcastChannel로 자식 창과 통신한다.
 */
export class WindowPanel extends React.PureComponent<Props, any> {
  static contextType = DockContextType;
  context!: DockContext;

  _window: Window | null = null;
  _channel: BroadcastChannel | null = null;

  getActiveTab() {
    const { panelData } = this.props;
    return (
      panelData.tabs.find((t) => t.id === panelData.activeId) ||
      panelData.tabs[0]
    );
  }

  componentDidMount() {
    const tab = this.getActiveTab();
    if (!tab?.id) return;

    const tabId = tab.id;

    // BroadcastChannel 설정
    this._channel = createPopoutChannel();
    this._channel.addEventListener("message", this.handleMessage);

    // 저장된 geometry로 창 열기
    const geo = loadPopoutGeometry(tabId);
    const features = geo
      ? `left=${geo.x},top=${geo.y},width=${geo.w},height=${geo.h},resizable=yes`
      : `width=800,height=600,resizable=yes`;

    this._window = window.open(`/popout/${tabId}`, `popout-${tabId}`, features);
    if (this._window) {
      addOpenPopout(tabId);
    } else {
      // 팝업 차단 시 탭을 레이아웃에서 제거
      console.warn("팝업이 차단되었습니다:", tabId);
      this.removeFromLayout();
    }
  }

  componentWillUnmount() {
    if (this._channel) {
      this._channel.removeEventListener("message", this.handleMessage);
      this._channel.close();
    }
  }

  handleMessage = (e: MessageEvent<PopoutMessage>) => {
    const tab = this.getActiveTab();
    if (!tab?.id) return;

    const msg = e.data;
    if (msg.type === "popout-closed" && msg.tabId === tab.id) {
      // 팝아웃이 어떤 방법으로든 닫히면 항상 원래 위치로 복귀
      this.redock();
    } else if (msg.type === "request-redock" && msg.tabId === tab.id) {
      this.redock();
    }
  };

  removeFromLayout() {
    const { panelData } = this.props;
    const tab = this.getActiveTab();
    if (tab?.id) {
      removeOpenPopout(tab.id);
    }
    for (const t of [...panelData.tabs]) {
      this.context.dockMove(t, null, "remove");
    }
  }

  redock() {
    const tab = this.getActiveTab();
    if (!tab?.id) return;
    removeOpenPopout(tab.id);

    // dock origin 로드 후 삭제 (원래 패널 위치 정보)
    const origin = loadDockOrigin(tab.id);
    removeDockOrigin(tab.id);

    // context(=DockLayout) 참조를 미리 캡처 (remove 후 unmount 되면 this.context가 무효화됨)
    const ctx = this.context as any;

    // windowbox에서 탭 제거
    const { panelData } = this.props;
    for (const t of [...panelData.tabs]) {
      ctx.dockMove(t, null, "remove");
    }

    // 현재 레이아웃에 탭을 다시 추가 (전체 스냅샷 복원 X → 다른 팝아웃에 영향 없음)
    const tabData = { ...tab };
    setTimeout(() => {
      // float 모드에서 팝아웃된 경우 → float으로 복귀
      if (origin?.mode === "float") {
        ctx.dockMove(tabData, null, "float");
        return;
      }
      // 1순위: 원래 패널이 아직 존재하면 거기에 추가
      if (origin?.panelId) {
        const targetPanel = ctx.find(origin.panelId);
        if (targetPanel && targetPanel.tabs) {
          ctx.dockMove(tabData, targetPanel, "middle");
          return;
        }
      }
      // 2순위: 형제 탭이 존재하는 패널을 찾아서 거기에 추가
      if (origin?.siblingTabIds?.length) {
        for (const siblingId of origin.siblingTabIds) {
          const sibling = ctx.find(siblingId);
          if (sibling) {
            // find가 TabData를 반환하면 parent가 PanelData
            const panel = sibling.tabs ? sibling : sibling.parent;
            if (panel) {
              ctx.dockMove(tabData, panel, "middle");
              return;
            }
          }
        }
      }
      // 3순위: dockbox의 첫 번째 패널에 추가
      const layout = ctx.getLayout?.();
      if (layout?.dockbox) {
        const firstPanel = findFirstPanel(layout.dockbox);
        if (firstPanel) {
          ctx.dockMove(tabData, firstPanel, "middle");
          return;
        }
      }
      // 최종 fallback
      ctx.dockMove(tabData, null, "right");
    }, 50);
  }

  render(): React.ReactNode {
    // WindowPanel은 실제 콘텐츠를 렌더링하지 않음 (자식 창에서 렌더링)
    return null;
  }
}
