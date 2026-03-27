// @ts-nocheck
import * as React from "react";
import type { DockContext, PanelData, TabData } from "./DockData";
import { DockContextType } from "./DockData";
import { DockTabs } from "./DockTabs";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import {
  DragState,
  addDragStateListener,
  removeDragStateListener,
} from "./dragdrop/DragManager";
import { DockDropLayer } from "./DockDropLayer";
import {
  getFloatMinimizedHeight,
  getFloatPanelSize,
  nextZIndex,
} from "./Algorithm";
import { DockDropEdge } from "./DockDropEdge";
import { groupClassNames } from "./Utils";
import classNames from "classnames";

interface Props {
  panelData: PanelData;
  size: number;
}

interface State {
  dropFromPanel: PanelData | null;
  draggingHeader: boolean;
}

export class DockPanel extends React.PureComponent<Props, State> {
  static contextType = DockContextType;

  context!: DockContext;

  _ref: HTMLDivElement | null = null;

  /** 드래그가 완전히 끝났을 때 drop 레이어를 숨기기 위해 dropFromPanel 초기화 */
  _onDragStateChange = (scope: unknown) => {
    if (scope == null && !this._unmounted) {
      this.setState({ dropFromPanel: null });
      if (DockPanel._droppingPanel === this) {
        DockPanel._droppingPanel = null as any;
      }
    }
  };

  getRef = (r: HTMLDivElement | null) => {
    if (this._ref && this._ref !== r) {
      const { parent } = this.props.panelData;
      if (parent?.mode === "float") {
        this._ref.removeEventListener("pointerdown", this.onFloatPointerDown, {
          capture: true,
        });
      }
    }
    this._ref = r;
    if (r) {
      const { parent } = this.props.panelData;
      if (parent?.mode === "float") {
        r.addEventListener("pointerdown", this.onFloatPointerDown, {
          capture: true,
          passive: true,
        });
      }
    }
  };

  static _droppingPanel: DockPanel;
  static set droppingPanel(panel: DockPanel) {
    if (DockPanel._droppingPanel === panel) {
      return;
    }
    if (DockPanel._droppingPanel) {
      DockPanel._droppingPanel.onDragOverOtherPanel();
    }
    DockPanel._droppingPanel = panel;
  }
  static clearDroppingPanel() {
    if (DockPanel._droppingPanel) {
      DockPanel._droppingPanel.setState({ dropFromPanel: null });
    }
    DockPanel._droppingPanel = null as any;
  }

  state: State = { dropFromPanel: null as PanelData | null, draggingHeader: false };

  onDragOver = (e: DragState) => {
    const dockId = this.context.getDockId();
    const tab: TabData = DragState.getData("tab", dockId);
    const panel: PanelData = DragState.getData("panel", dockId);
    if (tab || panel) {
      DockPanel.droppingPanel = this;
    }
    if (tab) {
      if (tab.parent) {
        this.setState({ dropFromPanel: tab.parent });
      } else {
        // add a fake panel
        this.setState({
          dropFromPanel: { activeId: "", tabs: [], group: tab.group },
        });
      }
      e.accept("");
    } else if (panel) {
      this.setState({ dropFromPanel: panel });
      e.accept("");
    }
  };

  onDragOverOtherPanel() {
    this.setState({ dropFromPanel: null });
  }

  onDragLeave = (e: DragState) => {
    // DockDropSquare 등 자식 요소로 이동할 때도 호출되므로
    // 드래그가 완전히 끝난 경우(데이터 없음)에만 정리
    // 다른 패널로 이동 시에는 droppingPanel setter가 onDragOverOtherPanel을 호출
    const dockId = this.context.getDockId();
    const tab: TabData = DragState.getData("tab", dockId);
    const panel: PanelData = DragState.getData("panel", dockId);
    if (!tab && !panel) {
      this.setState({ dropFromPanel: null });
      if (DockPanel._droppingPanel === this) {
        DockPanel._droppingPanel = null as any;
      }
    }
  };

  // used both by dragging head and corner
  _movingX: number = 0;
  _movingY: number = 0;
  // drop to move in float mode
  onPanelHeaderDragStart = (event: DragState) => {
    const { panelData } = this.props;
    const { parent, x, y, z } = panelData;
    const dockId = this.context.getDockId();
    if (parent?.mode === "float") {
      this._movingX = x ?? 0;
      this._movingY = y ?? 0;
      // ghost 미사용 – 드래그 레이어에 패널 클론을 만들지 않음
      event.setData({ panel: panelData, tabGroup: panelData.group || "" }, dockId);
      event.startDrag(undefined, "");
      this.onFloatPointerDown();
    } else {
      const tabGroup = this.context.getGroup(panelData.group || "");
      if (!this._ref) {
        return;
      }
      const [panelWidth, panelHeight] = getFloatPanelSize(this._ref, tabGroup);

      event.setData(
        {
          panel: panelData,
          panelSize: [panelWidth, panelHeight],
          tabGroup: panelData.group || "",
        },
        dockId
      );
      // ghost 미사용 – 드래그 레이어에 패널 클론을 만들지 않음
      event.startDrag(undefined, "");
    }
    this.setState({ draggingHeader: true });
  };
  onPanelHeaderDragMove = (e: DragState) => {
    const { panelData } = this.props;
    if (panelData.parent?.mode !== "float") {
      return;
    }
    const { width, height } = this.context.getLayoutSize();
    const panelW = panelData.w ?? 0;
    const panelH = panelData.h ?? 0;
    // DockLayout 영역 밖으로 나가지 않도록 위치 제한
    panelData.x = Math.max(0, Math.min(this._movingX + e.dx, Math.max(0, width - panelW)));
    panelData.y = Math.max(0, Math.min(this._movingY + e.dy, Math.max(0, height - panelH)));
    this.forceUpdate();
  };
  onPanelHeaderDragEnd = (e: DragState) => {
    this.setState({ draggingHeader: false });
    if (e.dropped === false) {
      const { panelData } = this.props;
      if (panelData.parent?.mode === "float") {
        // in float mode, the position change needs to be sent to the layout
        this.context.onSilentChange(this.props.panelData.activeId, "move");
      }
    }
  };

  _movingW: number = 0;
  _movingH: number = 0;
  _movingCorner: string = "";
  onPanelCornerDragT = (e: DragState) => {
    this.onPanelCornerDrag(e, "t");
  };
  onPanelCornerDragB = (e: DragState) => {
    this.onPanelCornerDrag(e, "b");
  };
  onPanelCornerDragL = (e: DragState) => {
    this.onPanelCornerDrag(e, "l");
  };
  onPanelCornerDragR = (e: DragState) => {
    this.onPanelCornerDrag(e, "r");
  };
  onPanelCornerDragTL = (e: DragState) => {
    this.onPanelCornerDrag(e, "tl");
  };
  onPanelCornerDragTR = (e: DragState) => {
    this.onPanelCornerDrag(e, "tr");
  };
  onPanelCornerDragBL = (e: DragState) => {
    this.onPanelCornerDrag(e, "bl");
  };
  onPanelCornerDragBR = (e: DragState) => {
    this.onPanelCornerDrag(e, "br");
  };

  onPanelCornerDrag(e: DragState, corner: string) {
    const { parent, x, y, w, h } = this.props.panelData;
    if (parent?.mode === "float") {
      this._movingCorner = corner;
      this._movingX = x ?? 0;
      this._movingY = y ?? 0;
      this._movingW = w ?? 0;
      this._movingH = h ?? 0;
      e.startDrag(undefined, undefined);
    }
  }

  /** 패널이 DockLayout 영역 밖으로 나가지 않도록 x, y, w, h 제한 */
  clampPanelToLayoutBounds() {
    const { panelData } = this.props;
    const { width, height } = this.context.getLayoutSize();
    let { x = 0, y = 0, w = 0, h = 0 } = panelData;
    const minW = panelData.minWidth ?? 0;
    const minH = panelData.minHeight ?? 0;
    x = Math.max(0, Math.min(x, width - minW));
    y = Math.max(0, Math.min(y, height - minH));
    w = Math.max(minW, Math.min(w ?? 0, width - x));
    h = Math.max(minH, Math.min(h ?? 0, height - y));
    panelData.x = x;
    panelData.y = y;
    panelData.w = w;
    panelData.h = h;
  }

  onPanelCornerDragMove = (e: DragState) => {
    const { panelData } = this.props;
    let { dx, dy } = e;
    const { width, height } = this.context.getLayoutSize();

    if (this._movingCorner.startsWith("t")) {
      if (this._movingY + dy < 0) {
        dy = -this._movingY;
      } else if (this._movingY + dy > height - 16) {
        dy = height - 16 - this._movingY;
      }
    }

    switch (this._movingCorner) {
      case "t": {
        panelData.y = this._movingY + dy;
        panelData.h = Math.max((this._movingH - dy) || 0, panelData.minHeight || 0);
        break;
      }
      case "b": {
        panelData.h = Math.max((this._movingH + dy) || 0, panelData.minHeight || 0);
        break;
      }
      case "l": {
        panelData.x = this._movingX + dx;
        panelData.w = Math.max((this._movingW - dx) || 0, panelData.minWidth || 0);
        break;
      }
      case "r": {
        panelData.w = Math.max((this._movingW + dx) || 0, panelData.minWidth || 0);
        break;
      }
      case "tl": {
        panelData.x = this._movingX + dx;
        panelData.w = Math.max((this._movingW - dx) || 0, panelData.minWidth || 0);
        panelData.y = this._movingY + dy;
        panelData.h = Math.max((this._movingH - dy) || 0, panelData.minHeight || 0);
        break;
      }
      case "tr": {
        panelData.w = Math.max((this._movingW + dx) || 0, panelData.minWidth || 0);
        panelData.y = this._movingY + dy;
        panelData.h = Math.max((this._movingH - dy) || 0, panelData.minHeight || 0);
        break;
      }
      case "bl": {
        panelData.x = this._movingX + dx;
        panelData.w = Math.max((this._movingW - dx) || 0, panelData.minWidth || 0);
        panelData.h = Math.max((this._movingH + dy) || 0, panelData.minHeight || 0);
        break;
      }
      case "br": {
        panelData.w = Math.max((this._movingW + dx) || 0, panelData.minWidth || 0);
        panelData.h = Math.max((this._movingH + dy) || 0, panelData.minHeight || 0);
        break;
      }
    }

    this.clampPanelToLayoutBounds();
    this.forceUpdate();
  };
  onPanelCornerDragEnd = (e: DragState) => {
    this.context.onSilentChange(this.props.panelData.activeId, "move");
  };

  onFloatPointerDown = () => {
    const { panelData } = this.props;
    const { z } = panelData;
    const newZ = nextZIndex(z);
    if (newZ !== z) {
      panelData.z = newZ;
      this.forceUpdate();
    }
  };

  onPanelClicked = (e: React.MouseEvent) => {
    if (!this._ref) return;
    const target = e.nativeEvent.target;
    if (
      !this._ref.contains(this._ref.ownerDocument.activeElement) &&
      target instanceof Node &&
      this._ref.contains(target)
    ) {
      // 모든 패널에서 data-focused 속성 제거
      const allPanels = this._ref.ownerDocument.querySelectorAll(".dock-panel");
      allPanels.forEach((panel) => {
        panel.removeAttribute("data-focused");
      });

      // 현재 패널에 data-focused 속성 추가
      this._ref.setAttribute("data-focused", "true");

      // 패널 자체에 포커스를 주어 :focus-within 스타일이 적용되도록 함
      if (!this._ref.hasAttribute("tabindex")) {
        this._ref.setAttribute("tabindex", "0");
      }
      this._ref.focus();
    }
  };

  render(): React.ReactNode {
    let { dropFromPanel, draggingHeader } = this.state;
    const { panelData, size } = this.props;
    const { minWidth, minHeight, group, id, parent, panelLock } = panelData;
    let styleName = group;
    const tabGroup = this.context.getGroup(group || "");
    let { widthFlex, heightFlex } = tabGroup;
    if (panelLock) {
      const {
        panelStyle,
        widthFlex: panelWidthFlex,
        heightFlex: panelHeightFlex,
      } = panelLock;
      if (panelStyle) {
        styleName = panelStyle;
      }
      if (typeof panelWidthFlex === "number") {
        widthFlex = panelWidthFlex;
      }
      if (typeof panelHeightFlex === "number") {
        heightFlex = panelHeightFlex;
      }
    }
    const panelClass: string = classNames(groupClassNames(styleName));
    const isMax = parent?.mode === "maximize";
    const isFloat = parent?.mode === "float";
    const isFloatMinimized = isFloat && !!panelData.minimized;
    const isHBox = parent?.mode === "horizontal";
    const isVBox = parent?.mode === "vertical";

    let onPanelHeaderDragStart = this.onPanelHeaderDragStart;

    if (isMax) {
      dropFromPanel = null as PanelData | null;
      onPanelHeaderDragStart = undefined as any;
    }
    const cls = classNames(
      "dock-panel",
      panelClass || "",
      dropFromPanel && "dock-panel-dropping",
      draggingHeader && "dragging",
      isFloatMinimized && "dock-panel-minimized"
    );
    let flex = 1;
    if (isHBox && widthFlex != null) {
      flex = widthFlex;
    } else if (isVBox && heightFlex != null) {
      flex = heightFlex;
    }
    const flexGrow = flex * size;
    let flexShrink = flex * 1000000;
    if (flexShrink < 1) {
      flexShrink = 1;
    }
    const style: React.CSSProperties = {
      minWidth,
      minHeight,
      flex: `${flexGrow} ${flexShrink} ${size}px`,
    };
    if (isFloat) {
      style.left = panelData.x;
      style.width = panelData.w ?? 300;
      style.zIndex = panelData.z;
      if (isFloatMinimized) {
        style.bottom = 0;
        style.top = "auto";
        style.height = getFloatMinimizedHeight();
      } else {
        style.top = panelData.y;
        style.height = panelData.h;
      }
    }
    let droppingLayer: React.ReactNode;
    if (dropFromPanel && this._ref) {
      const dropFromGroup = this.context.getGroup(dropFromPanel.group || "");
      const dockId = this.context.getDockId();
      if (
        !dropFromGroup.tabLocked ||
        DragState.getData("tab", dockId) == null
      ) {
        // not allowed locked tab to create new panel
        const DockDropClass = this.context.useEdgeDrop()
          ? DockDropEdge
          : DockDropLayer;
        droppingLayer = (
          <DockDropClass
            panelData={panelData}
            panelElement={this._ref}
            dropFromPanel={dropFromPanel}
          />
        );
      }
    }

    return (
      <DragDropDiv
        getRef={this.getRef}
        className={cls}
        style={style}
        data-dockid={id}
        data-focused={undefined} // 초기값은 undefined, 클릭 시 true로 설정됨
        onDragOverT={this.onDragOver}
        onDragLeaveT={this.onDragLeave}
        onClick={this.onPanelClicked}
        onFocus={(e) => {
          // 포커스가 패널로 이동할 때 data-focused 설정
          const allPanels =
            e.currentTarget.ownerDocument.querySelectorAll(".dock-panel");
          allPanels.forEach((panel) => {
            panel.removeAttribute("data-focused");
          });
          e.currentTarget.setAttribute("data-focused", "true");
        }}
        onBlur={(e) => {
          // 포커스가 다른 곳으로 이동할 때는 제거하지 않음
          // (다른 패널이 포커스를 받으면 그 패널이 data-focused를 설정함)
        }}
      >
        <DockTabs
          panelData={panelData}
          onPanelDragStart={onPanelHeaderDragStart}
          onPanelDragMove={this.onPanelHeaderDragMove}
          onPanelDragEnd={this.onPanelHeaderDragEnd}
        />
        {isFloat && !isFloatMinimized
          ? [
              <DragDropDiv
                key="drag-size-t"
                className="dock-panel-drag-size dock-panel-drag-size-t"
                onDragStartT={this.onPanelCornerDragT}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-b"
                className="dock-panel-drag-size dock-panel-drag-size-b"
                onDragStartT={this.onPanelCornerDragB}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-l"
                className="dock-panel-drag-size dock-panel-drag-size-l"
                onDragStartT={this.onPanelCornerDragL}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-r"
                className="dock-panel-drag-size dock-panel-drag-size-r"
                onDragStartT={this.onPanelCornerDragR}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-t-l"
                className="dock-panel-drag-size dock-panel-drag-size-t-l"
                onDragStartT={this.onPanelCornerDragTL}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-t-r"
                className="dock-panel-drag-size dock-panel-drag-size-t-r"
                onDragStartT={this.onPanelCornerDragTR}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-b-l"
                className="dock-panel-drag-size dock-panel-drag-size-b-l"
                onDragStartT={this.onPanelCornerDragBL}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
              <DragDropDiv
                key="drag-size-b-r"
                className="dock-panel-drag-size dock-panel-drag-size-b-r"
                onDragStartT={this.onPanelCornerDragBR}
                onDragMoveT={this.onPanelCornerDragMove}
                onDragEndT={this.onPanelCornerDragEnd}
              />,
            ]
          : null}
        {droppingLayer}
      </DragDropDiv>
    );
  }

  _unmounted = false;

  componentDidMount(): void {
    addDragStateListener(this._onDragStateChange);
  }

  componentWillUnmount(): void {
    removeDragStateListener(this._onDragStateChange);
    if (DockPanel._droppingPanel === this) {
      DockPanel.droppingPanel = null as any;
    }
    if (this._ref) {
      this._ref.removeEventListener("pointerdown", this.onFloatPointerDown, {
        capture: true,
      });
    }
    this._unmounted = true;
  }
}
