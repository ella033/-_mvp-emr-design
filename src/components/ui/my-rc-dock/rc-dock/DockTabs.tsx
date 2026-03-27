// @ts-nocheck
import * as React from "react";
import {
  DockContext,
  DockContextType,
  DropDirection,
  PanelData,
  TabData,
} from "./DockData";
import Tabs from "rc-tabs";
import * as DragManager from "./dragdrop/DragManager";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DockTabBar } from "./DockTabBar";
import DockTabNavList from "./DockTabNavList";
import DockTabPane from "./DockTabPane";
import { getFloatPanelSize } from "./Algorithm";
import { saveDockOrigin } from "@/lib/popout-channel";

import {
  XMarkIcon,
  EllipsisVerticalIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

/** React 19 호환 커스텀 드롭다운 (rc-dropdown 대체) */
function PanelDropdown({
  items,
  onSelect,
}: {
  items: { key: string; label: string }[];
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ESC 키 감지
  React.useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="dock-panel-ellipsis-btn"
        title="더보기"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <div className="flex items-center justify-center text-[var(--btn-ghost-text)] p-[2px] rounded-sm hover:bg-[var(--btn-ghost-hover)]">
          <EllipsisVerticalIcon className="w-[14px] h-[14px]" />
        </div>
      </div>
      {open && (
        <div className="dock-panel-dropdown" onClick={(e) => e.stopPropagation()}>
          {items.map((item) => (
            <div
              key={item.key}
              className="dock-panel-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item.key);
                setOpen(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function findParentPanel(element: HTMLElement | null): HTMLElement | null {
  for (let i = 0; i < 10; ++i) {
    if (!element) {
      return null;
    }
    if (element.classList.contains("dock-panel")) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

function isPopupDiv(r: HTMLDivElement): boolean {
  return (
    r == null ||
    r.parentElement?.tagName === "LI" ||
    r.parentElement?.parentElement?.tagName === "LI"
  );
}

export class TabCache {
  _ref: HTMLDivElement | null = null;
  getRef = (r: HTMLDivElement | null) => {
    if (!r || isPopupDiv(r)) {
      return;
    }
    this._ref = r;
  };

  _hitAreaRef: HTMLDivElement | null = null;
  getHitAreaRef = (r: HTMLDivElement | null) => {
    if (!r || isPopupDiv(r)) {
      return;
    }
    this._hitAreaRef = r;
  };

  data: TabData | null = null as any;
  context: DockContext;
  content: React.ReactElement | null = null as any;

  constructor(context: DockContext) {
    this.context = context;
  }

  setData(data: TabData) {
    if (data !== this.data) {
      this.data = data;
      this.content = this.render();
      return true;
    }
    return false;
  }

  onCloseClick = (e: React.MouseEvent) => {
    if (this.data) {
      this.context.dockMove(this.data, null, "remove");
    }
    e.stopPropagation();
  };

  onDragStart = (e: DragManager.DragState) => {
    if (!this.data || !this._ref) return;
    const panel = this.data.parent;
    if (!panel) return;
    if (panel?.parent?.mode === "float" && panel.tabs.length === 1) {
      // when it's the only tab in a float panel, skip this drag, let parent tab bar handle it
      return;
    }
    const panelElement = findParentPanel(this._ref);
    const tabGroup = this.context.getGroup(this.data.group || "");
    if (!panelElement) {
      return;
    }
    const [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup);

    e.setData(
      {
        tab: this.data,
        panelSize: [panelWidth, panelHeight],
        tabGroup: this.data.group || "",
      },
      this.context.getDockId()
    );
    e.startDrag(this._ref.parentElement || undefined, this._ref.parentElement || undefined);
  };
  onDragOver = (e: DragManager.DragState) => {
    if (!this.data || !this._hitAreaRef) return;
    const dockId = this.context.getDockId();
    const tab: TabData | undefined = DragManager.DragState.getData("tab", dockId);
    let panel: PanelData | undefined = DragManager.DragState.getData("panel", dockId);
    let group: string;
    if (tab) {
      panel = tab.parent;
      group = tab.group || "";
    } else {
      // drag whole panel
      if (!panel) {
        return;
      }
      if (panel?.panelLock) {
        e.reject();
        return;
      }
      group = panel.group || "";
    }
    const tabGroup = this.context.getGroup(group || "");
    if (group !== this.data.group) {
      e.reject();
    } else if (
      tabGroup?.floatable === "singleTab" &&
      this.data.parent?.parent?.mode === "float"
    ) {
      e.reject();
    } else if (tab && tab !== this.data) {
      const direction = this.getDropDirection(e);
      this.context.setDropRect(this._hitAreaRef, direction, this);
      e.accept("");
    } else if (panel && panel !== this.data.parent) {
      const direction = this.getDropDirection(e);
      this.context.setDropRect(this._hitAreaRef, direction, this);
      e.accept("");
    }
  };
  onDragLeave = (e: DragManager.DragState) => {
    this.context.setDropRect(null, "remove", this);
  };
  onDrop = (e: DragManager.DragState) => {
    if (!this.data) return;
    const dockId = this.context.getDockId();
    let panel: PanelData | undefined;
    const tab: TabData | undefined = DragManager.DragState.getData("tab", dockId);
    if (tab) {
      panel = tab.parent;
    } else {
      panel = DragManager.DragState.getData("panel", dockId);
    }
    if (tab && tab !== this.data) {
      const direction = this.getDropDirection(e);
      this.context.dockMove(tab, this.data, direction);
    } else if (panel && panel !== this.data.parent) {
      const direction = this.getDropDirection(e);
      this.context.dockMove(panel, this.data, direction);
    }
  };

  getDropDirection(e: DragManager.DragState): DropDirection {
    if (!this._hitAreaRef) return "after-tab";
    const rect = this._hitAreaRef.getBoundingClientRect();
    const hitAreaCenterX = rect.left + rect.width * 0.5;
    return e.clientX > hitAreaCenterX ? "after-tab" : "before-tab";
  }

  render(): React.ReactElement {
    if (!this.data) {
      return <div />;
    }
    let { id, title, content, closable, cached, parent } = this.data;
    let onDragStart: DragManager.DragHandler | undefined = this.onDragStart;
    let onDragOver: DragManager.DragHandler | undefined = this.onDragOver;
    let onDrop: DragManager.DropHandler | undefined = this.onDrop;
    let onDragLeave: DragManager.DragHandler | undefined = this.onDragLeave;
    if (parent?.parent?.mode === "window") {
      onDragStart = undefined;
      onDragOver = undefined;
      onDrop = undefined;
      onDragLeave = undefined;
    }
    if (typeof content === "function") {
      content = content(this.data);
    }
    const tab = (
      <DragDropDiv
        getRef={this.getRef}
        onDragStartT={onDragStart}
        role="tab"
        aria-selected={parent?.activeId === id}
        onDragOverT={onDragOver}
        onDropT={onDrop}
        onDragLeaveT={onDragLeave}
      >
        <div className="dock-tab-title">{title}</div>
        {closable ? (
          <div className="dock-tab-close-btn" onClick={this.onCloseClick}>
            <XMarkIcon className="w-[16px] h-[16px] hover:text-[var(--close-btn-hover)]" />
          </div>
        ) : null}
        <div className="dock-tab-hit-area" ref={this.getHitAreaRef} />
      </DragDropDiv>
    );

    return (
      <DockTabPane key={id} cacheId={id} cached={cached ?? false} tab={tab}>
        {content}
      </DockTabPane>
    );
  }

  destroy() {
    // place holder
  }
}

interface Props {
  panelData: PanelData;
  onPanelDragStart: DragManager.DragHandler;
  onPanelDragMove: DragManager.DragHandler;
  onPanelDragEnd: DragManager.DragHandler;
}

export class DockTabs extends React.PureComponent<Props> {
  static contextType = DockContextType;

  static readonly propKeys = ["group", "tabs", "activeId", "onTabChange"];

  context!: DockContext;
  _cache: Map<string, TabCache> = new Map();

  cachedTabs: TabData[] | undefined = undefined;

  updateTabs(tabs: TabData[]) {
    if (tabs === this.cachedTabs) {
      return;
    }
    this.cachedTabs = tabs;
    const newCache = new Map<string, TabCache>();
    let reused = 0;
    for (const tabData of tabs) {
      const { id } = tabData;
      if (!id) {
        continue;
      }
      if (this._cache.has(id)) {
        const tab = this._cache.get(id);
        if (tab) {
          newCache.set(id, tab);
          tab.setData(tabData);
          ++reused;
        }
      } else {
        const tab = new TabCache(this.context);
        newCache.set(id, tab);
        tab.setData(tabData);
      }
    }
    if (reused !== this._cache.size) {
      for (const [id, tab] of this._cache) {
        if (!newCache.has(id)) {
          tab.destroy();
        }
      }
    }
    this._cache = newCache;
  }

  onMaximizeClick = (e: React.MouseEvent) => {
    const { panelData } = this.props;
    this.context.dockMove(panelData, null, "maximize");
    e.stopPropagation();
  };
  onFloatMinimizeClick = (e: React.MouseEvent) => {
    const { panelData } = this.props;
    this.context.dockMove(panelData, null, "minimize");
    e.stopPropagation();
  };
  onFloatRestoreClick = (e: React.MouseEvent) => {
    const { panelData } = this.props;
    this.context.dockMove(panelData, null, "restore");
    e.stopPropagation();
  };
  onFloatClick = () => {
    const { panelData } = this.props;
    // 선택된(활성) 탭만 float으로 분리 (스냅샷은 DockLayout.dockMove에서 자동 저장)
    const activeTab = panelData.tabs.find((t) => t.id === panelData.activeId);
    if (activeTab) {
      this.context.dockMove(activeTab, null, "float");
    }
  };
  onFloatBtnClick = (e: React.MouseEvent) => {
    this.onFloatClick();
    e.stopPropagation();
  };
  onPopoutClick = (e: React.MouseEvent) => {
    const { panelData } = this.props;
    const activeTab = panelData.tabs.find((t) => t.id === panelData.activeId);
    if (activeTab?.id && panelData.id) {
      // 원래 패널 위치 저장 (redock 시 복귀 위치용)
      const tabIndex = panelData.tabs.indexOf(activeTab);
      const siblingTabIds = panelData.tabs
        .filter((t) => t.id !== activeTab.id && t.id)
        .map((t) => t.id!);
      saveDockOrigin(activeTab.id, { panelId: panelData.id, tabIndex, siblingTabIds });
      this.context.dockMove(activeTab, null, "new-window");
    }
    e.stopPropagation();
  };

  onCloseAll = () => {
    const { panelData } = this.props;
    for (const tab of panelData.tabs) {
      this.context.dockMove(tab, null, "remove");
    }
  };

  renderTabBar = (props: any, TabNavList: React.ComponentType<any>) => {
    let { panelData, onPanelDragStart, onPanelDragMove, onPanelDragEnd } =
      this.props;
    const { group: groupName, panelLock } = panelData;
    const group = this.context.getGroup(groupName || "");
    let { panelExtra } = group;

    let maximizable = group.maximizable;
    if (panelData.parent?.mode === "window") {
      onPanelDragStart = null as any;
      maximizable = false;
    }

    if (panelLock) {
      if (panelLock.panelExtra) {
        panelExtra = panelLock.panelExtra;
      }
    }

    const showFloatButton =
      panelData.parent?.mode !== "float" && panelData.parent?.mode !== "window";
    const isFloat = panelData.parent?.mode === "float";
    const isFloatMinimized = isFloat && !!panelData.minimized;

    // float/maximize 모드: 직접 버튼 표시
    // dock 모드: ellipsis 드롭다운 메뉴 표시
    const isMaximized = panelData.parent?.mode === "maximize";
    let ellipsisBtn: React.ReactElement | undefined;
    if (isMaximized) {
      // 최대화 모드: 최소화, 이전으로 복귀(최대화 해제)
      ellipsisBtn = (
        <div className="dock-float-btns">
          <div
            className="dock-panel-float-btn"
            title="최소화"
            onClick={(e) => {
              e.stopPropagation();
              // 최대화 해제 후 float → 최소화 (wasMaximized 플래그 전달)
              this.onMaximizeClick(e);
              const activeTab = panelData.tabs.find((t) => t.id === panelData.activeId);
              if (activeTab) {
                requestAnimationFrame(() => {
                  this.context.dockMove(activeTab, null, "float");
                  requestAnimationFrame(() => {
                    if (activeTab.parent) {
                      // DockLayout에 최대화 상태였음을 알림
                      const ctx = this.context as any;
                      if (ctx._nextMinimizeWasMaximized !== undefined) {
                        ctx._nextMinimizeWasMaximized = true;
                      }
                      this.context.dockMove(activeTab.parent, null, "minimize");
                    }
                  });
                });
              }
            }}
          >
            <MinusIcon className="w-[14px] h-[14px]" />
          </div>
          <div
            className="dock-panel-float-btn"
            title="이전으로 복귀"
            onClick={(e) => {
              e.stopPropagation();
              this.onMaximizeClick(e);
            }}
          >
            <ArrowsPointingInIcon className="w-[14px] h-[14px]" />
          </div>
        </div>
      );
    } else if (isFloat) {
      ellipsisBtn = (
        <div className="dock-float-btns">
          {/* 최소화/복원 */}
          <div
            className="dock-panel-float-btn"
            title={isFloatMinimized ? "복원" : "최소화"}
            onClick={(e) => {
              e.stopPropagation();
              if (isFloatMinimized) {
                this.onFloatRestoreClick(e);
              } else {
                this.onFloatMinimizeClick(e);
              }
            }}
          >
            {isFloatMinimized
              ? <ArrowsPointingOutIcon className="w-[14px] h-[14px]" />
              : <MinusIcon className="w-[14px] h-[14px]" />
            }
          </div>
          {/* 최대화 */}
          <div
            className="dock-panel-float-btn"
            title="최대화"
            onClick={(e) => {
              e.stopPropagation();
              this.onMaximizeClick(e);
            }}
          >
            <ArrowsPointingInIcon className="w-[14px] h-[14px]" />
          </div>
          {/* 새 창으로 열기 */}
          <div
            className="dock-panel-float-btn"
            title="새 창으로 열기"
            onClick={(e) => {
              e.stopPropagation();
              const activeTab = panelData.tabs.find((t) => t.id === panelData.activeId);
              if (activeTab?.id && panelData.id) {
                const tabIndex = panelData.tabs.indexOf(activeTab);
                const siblingTabIds = panelData.tabs
                  .filter((t) => t.id !== activeTab.id && t.id)
                  .map((t) => t.id!);
                saveDockOrigin(activeTab.id, { panelId: panelData.id, tabIndex, siblingTabIds, mode: "float" });
                this.context.dockMove(activeTab, null, "new-window");
              }
            }}
          >
            <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px]" />
          </div>
        </div>
      );
    } else if (maximizable || showFloatButton) {
      // dock 모드: ellipsis 드롭다운 메뉴
      const dropdownItems: { key: string; label: string }[] = [];
      if (showFloatButton) {
        dropdownItems.push({ key: "popout", label: "새 창으로 열기" });
      }

      ellipsisBtn = (
        <PanelDropdown
          items={dropdownItems}
          onSelect={(key) => {
            const fakeEvent = { stopPropagation: () => { } } as React.MouseEvent;
            switch (key) {
              case "popout":
                this.onPopoutClick(fakeEvent);
                break;
            }
          }}
        />
      );
    }

    // panelExtra와 ellipsis 메뉴를 결합
    let panelExtraContent: React.ReactElement | undefined;
    if (panelExtra && ellipsisBtn) {
      // panelExtra + ellipsis 메뉴 모두 표시
      panelExtraContent = (
        <>
          {panelExtra(panelData, this.context)}
          {ellipsisBtn}
        </>
      );
    } else if (panelExtra) {
      panelExtraContent = panelExtra(panelData, this.context);
    } else if (ellipsisBtn) {
      panelExtraContent = ellipsisBtn;
    }
    return (
      <DockTabBar
        onDragStart={onPanelDragStart}
        onDragMove={onPanelDragMove}
        onDragEnd={onPanelDragEnd}
        TabNavList={DockTabNavList}
        isMaximized={panelData.parent?.mode === "maximize"}
        {...props}
        extra={panelExtraContent}
      />
    );
  };

  onTabChange = (activeId: string) => {
    this.props.panelData.activeId = activeId;
    this.context.onSilentChange(activeId, "active");
    this.forceUpdate();
  };

  render(): React.ReactNode {
    const { group, tabs, activeId } = this.props.panelData;
    const tabGroup = this.context.getGroup(group || "");

    // 패널이 하나도 열려 있지 않을 때 안내 문구 표시
    if (!tabs || tabs.length === 0) {
      return (
        <div className="dock-tabs dock-tabs-empty">
          <div className="dock-tabs-empty-content">
            <p className="dock-tabs-empty-title">열린 패널이 없습니다</p>
            <p className="dock-tabs-empty-desc">
              왼쪽 사이드바에서 메뉴를 선택하거나,<br />통합 검색(Ctrl+E)으로 원하는 패널을 열어보세요.
            </p>
          </div>
        </div>
      );
    }

    let { animated } = tabGroup;
    if (animated == null) {
      animated = true;
    }

    this.updateTabs(tabs);

    const children: React.ReactNode[] = [];
    for (const [id, tab] of this._cache) {
      children.push(tab.content);
    }

    return (
      <Tabs
        prefixCls="dock"
        animated={animated}
        renderTabBar={this.renderTabBar}
        activeKey={activeId}
        onChange={this.onTabChange}
      >
        {children}
      </Tabs>
    );
  }
}
