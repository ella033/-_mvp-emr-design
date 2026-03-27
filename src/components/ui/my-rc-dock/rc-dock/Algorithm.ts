// @ts-nocheck
import type {
  BoxData,
  DockMode,
  DropDirection,
  LayoutData,
  PanelData,
  TabBase,
  TabData,
  TabGroup,
} from "./DockData";
import { maximePlaceHolderId, placeHolderStyle } from "./DockData";

let _watchObjectChange: WeakMap<any, any> = new WeakMap();

export function getUpdatedObject(obj: any): any {
  const result = _watchObjectChange.get(obj);
  if (result) {
    return getUpdatedObject(result);
  }
  return obj;
}

function clearObjectCache() {
  _watchObjectChange = new WeakMap();
}

function clone<T>(value: T, extra?: any): T {
  const newValue: any = { ...value, ...extra };
  if (Array.isArray(newValue.tabs)) {
    newValue.tabs = newValue.tabs.concat();
  }
  if (Array.isArray(newValue.children)) {
    newValue.children = newValue.children.concat();
  }
  _watchObjectChange.set(value, newValue);
  return newValue;
}

function maxFlex(currentFlex: number, newFlex: number) {
  if (currentFlex == null) {
    return newFlex;
  }
  return Math.max(currentFlex, newFlex);
}

function mergeFlex(currentFlex: number, newFlex: number) {
  if (currentFlex == null) {
    return newFlex;
  }
  if (currentFlex === newFlex) {
    return newFlex;
  }
  if (currentFlex >= 1) {
    if (newFlex <= 1) {
      return 1;
    }
    return Math.min(currentFlex, newFlex);
  } else {
    if (newFlex >= 1) {
      return 1;
    }
    return Math.max(currentFlex, newFlex);
  }
}

let _idCount = 0;

export function nextId() {
  ++_idCount;
  return `+${_idCount}`;
}

let _zCount = 0;

export function nextZIndex(current?: number): number {
  if (current === _zCount) {
    // already the top
    return current;
  }
  return ++_zCount;
}

function compareFindId(
  item: PanelData | TabData | BoxData,
  id: string | ((item: PanelData | TabData | BoxData) => boolean)
): boolean {
  return item && (typeof id === "function" ? id(item) : item.id === id);
}

function findInPanel(
  panel: PanelData,
  id: string | ((item: PanelData | TabData | BoxData) => boolean),
  filter: Filter
): PanelData | TabData | undefined {
  if (compareFindId(panel, id) && filter & Filter.Panel) {
    return panel;
  }
  if (filter & Filter.Tab) {
    for (const tab of panel.tabs) {
      if (compareFindId(tab, id)) {
        return tab;
      }
    }
  }
  return undefined;
}

function findInBox(
  box: BoxData | undefined,
  id: string | ((item: PanelData | TabData | BoxData) => boolean),
  filter: Filter
): PanelData | TabData | BoxData | undefined {
  let result: PanelData | TabData | BoxData | undefined;
  if (box && (filter & Filter.Box) && compareFindId(box, id)) {
    return box;
  }
  if (!box?.children) {
    return undefined;
  }
  for (const child of box.children) {
    if ("children" in child) {
      if ((result = findInBox(child, id, filter))) {
        break;
      }
    } else if ("tabs" in child) {
      if ((result = findInPanel(child, id, filter))) {
        break;
      }
    }
  }
  return result;
}

export enum Filter {
  Tab = 1,
  Panel = 1 << 1,
  Box = 1 << 2,
  Docked = 1 << 3,
  Floated = 1 << 4,
  Windowed = 1 << 5,
  Max = 1 << 6,
  EveryWhere = Docked | Floated | Windowed | Max,
  AnyTab = Tab | EveryWhere,
  AnyPanel = Panel | EveryWhere,
  AnyTabPanel = Tab | Panel | EveryWhere,
  All = Tab | Panel | Box | EveryWhere,
}

export function find(
  layout: LayoutData,
  id: string | ((item: PanelData | TabData | BoxData) => boolean),
  filter: Filter = Filter.AnyTabPanel
): PanelData | TabData | BoxData | undefined {
  let result: PanelData | TabData | BoxData | undefined;

  if (filter & Filter.Docked) {
    result = findInBox(layout.dockbox, id, filter);
  }
  if (result) return result;

  if (filter & Filter.Floated) {
    result = findInBox(layout.floatbox, id, filter);
  }
  if (result) return result;

  if (filter & Filter.Windowed) {
    result = findInBox(layout.windowbox, id, filter);
  }
  if (result) return result;

  if (filter & Filter.Max) {
    result = findInBox(layout.maxbox, id, filter);
  }

  return result;
}

export function addNextToTab(
  layout: LayoutData,
  source: TabData | PanelData,
  target: TabData,
  direction: DropDirection
): LayoutData {
  if (!target.parent) {
    return layout;
  }
  let pos = target.parent.tabs.indexOf(target);
  if (pos >= 0) {
    if (direction === "after-tab") {
      ++pos;
    }
    return addTabToPanel(layout, source, target.parent, pos);
  }
  return layout;
}

export function addTabToPanel(
  layout: LayoutData,
  source: TabData | PanelData,
  panel: PanelData,
  idx = -1
): LayoutData {
  if (idx === -1) {
    idx = panel.tabs.length;
  }

  let tabs: TabData[];
  let activeId: string | undefined;
  if ("tabs" in source) {
    // source is PanelData
    tabs = source.tabs;
    activeId = source.activeId;
  } else {
    // source is TabData
    tabs = [source];
  }

  if (tabs.length) {
    const newPanel = clone(panel);
    newPanel.tabs.splice(idx, 0, ...tabs);
    const lastTab = tabs[tabs.length - 1];
    if (lastTab && lastTab.id) {
      newPanel.activeId = lastTab.id;
    }
    for (const tab of tabs) {
      tab.parent = newPanel;
    }
    if (activeId) {
      newPanel.activeId = activeId;
    }
    layout = replacePanel(layout, panel, newPanel);
  }

  return layout;
}

export function convertToPanel(source: TabData | PanelData): PanelData {
  if ("tabs" in source) {
    // source is already PanelData
    return source;
  } else {
    const newPanel: PanelData = {
      tabs: [source],
      group: source.group,
      activeId: source.id || undefined,
    };
    source.parent = newPanel;
    return newPanel;
  }
}

export function dockPanelToPanel(
  layout: LayoutData,
  newPanel: PanelData,
  panel: PanelData,
  direction: DropDirection
): LayoutData {
  const box = panel.parent;
  if (!box) {
    return layout;
  }
  const dockMode: DockMode =
    direction === "left" || direction === "right" ? "horizontal" : "vertical";
  const afterPanel = direction === "bottom" || direction === "right";

  let pos = box.children.indexOf(panel);
  if (pos >= 0) {
    const newBox = clone(box);
    if (dockMode === box.mode) {
      if (afterPanel) {
        ++pos;
      }
      // HINT: The size remains the same, preventing flex-grow less than 1
      newPanel.size = panel.size ?? 200;
      newBox.children.splice(pos, 0, newPanel);
    } else {
      const newChildBox: BoxData = { mode: dockMode, children: [] };
      newChildBox.size = panel.size ?? 200;
      if (afterPanel) {
        newChildBox.children = [panel, newPanel];
      } else {
        newChildBox.children = [newPanel, panel];
      }
      panel.parent = newChildBox;
      panel.size = 200;
      newPanel.parent = newChildBox;
      newPanel.size = 200;
      newBox.children[pos] = newChildBox;
      newChildBox.parent = newBox;
    }
    return replaceBox(layout, box, newBox);
  }
  return layout;
}

export function dockPanelToBox(
  layout: LayoutData,
  newPanel: PanelData,
  box: BoxData,
  direction: DropDirection
): LayoutData {
  const parentBox = box.parent;
  const dockMode: DockMode =
    direction === "left" || direction === "right" ? "horizontal" : "vertical";

  const afterPanel = direction === "bottom" || direction === "right";

  if (parentBox) {
    let pos = parentBox.children.indexOf(box);
    if (pos >= 0) {
      const newParentBox = clone(parentBox);
      if (dockMode === parentBox.mode) {
        if (afterPanel) {
          ++pos;
        }
        const boxSize = box.size ?? 200;
        newPanel.size = boxSize * 0.3;
        box.size = boxSize * 0.7;

        newParentBox.children.splice(pos, 0, newPanel);
      } else {
        const newChildBox: BoxData = { mode: dockMode, children: [] };
        newChildBox.size = box.size;
        if (afterPanel) {
          newChildBox.children = [box, newPanel];
        } else {
          newChildBox.children = [newPanel, box];
        }
        box.parent = newChildBox;
        box.size = 280;
        newPanel.parent = newChildBox;
        newPanel.size = 120;
        newParentBox.children[pos] = newChildBox;
      }
      return replaceBox(layout, parentBox, newParentBox);
    }
  } else if (box === layout.dockbox) {
    const newBox = clone(box);
    if (dockMode === box.mode) {
      let pos = 0;
      if (afterPanel) {
        pos = newBox.children.length;
      }
      const boxSize = box.size ?? 200;
      newPanel.size = boxSize * 0.3;
      box.size = boxSize * 0.7;

      newBox.children.splice(pos, 0, newPanel);
      return replaceBox(layout, box, newBox);
    } else {
      // replace root dockbox

      const newDockBox: BoxData = { mode: dockMode, children: [] };
      newDockBox.size = box.size ?? 200;
      if (afterPanel) {
        newDockBox.children = [newBox, newPanel];
      } else {
        newDockBox.children = [newPanel, newBox];
      }
      newBox.size = 280;
      newPanel.size = 120;
      return replaceBox(layout, box, newDockBox);
    }
  } else if (box === layout.maxbox) {
    const newBox = clone(box);
    newBox.children.push(newPanel);
    return replaceBox(layout, box, newBox);
  }

  return layout;
}

export function floatPanel(
  layout: LayoutData,
  newPanel: PanelData,
  rect?: { left: number; top: number; width: number; height: number }
): LayoutData {
  if (!layout.floatbox) {
    layout.floatbox = { mode: "float", children: [], size: 1 };
  }
  const newBox = clone(layout.floatbox);
  if (rect) {
    newPanel.x = rect.left;
    newPanel.y = rect.top;
    newPanel.w = rect.width;
    newPanel.h = rect.height;
  }

  newBox.children.push(newPanel);
  return replaceBox(layout, layout.floatbox, newBox);
}

const FLOAT_MINIMIZED_HEIGHT = 36;

/** Float 패널을 최소화(하단 탭바만 표시). 복원용 y/h 저장 */
export function minimizeFloatPanel(
  layout: LayoutData,
  panel: PanelData,
  wasMaximized?: boolean
): LayoutData {
  const floatbox = layout.floatbox;
  if (!floatbox || floatbox.mode !== "float") return layout;
  const idx = floatbox.children.indexOf(panel);
  if (idx < 0) return layout;
  const newPanel = clone(panel, {
    minimized: true,
    _floatRestoreY: panel.y,
    _floatRestoreH: panel.h,
    _wasMaximized: wasMaximized || undefined,
  });
  const newBox = clone(floatbox);
  newBox.children = floatbox.children.slice();
  newBox.children[idx] = newPanel;
  newPanel.parent = newBox;
  return replaceBox(layout, floatbox, newBox);
}

/** Float 패널 최소화 해제. _wasMaximized가 true면 반환값에 표시 */
export function restoreFloatPanel(
  layout: LayoutData,
  panel: PanelData
): LayoutData {
  const floatbox = layout.floatbox;
  if (!floatbox || floatbox.mode !== "float") return layout;
  const idx = floatbox.children.indexOf(panel);
  if (idx < 0) return layout;
  const newPanel = clone(panel, {
    minimized: false,
    y: panel._floatRestoreY ?? panel.y,
    h: panel._floatRestoreH ?? panel.h,
    _floatRestoreY: undefined,
    _floatRestoreH: undefined,
    // _wasMaximized는 복원 후 DockLayout에서 처리하므로 여기서 유지
  });
  const newBox = clone(floatbox);
  newBox.children = floatbox.children.slice();
  newBox.children[idx] = newPanel;
  newPanel.parent = newBox;
  return replaceBox(layout, floatbox, newBox);
}

export function getFloatMinimizedHeight(): number {
  return FLOAT_MINIMIZED_HEIGHT;
}

export function panelToWindow(
  layout: LayoutData,
  newPanel: PanelData
): LayoutData {
  if (!layout.windowbox) {
    layout.windowbox = { mode: "window", children: [], size: 1 };
  }
  const newBox = clone(layout.windowbox);

  newBox.children.push(newPanel);
  return replaceBox(layout, layout.windowbox, newBox);
}

export function removeFromLayout(
  layout: LayoutData,
  source: TabData | PanelData
): LayoutData {
  if (source) {
    let panelData: PanelData | undefined;
    if ("tabs" in source) {
      panelData = source;
      layout = removePanel(layout, panelData);
    } else {
      panelData = source.parent;
      if (!panelData) {
        return layout;
      }
      layout = removeTab(layout, source);
    }
    if (panelData && panelData.parent && panelData.parent.mode === "maximize") {
      if (layout.maxbox) {
        const newPanel = layout.maxbox.children[0] as PanelData | undefined;
        if (!newPanel || (newPanel.tabs.length === 0 && !newPanel.panelLock)) {
          // max panel is gone, remove the place holder
          const placeHolder = find(layout, maximePlaceHolderId) as PanelData | undefined;
          if (placeHolder) {
            return removePanel(layout, placeHolder);
          }
        }
      }
    }
    return layout;
  }
  return layout;
}

function removePanel(layout: LayoutData, panel: PanelData): LayoutData {
  const box = panel.parent;
  if (box) {
    const pos = box.children.indexOf(panel);
    if (pos >= 0) {
      const newBox = clone(box);
      newBox.children.splice(pos, 1);
      return replaceBox(layout, box, newBox);
    }
  }
  return layout;
}

function removeTab(layout: LayoutData, tab: TabData): LayoutData {
  const panel = tab.parent;
  if (panel) {
    const pos = panel.tabs.indexOf(tab);
    if (pos >= 0) {
      const newPanel = clone(panel);
      newPanel.tabs.splice(pos, 1);
      if (newPanel.activeId === tab.id) {
        // update selection id
        if (newPanel.tabs.length > pos) {
          newPanel.activeId = newPanel.tabs[pos].id;
        } else if (newPanel.tabs.length) {
          newPanel.activeId = newPanel.tabs[0].id;
        }
      }
      return replacePanel(layout, panel, newPanel);
    }
  }
  return layout;
}

export function moveToFront(
  layout: LayoutData,
  source: TabData | PanelData
): LayoutData {
  if (source) {
    let panelData: PanelData | undefined;
    let needUpdate = false;
    const changes: any = {};
    if ("tabs" in source) {
      panelData = source;
    } else {
      panelData = source.parent;
      if (!panelData) {
        return layout;
      }
      if (panelData.activeId !== source.id) {
        // move tab to front
        changes.activeId = source.id;
        needUpdate = true;
      }
    }
    if (panelData && panelData.parent && panelData.parent.mode === "float") {
      // move float panel to front
      const newZ = nextZIndex(panelData.z);
      if (newZ !== panelData.z) {
        changes.z = newZ;
        needUpdate = true;
      }
    }
    if (needUpdate && panelData) {
      layout = replacePanel(layout, panelData, clone(panelData, changes));
    }
  }
  return layout;
}

// maximize or restore the panel
export function maximize(
  layout: LayoutData,
  source: TabData | PanelData
): LayoutData {
  if (source) {
    if ("tabs" in source) {
      if (source.parent && source.parent.mode === "maximize") {
        return restorePanel(layout, source);
      } else {
        return maximizePanel(layout, source);
      }
    } else {
      return maximizeTab(layout, source);
    }
  }
  return layout;
}

function maximizePanel(layout: LayoutData, panel: PanelData): LayoutData {
  const maxbox = layout.maxbox;
  if (!maxbox || maxbox.children.length) {
    // invalid maximize
    return layout;
  }
  const placeHodlerPanel: PanelData = {
    ...panel,
    id: maximePlaceHolderId,
    tabs: [],
    panelLock: {},
  };
  layout = replacePanel(layout, panel, placeHodlerPanel);
  layout = dockPanelToBox(layout, panel, maxbox, "middle");
  return layout;
}

function restorePanel(layout: LayoutData, panel: PanelData): LayoutData {
  layout = removePanel(layout, panel);
  const placeHolder = find(layout, maximePlaceHolderId) as PanelData;
  if (placeHolder) {
    const { x, y, z, w, h } = placeHolder;
    panel = { ...panel, x, y, z, w, h };
    return replacePanel(layout, placeHolder, panel);
  } else {
    return dockPanelToBox(layout, panel, layout.dockbox, "right");
  }
}

function maximizeTab(layout: LayoutData, tab: TabData): LayoutData {
  // TODO to be implemented
  return layout;
}

// move float panel into the screen
export function fixFloatPanelPos(
  layout: LayoutData,
  layoutWidth?: number,
  layoutHeight?: number
): LayoutData {
  let layoutChanged = false;
  if (layout && layout.floatbox && layoutWidth !== undefined && layoutHeight !== undefined && layoutWidth > 200 && layoutHeight > 200) {
    const newFloatChildren = layout.floatbox.children.concat();
    for (let i = 0; i < newFloatChildren.length; ++i) {
      const panel: PanelData = newFloatChildren[i] as PanelData;
      const panelChange: any = {};
      const panelW = panel.w ?? 0;
      const panelH = panel.h ?? 0;
      if (!(panelW > 0)) {
        panelChange.w = Math.round(layoutWidth! / 3);
      } else if (panelW > layoutWidth!) {
        panelChange.w = layoutWidth!;
      }
      if (!(panelH > 0)) {
        panelChange.h = Math.round(layoutHeight! / 3);
      } else if (panelH > layoutHeight!) {
        panelChange.h = layoutHeight!;
      }
      if (typeof panel.y !== "number") {
        panelChange.y = (layoutHeight! - (panelChange.h || panelH)) >> 1;
      } else if (panel.y > layoutHeight! - 16) {
        panelChange.y = Math.max(layoutHeight! - 16 - (panelH >> 1), 0);
      } else if (!(panel.y >= 0)) {
        panelChange.y = 0;
      }

      if (typeof panel.x !== "number") {
        panelChange.x = (layoutWidth! - (panelChange.w || panelW)) >> 1;
      } else if (panel.x + panelW < 16) {
        panelChange.x = 16 - (panelW >> 1);
      } else if (panel.x > layoutWidth! - 16) {
        panelChange.x = layoutWidth! - 16 - (panelW >> 1);
      }
      if (Object.keys(panelChange).length) {
        newFloatChildren[i] = clone(panel, panelChange);
        layoutChanged = true;
      }
    }
    if (layoutChanged) {
      const newBox = clone(layout.floatbox);
      newBox.children = newFloatChildren;
      return replaceBox(layout, layout.floatbox, newBox);
    }
  }

  return layout;
}

export function createLayoutData(): LayoutData {
  return {
    dockbox: {
      id: "",
      mode: "horizontal",
      size: 1,
      children: [],
    },
    floatbox: {
      id: "",
      mode: "float",
      size: 0,
      children: [],
    },
    windowbox: {
      id: "",
      mode: "window",
      size: 0,
      children: [],
    },
    maxbox: {
      id: "",
      mode: "maximize",
      size: 1,
      children: [],
    },
  };
}

export function fixLayoutData(
  layout: LayoutData,
  groups?: { [key: string]: TabGroup },
  loadTab?: (tab: TabBase) => TabData
): LayoutData {
  function fixPanelOrBox(d: PanelData | BoxData) {
    if (d.id == null) {
      d.id = nextId();
    } else if (d.id.startsWith("+")) {
      const idnum = Number(d.id);
      if (idnum > _idCount) {
        // make sure generated id is unique
        _idCount = idnum;
      }
    }
    const currentSize = d.size;
    if (currentSize === undefined || !(currentSize >= 0)) {
      d.size = 200;
    }
    d.minWidth = 0;
    d.minHeight = 0;
    d.widthFlex = undefined;
    d.heightFlex = undefined;
  }

  function fixPanelData(panel: PanelData): PanelData {
    fixPanelOrBox(panel);
    let findActiveId = false;
    if (loadTab) {
      for (let i = 0; i < panel.tabs.length; ++i) {
        panel.tabs[i] = loadTab(panel.tabs[i]);
      }
    }
    if (panel.group == null && panel.tabs.length) {
      panel.group = panel.tabs[0].group;
    }
    const tabGroup = panel.group ? groups?.[panel.group] : undefined;
    if (tabGroup) {
      if (tabGroup.widthFlex != null) {
        panel.widthFlex = tabGroup.widthFlex;
      }
      if (tabGroup.heightFlex != null) {
        panel.heightFlex = tabGroup.heightFlex;
      }
    }
    for (const child of panel.tabs) {
      child.parent = panel;
      if (child.id === panel.activeId) {
        findActiveId = true;
      }
      const childMinWidth = child.minWidth ?? 0;
      const childMinHeight = child.minHeight ?? 0;
      const panelMinWidth = panel.minWidth ?? 0;
      const panelMinHeight = panel.minHeight ?? 0;
      if (childMinWidth > panelMinWidth) panel.minWidth = childMinWidth;
      if (childMinHeight > panelMinHeight) panel.minHeight = childMinHeight;
    }
    if (!findActiveId && panel.tabs.length) {
      const firstTab = panel.tabs[0];
      if (firstTab && firstTab.id) {
        panel.activeId = firstTab.id;
      }
    }
    const panelMinWidth = panel.minWidth ?? 0;
    const panelMinHeight = panel.minHeight ?? 0;
    if (panelMinWidth <= 0) {
      panel.minWidth = 1;
    }
    if (panelMinHeight <= 0) {
      panel.minHeight = 1;
    }
    const { panelLock } = panel;
    if (panelLock) {
      const lockMinWidth = panelLock.minWidth ?? 0;
      const lockMinHeight = panelLock.minHeight ?? 0;
      if ((panel.minWidth ?? 0) < lockMinWidth) {
        panel.minWidth = lockMinWidth;
      }
      if ((panel.minHeight ?? 0) < lockMinHeight) {
        panel.minHeight = lockMinHeight;
      }
      if (panelLock.widthFlex != null) {
        panel.widthFlex = panelLock.widthFlex;
      }
      if (panelLock.heightFlex != null) {
        panel.heightFlex = panelLock.heightFlex;
      }
    }

    const panelZ = panel.z ?? 0;
    if (panelZ > _zCount) {
      // make sure next zIndex is on top
      _zCount = panelZ;
    }
    return panel;
  }

  function fixBoxData(box: BoxData): BoxData {
    fixPanelOrBox(box);
    for (let i = 0; i < box.children.length; ++i) {
      const child = box.children[i];
      child.parent = box;
      if ("children" in child) {
        fixBoxData(child);
        if (child.children.length === 0) {
          // remove box with no child
          box.children.splice(i, 1);
          --i;
        } else if (child.children.length === 1) {
          // box with one child should be merged back to parent box
          const subChild = child.children[0];
          if ((subChild as BoxData).mode === box.mode) {
            // sub child is another box that can be merged into current box
            let totalSubSize = 0;
            for (const subsubChild of (subChild as BoxData).children) {
              totalSubSize += subsubChild.size ?? 0;
            }
            const childSize = child.size ?? 200;
            const sizeScale = totalSubSize > 0 ? childSize / totalSubSize : 1;
            for (const subsubChild of (subChild as BoxData).children) {
              const subSize = subsubChild.size ?? 0;
              subsubChild.size = subSize * sizeScale;
            }
            // merge children up
            box.children.splice(i, 1, ...(subChild as BoxData).children);
          } else {
            // sub child can be moved up one layer
            subChild.size = child.size ?? 200;
            box.children[i] = subChild;
          }
          --i;
        }
      } else if ("tabs" in child) {
        fixPanelData(child);
        if (child.tabs.length === 0) {
          // remove panel with no tab
          if (!child.panelLock) {
            box.children.splice(i, 1);
            --i;
          } else if (
            child.group === placeHolderStyle &&
            (box.children.length > 1 || box.parent)
          ) {
            // remove placeHolder Group
            box.children.splice(i, 1);
            --i;
          }
        }
      }
      // merge min size
      const childMinWidth = child.minWidth ?? 0;
      const childMinHeight = child.minHeight ?? 0;
      const boxMinWidth = box.minWidth ?? 0;
      const boxMinHeight = box.minHeight ?? 0;
      switch (box.mode) {
        case "horizontal":
          if (childMinWidth > 0) box.minWidth = boxMinWidth + childMinWidth;
          if (childMinHeight > boxMinHeight) box.minHeight = childMinHeight;
          if (child.widthFlex != null) {
            box.widthFlex = maxFlex(box.widthFlex ?? 1, child.widthFlex);
          }
          if (child.heightFlex != null) {
            box.heightFlex = mergeFlex(box.heightFlex ?? 1, child.heightFlex);
          }
          break;
        case "vertical":
          if (childMinWidth > boxMinWidth) box.minWidth = childMinWidth;
          if (childMinHeight > 0) box.minHeight = boxMinHeight + childMinHeight;
          if (child.heightFlex != null) {
            box.heightFlex = maxFlex(box.heightFlex ?? 1, child.heightFlex);
          }
          if (child.widthFlex != null) {
            box.widthFlex = mergeFlex(box.widthFlex ?? 1, child.widthFlex);
          }
          break;
      }
    }
    // add divider size
    if (box.children.length > 1) {
      switch (box.mode) {
        case "horizontal":
          box.minWidth = (box.minWidth ?? 0) + (box.children.length - 1) * 4;
          break;
        case "vertical":
          box.minHeight = (box.minHeight ?? 0) + (box.children.length - 1) * 4;
          break;
      }
    }

    return box;
  }

  if (layout.floatbox) {
    layout.floatbox.mode = "float";
  } else {
    layout.floatbox = { mode: "float", children: [], size: 1 };
  }

  if (layout.windowbox) {
    layout.windowbox.mode = "window";
  } else {
    layout.windowbox = { mode: "window", children: [], size: 1 };
  }

  if (layout.maxbox) {
    layout.maxbox.mode = "maximize";
  } else {
    layout.maxbox = { mode: "maximize", children: [], size: 1 };
  }

  fixBoxData(layout.dockbox);
  fixBoxData(layout.floatbox);
  fixBoxData(layout.windowbox);
  fixBoxData(layout.maxbox);

  if (layout.dockbox.children.length === 0) {
    // add place holder panel when root box is empty
    // group 속성을 설정하지 않아서 "place-holder"가 추가되지 않도록 함
    const newPanel: PanelData = {
      id: "+0",
      // group: placeHolderStyle, // group 속성 제거
      panelLock: {},
      size: 200,
      tabs: [],
    };
    newPanel.parent = layout.dockbox;
    layout.dockbox.children.push(newPanel);
  } else {
    // merge and replace root box when box has only one child
    while (
      layout.dockbox.children.length === 1 &&
      "children" in layout.dockbox.children[0]
    ) {
      const newDockBox = clone(layout.dockbox.children[0] as BoxData);
      layout.dockbox = newDockBox;
      for (const child of newDockBox.children) {
        child.parent = newDockBox;
      }
    }
  }
  layout.dockbox.parent = undefined;
  if (layout.floatbox) {
    layout.floatbox.parent = undefined;
  }
  if (layout.windowbox) {
    layout.windowbox.parent = undefined;
  }
  if (layout.maxbox) {
    layout.maxbox.parent = undefined;
  }
  clearObjectCache();
  return layout;
}

export function replacePanel(
  layout: LayoutData,
  panel: PanelData,
  newPanel: PanelData
): LayoutData {
  for (const tab of newPanel.tabs) {
    tab.parent = newPanel;
  }

  const box = panel.parent;
  if (box) {
    const pos = box.children.indexOf(panel);
    if (pos >= 0) {
      const newBox = clone(box);
      newBox.children[pos] = newPanel;
      return replaceBox(layout, box, newBox);
    }
  }
  return layout;
}

function replaceBox(
  layout: LayoutData,
  box: BoxData,
  newBox: BoxData
): LayoutData {
  for (const child of newBox.children) {
    child.parent = newBox;
  }

  const parentBox = box.parent;
  if (parentBox) {
    const pos = parentBox.children.indexOf(box);
    if (pos >= 0) {
      const newParentBox = clone(parentBox);
      newParentBox.children[pos] = newBox;
      return replaceBox(layout, parentBox, newParentBox);
    }
  } else {
    if (box.id === layout.dockbox.id || box === layout.dockbox) {
      return { ...layout, dockbox: newBox };
    } else if (layout.floatbox && (box.id === layout.floatbox.id || box === layout.floatbox)) {
      return { ...layout, floatbox: newBox };
    } else if (layout.windowbox && (box.id === layout.windowbox.id || box === layout.windowbox)) {
      return { ...layout, windowbox: newBox };
    } else if (layout.maxbox && (box.id === layout.maxbox.id || box === layout.maxbox)) {
      return { ...layout, maxbox: newBox };
    }
  }
  return layout;
}

export function getFloatPanelSize(panel: HTMLElement, tabGroup: TabGroup) {
  if (!panel) {
    return [300, 300];
  }
  let panelWidth = panel.offsetWidth;
  let panelHeight = panel.offsetHeight;

  const [minWidth, maxWidth] = tabGroup.preferredFloatWidth || [100, 600];
  const [minHeight, maxHeight] = tabGroup.preferredFloatHeight || [50, 500];
  if (!(panelWidth >= minWidth)) {
    panelWidth = minWidth;
  } else if (!(panelWidth <= maxWidth)) {
    panelWidth = maxWidth;
  }
  if (!(panelHeight >= minHeight)) {
    panelHeight = minHeight;
  } else if (!(panelHeight <= maxHeight)) {
    panelHeight = maxHeight;
  }

  return [panelWidth, panelHeight];
}

export function findNearestPanel(
  rectFrom: DOMRect,
  rectTo: DOMRect,
  direction: string
): number {
  let distance = -1;
  let overlap = -1;
  let alignment = 0;
  switch (direction) {
    case "ArrowUp": {
      distance = rectFrom.top - rectTo.bottom + rectFrom.height;
      overlap =
        Math.min(rectFrom.right, rectTo.right) -
        Math.max(rectFrom.left, rectTo.left);
      break;
    }
    case "ArrowDown": {
      distance = rectTo.top - rectFrom.bottom + rectFrom.height;
      overlap =
        Math.min(rectFrom.right, rectTo.right) -
        Math.max(rectFrom.left, rectTo.left);
      break;
    }
    case "ArrowLeft": {
      distance = rectFrom.left - rectTo.right + rectFrom.width;
      overlap =
        Math.min(rectFrom.bottom, rectTo.bottom) -
        Math.max(rectFrom.top, rectTo.top);
      alignment = Math.abs(rectFrom.top - rectTo.top);
      break;
    }
    case "ArrowRight": {
      distance = rectTo.left - rectFrom.right + rectFrom.width;
      overlap =
        Math.min(rectFrom.bottom, rectTo.bottom) -
        Math.max(rectFrom.top, rectTo.top);
      alignment = Math.abs(rectFrom.top - rectTo.top);
      break;
    }
  }
  if (distance < 0 || overlap <= 0) {
    return -1;
  }

  return distance * (alignment + 1) - overlap * 0.001;
}
