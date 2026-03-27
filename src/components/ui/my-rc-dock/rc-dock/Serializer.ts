// @ts-nocheck
import {
  BoxData,
  LayoutData,
  PanelData,
  BoxBase,
  LayoutBase,
  PanelBase,
  TabBase,
  TabData,
  maximePlaceHolderId,
} from "./DockData";
import { nextId } from "./Algorithm";

interface DefaultLayoutCache {
  panels: Map<string, PanelData>;
  tabs: Map<string, TabData>;
}

function addPanelToCache(panelData: PanelData, cache: DefaultLayoutCache) {
  if (panelData.id) {
    cache.panels.set(panelData.id, panelData);
  }
  for (let tab of panelData.tabs) {
    if (tab.id) {
      cache.tabs.set(tab.id, tab);
    }
  }
}

function addBoxToCache(boxData: BoxData, cache: DefaultLayoutCache) {
  for (let child of boxData.children) {
    if ("tabs" in child) {
      addPanelToCache(child, cache);
    } else if ("children" in child) {
      addBoxToCache(child, cache);
    }
  }
}

export function createLayoutCache(
  defaultLayout: LayoutData | BoxData
): DefaultLayoutCache {
  let cache: DefaultLayoutCache = {
    panels: new Map(),
    tabs: new Map(),
  };
  if (defaultLayout) {
    if ("children" in defaultLayout) {
      // BoxData
      addBoxToCache(defaultLayout, cache);
    } else {
      // LayoutData
      if ("dockbox" in defaultLayout) {
        addBoxToCache(defaultLayout.dockbox, cache);
      }
      if ("floatbox" in defaultLayout && defaultLayout.floatbox) {
        addBoxToCache(defaultLayout.floatbox, cache);
      }
    }
  }

  return cache;
}

export function saveLayoutData(
  layout: LayoutData,
  saveTab?: (tab: TabData) => TabBase,
  afterPanelSaved?: (savedPanel: PanelBase, panel: PanelData) => void
): LayoutBase {
  function saveTabData(tabData: TabData): TabBase {
    return saveTab ? saveTab(tabData) : { id: tabData.id };
  }

  function savePanelData(panelData: PanelData): PanelBase {
    let tabs: TabBase[] = [];
    for (let tab of panelData.tabs) {
      let savedTab = saveTabData(tab);
      if (savedTab) {
        tabs.push(savedTab);
      }
    }
    let { id, size, activeId, group, panelLock } = panelData;
    let savedPanel: PanelBase;
    if (
      panelData.parent?.mode === "float" ||
      panelData.parent?.mode === "window"
    ) {
      let { x, y, z, w, h } = panelData;
      savedPanel = {
        id,
        size,
        tabs,
        group,
        activeId,
        panelLock,
        x,
        y,
        z,
        w,
        h,
      };
      if (panelData.parent?.mode === "float") {
        if (panelData.minimized) savedPanel.minimized = true;
        if (panelData._floatRestoreY != null)
          savedPanel._floatRestoreY = panelData._floatRestoreY;
        if (panelData._floatRestoreH != null)
          savedPanel._floatRestoreH = panelData._floatRestoreH;
        if (panelData._wasMaximized) savedPanel._wasMaximized = true;
      }
    } else {
      savedPanel = { id, size, tabs, group, activeId, panelLock };
    }
    if (afterPanelSaved) {
      afterPanelSaved(savedPanel, panelData);
    }
    return savedPanel;
  }

  function saveBoxData(boxData: BoxData): BoxBase {
    let children: (BoxBase | PanelBase)[] = [];
    for (let child of boxData.children) {
      if ("tabs" in child) {
        children.push(savePanelData(child));
      } else if ("children" in child) {
        children.push(saveBoxData(child));
      }
    }
    let { id, size, mode } = boxData;
    return { id, size, mode, children };
  }

  return {
    dockbox: saveBoxData(layout.dockbox),
    floatbox: layout.floatbox ? saveBoxData(layout.floatbox) : { mode: "float" as const, children: [], size: 0, id: "" },
    windowbox: layout.windowbox ? saveBoxData(layout.windowbox) : { mode: "window" as const, children: [], size: 0, id: "" },
    maxbox: layout.maxbox ? saveBoxData(layout.maxbox) : { mode: "maximize" as const, children: [], size: 1, id: "" },
  };
}

export function loadLayoutData(
  savedLayout: LayoutBase,
  defaultLayout: LayoutData,
  loadTab?: (savedTab: TabBase) => TabData,
  afterPanelLoaded?: (savedPanel: PanelBase, panel: PanelData) => void
): LayoutData {
  let cache = createLayoutCache(defaultLayout);

  function loadTabData(savedTab: TabBase): TabData | null {
    if (loadTab) {
      return loadTab(savedTab);
    }
    let { id } = savedTab;
    if (id && cache.tabs.has(id)) {
      const tab = cache.tabs.get(id);
      if (tab) {
        return tab;
      }
    }
    return null;
  }

  function loadPanelData(savedPanel: PanelBase): PanelData {
    let {
      id,
      size,
      activeId,
      x,
      y,
      z,
      w,
      h,
      group,
      panelLock,
      minimized,
      _floatRestoreY,
      _floatRestoreH,
      _wasMaximized,
    } = savedPanel;
    if (!id) {
      throw new Error("Panel id is required");
    }

    let tabs: TabData[] = [];
    for (let savedTab of savedPanel.tabs) {
      let tabData = loadTabData(savedTab);
      if (tabData) {
        tabs.push(tabData);
      }
    }
    let panelData: PanelData;
    if (w || h || x || y || z) {
      panelData = { id, size, activeId, group, x, y, z, w, h, tabs, panelLock };
      if (minimized) panelData.minimized = true;
      if (_floatRestoreY != null) panelData._floatRestoreY = _floatRestoreY;
      if (_floatRestoreH != null) panelData._floatRestoreH = _floatRestoreH;
      if (_wasMaximized) panelData._wasMaximized = true;
    } else {
      panelData = { id, size, activeId, group, tabs, panelLock };
    }
    if (savedPanel.id === maximePlaceHolderId) {
      panelData.panelLock = {};
    } else if (afterPanelLoaded) {
      afterPanelLoaded(savedPanel, panelData);
      } else if (cache.panels.has(id)) {
      const cachedPanel = cache.panels.get(id);
      if (cachedPanel) {
        panelData = { ...cachedPanel, ...panelData };
      }
    }
    return panelData;
  }

  function loadBoxData(savedBox: BoxBase): BoxData | null {
    if (!savedBox) {
      return null;
    }
    let children: (BoxData | PanelData)[] = [];
    for (let child of savedBox.children) {
      if ("tabs" in child) {
        const panel = loadPanelData(child);
        if (panel) {
          children.push(panel);
        }
      } else if ("children" in child) {
        const box = loadBoxData(child);
        if (box) {
          children.push(box);
        }
      }
    }
    let { id, size, mode } = savedBox;
    // id가 없으면 자동 생성 (기존 저장된 레이아웃과의 호환성을 위해)
    if (!id) {
      id = nextId();
    }
    return { id, size, mode, children };
  }

  const dockbox = loadBoxData(savedLayout.dockbox);
  if (!dockbox) {
    throw new Error("Failed to load dockbox");
  }
  const floatbox = loadBoxData(
    savedLayout.floatbox ?? { mode: "float", children: [], size: 0, id: "" }
  );
  if (!floatbox) {
    throw new Error("Failed to load floatbox");
  }
  const windowbox = loadBoxData(
    savedLayout.windowbox ?? { mode: "window", children: [], size: 0, id: "" }
  );
  if (!windowbox) {
    throw new Error("Failed to load windowbox");
  }
  const maxbox = loadBoxData(
    savedLayout.maxbox ?? { mode: "maximize", children: [], size: 1, id: "" }
  );
  if (!maxbox) {
    throw new Error("Failed to load maxbox");
  }
  
  return {
    dockbox,
    floatbox,
    windowbox,
    maxbox,
  };
}
