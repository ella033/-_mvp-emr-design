"use client";

import { createStore } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  DockLayout,
  DockDragState,
  DockTarget,
  DockPosition,
  PanelNode,
  FloatPanelData,
  TabData,
  TabId,
  NodeId,
  LayoutNode,
} from "../types";
import * as TreeUtils from "./layout-tree-utils";

// ===== Initial Drag State =====
const INITIAL_DRAG_STATE: DockDragState = {
  isDragging: false,
  dragItemType: null,
  dragTabId: null,
  sourcePanelId: null,
  pointerPosition: null,
  dockTarget: null,
  previewRect: null,
  sourcePanelRect: null,
  dragOffset: null,
};

// ===== Store Interface =====
export interface DockWorkspaceState {
  // ============ Layout State ============
  layout: DockLayout;

  // ============ Config ============
  /** Whether tabs can be detached to float panels by dragging outside (default: true) */
  floatable: boolean;

  // ============ Drag State ============
  drag: DockDragState;

  // ============ Float z-index counter ============
  nextFloatZ: number;

  // ============ Layout Mutations ============
  setLayout: (layout: DockLayout) => void;

  // --- Tab operations ---
  addTab: (panelId: NodeId, tab: TabData, index?: number) => void;
  removeTab: (panelId: NodeId, tabId: TabId) => void;
  moveTab: (
    sourcePanelId: NodeId,
    targetPanelId: NodeId,
    tabId: TabId,
    position: DockPosition
  ) => void;
  setActiveTab: (panelId: NodeId, tabId: TabId) => void;
  updateTab: (
    panelId: NodeId,
    tabId: TabId,
    updates: Partial<TabData>
  ) => void;

  // --- Panel operations ---
  addPanel: (
    targetNodeId: NodeId,
    position: DockPosition,
    panel: PanelNode
  ) => void;
  removePanel: (panelId: NodeId) => void;

  // --- Resize operations ---
  resizeSplit: (
    boxId: NodeId,
    childIndex: number,
    pixelDelta: number,
    totalSize: number
  ) => void;

  // ============ Drag Actions ============
  startDrag: (
    tabId: TabId,
    sourcePanelId: NodeId,
    pointerPosition: { x: number; y: number },
    sourcePanelRect?: { width: number; height: number },
    dragOffset?: { x: number; y: number }
  ) => void;
  /** Updates only the pointer position, preserving existing dockTarget/previewRect */
  updatePointerPosition: (
    pointerPosition: { x: number; y: number }
  ) => void;
  /** Updates dock target and preview rect (called by DropZone hit-testing) */
  updateDrag: (
    pointerPosition: { x: number; y: number },
    dockTarget: DockTarget | null,
    previewRect: DockDragState["previewRect"]
  ) => void;
  endDrag: () => void;
  cancelDrag: () => void;

  // ============ Float Panel Actions ============
  addFloatPanel: (panel: PanelNode, x: number, y: number, width: number, height: number) => void;
  removeFloatPanel: (floatId: NodeId) => void;
  updateFloatPanel: (floatId: NodeId, updates: Partial<Omit<FloatPanelData, "id" | "panel">>) => void;
  bringFloatToFront: (floatId: NodeId) => void;
  /** Detach a tab from docked layout into a floating panel */
  detachToFloat: (panelId: NodeId, tabId: TabId, x: number, y: number, width: number, height: number) => void;
  /** Dock a floating panel back into the layout */
  dockFloatPanel: (floatId: NodeId, targetPanelId: NodeId, position: DockPosition) => void;

  // ============ Query Helpers ============
  findPanelById: (panelId: NodeId) => PanelNode | null;
  findTabById: (
    tabId: TabId
  ) => { panel: PanelNode; tab: TabData } | null;
  findNodeById: (nodeId: NodeId) => LayoutNode | null;
}

// ===== Store Factory =====

/**
 * Creates a scoped DockWorkspace store instance.
 * Each DockWorkspace component creates its own store via React context.
 */
export function createDockWorkspaceStore(initialLayout: DockLayout) {
  return createStore<DockWorkspaceState>()(
    devtools(
      (set, get) => ({
        // ============ Initial State ============
        layout: initialLayout,
        floatable: true,
        drag: { ...INITIAL_DRAG_STATE },
        nextFloatZ: 200,

        // ============ Layout Mutations ============
        setLayout: (layout) => set({ layout }),

        addTab: (panelId, tab, index) =>
          set((state) => ({
            layout: TreeUtils.addTabToPanel(
              state.layout,
              panelId,
              tab,
              index
            ),
          })),

        removeTab: (panelId, tabId) =>
          set((state) => ({
            layout: TreeUtils.cleanupLayout(
              TreeUtils.removeTabFromPanel(state.layout, panelId, tabId)
            ),
          })),

        moveTab: (sourcePanelId, targetPanelId, tabId, position) =>
          set((state) => ({
            layout: TreeUtils.moveTab(
              state.layout,
              sourcePanelId,
              targetPanelId,
              tabId,
              position
            ),
          })),

        setActiveTab: (panelId, tabId) =>
          set((state) => ({
            layout: TreeUtils.setActiveTab(state.layout, panelId, tabId),
          })),

        updateTab: (panelId, tabId, updates) =>
          set((state) => ({
            layout: TreeUtils.updateTab(
              state.layout,
              panelId,
              tabId,
              updates
            ),
          })),

        addPanel: (targetNodeId, position, panel) =>
          set((state) => ({
            layout: TreeUtils.addPanel(
              state.layout,
              targetNodeId,
              position,
              panel
            ),
          })),

        removePanel: (panelId) =>
          set((state) => ({
            layout: TreeUtils.removePanel(state.layout, panelId),
          })),

        resizeSplit: (boxId, childIndex, pixelDelta, totalSize) =>
          set((state) => ({
            layout: TreeUtils.resizeSplit(
              state.layout,
              boxId,
              childIndex,
              pixelDelta,
              totalSize
            ),
          })),

        // ============ Drag Actions ============
        startDrag: (tabId, sourcePanelId, pointerPosition, sourcePanelRect, dragOffset) =>
          set({
            drag: {
              isDragging: true,
              dragItemType: "tab",
              dragTabId: tabId,
              sourcePanelId,
              pointerPosition,
              dockTarget: null,
              previewRect: null,
              sourcePanelRect: sourcePanelRect ?? null,
              dragOffset: dragOffset ?? null,
            },
          }),

        updatePointerPosition: (pointerPosition) =>
          set((state) => ({
            drag: {
              ...state.drag,
              pointerPosition,
            },
          })),

        updateDrag: (pointerPosition, dockTarget, previewRect) =>
          set((state) => ({
            drag: {
              ...state.drag,
              pointerPosition,
              dockTarget,
              previewRect,
            },
          })),

        endDrag: () => {
          const { drag } = get();
          if (!drag.dragTabId || !drag.sourcePanelId || !drag.pointerPosition) {
            set({ drag: { ...INITIAL_DRAG_STATE } });
            return;
          }

          // DropZoneManager의 useEffect는 비동기이므로 drag.dockTarget이 stale할 수 있다.
          // 포인터 위치에서 직접 DOM 확인하여 실제로 도킹된 패널 위에 있는지 검증한다.
          const elementsAtPointer = document.elementsFromPoint(
            drag.pointerPosition.x,
            drag.pointerPosition.y
          );
          // Only consider docked panels (exclude float panels)
          const panelEl = elementsAtPointer.find((el) =>
            (el as HTMLElement).hasAttribute?.("data-panel-id") &&
            !(el as HTMLElement).closest(".dock-float-panel")
          );

          // Check if source is a float panel
          const sourceFloat = (get().layout.floatbox ?? []).find(
            (f) => f.panel.id === drag.sourcePanelId
          );

          if (drag.dockTarget && panelEl) {
            if (sourceFloat) {
              // Float → dock: remove tab from float panel, add to dock target
              const tab = sourceFloat.panel.tabs.find((t) => t.id === drag.dragTabId);
              if (tab) {
                const remainingTabs = sourceFloat.panel.tabs.filter((t) => t.id !== drag.dragTabId);
                const updatedFloatbox = remainingTabs.length > 0
                  ? (get().layout.floatbox ?? []).map((f) =>
                      f.id === sourceFloat.id
                        ? {
                            ...f,
                            panel: {
                              ...f.panel,
                              tabs: remainingTabs,
                              activeTabId: remainingTabs[0]?.id ?? "",
                            },
                          }
                        : f
                    )
                  : (get().layout.floatbox ?? []).filter((f) => f.id !== sourceFloat.id);

                let newLayout: DockLayout = { ...get().layout, floatbox: updatedFloatbox };

                if (drag.dockTarget.position === "center") {
                  newLayout = TreeUtils.addTabToPanel(newLayout, drag.dockTarget.targetPanelId, tab);
                } else {
                  const newPanel = TreeUtils.createPanelNode([tab], { group: tab.group });
                  newLayout = TreeUtils.splitPanel(newLayout, drag.dockTarget.targetPanelId, newPanel, drag.dockTarget.position);
                }

                set({ layout: newLayout });
              }
            } else {
              // Dock → dock (normal case)
              get().moveTab(
                drag.sourcePanelId,
                drag.dockTarget.targetPanelId,
                drag.dragTabId,
                drag.dockTarget.position
              );
            }
          } else if (!sourceFloat && get().floatable) {
            // No docked panel under pointer, source is docked → detach to float
            const sourcePanel = get().findPanelById(drag.sourcePanelId);
            const tab = sourcePanel?.tabs.find((t) => t.id === drag.dragTabId);

            // Block if panel has noFloat lock or tab is locked
            if (!sourcePanel?.panelLock?.noFloat && !tab?.locked) {
              const width = drag.sourcePanelRect?.width ?? 400;
              const height = drag.sourcePanelRect?.height ?? 300;
              const offsetX = drag.dragOffset?.x ?? 0;
              const offsetY = drag.dragOffset?.y ?? 0;

              get().detachToFloat(
                drag.sourcePanelId,
                drag.dragTabId,
                drag.pointerPosition.x - offsetX,
                drag.pointerPosition.y - offsetY,
                width,
                height
              );
            }
          } else if (sourceFloat) {
            // Source is float, no dock target → move float panel to new position
            const offsetX = drag.dragOffset?.x ?? 0;
            const offsetY = drag.dragOffset?.y ?? 0;
            get().updateFloatPanel(sourceFloat.id, {
              x: drag.pointerPosition.x - offsetX,
              y: drag.pointerPosition.y - offsetY,
            });
          }

          set({ drag: { ...INITIAL_DRAG_STATE } });
        },

        cancelDrag: () => set({ drag: { ...INITIAL_DRAG_STATE } }),

        // ============ Float Panel Actions ============
        addFloatPanel: (panel, x, y, width, height) =>
          set((state) => {
            const floatPanel: FloatPanelData = {
              id: panel.id,
              panel,
              x,
              y,
              width,
              height,
              zIndex: state.nextFloatZ,
            };
            return {
              layout: {
                ...state.layout,
                floatbox: [...(state.layout.floatbox ?? []), floatPanel],
              },
              nextFloatZ: state.nextFloatZ + 1,
            };
          }),

        removeFloatPanel: (floatId) =>
          set((state) => ({
            layout: {
              ...state.layout,
              floatbox: (state.layout.floatbox ?? []).filter((f) => f.id !== floatId),
            },
          })),

        updateFloatPanel: (floatId, updates) =>
          set((state) => ({
            layout: {
              ...state.layout,
              floatbox: (state.layout.floatbox ?? []).map((f) =>
                f.id === floatId ? { ...f, ...updates } : f
              ),
            },
          })),

        bringFloatToFront: (floatId) =>
          set((state) => ({
            layout: {
              ...state.layout,
              floatbox: (state.layout.floatbox ?? []).map((f) =>
                f.id === floatId ? { ...f, zIndex: state.nextFloatZ } : f
              ),
            },
            nextFloatZ: state.nextFloatZ + 1,
          })),

        detachToFloat: (panelId, tabId, x, y, width, height) => {
          const state = get();
          const tabInfo = TreeUtils.findTabById(state.layout, tabId);
          if (!tabInfo) return;

          const tab = { ...tabInfo.tab };
          // Remove from docked layout
          let newLayout = TreeUtils.removeTabFromPanel(state.layout, panelId, tabId);
          newLayout = TreeUtils.cleanupLayout(newLayout);

          // Create float panel
          const floatPanel: FloatPanelData = {
            id: TreeUtils.createPanelNode([tab], { group: tab.group }).id,
            panel: TreeUtils.createPanelNode([tab], { group: tab.group }),
            x,
            y,
            width,
            height,
            zIndex: state.nextFloatZ,
          };

          set({
            layout: {
              ...newLayout,
              floatbox: [...(newLayout.floatbox ?? []), floatPanel],
            },
            nextFloatZ: state.nextFloatZ + 1,
          });
        },

        dockFloatPanel: (floatId, targetPanelId, position) => {
          const state = get();
          const floatPanel = (state.layout.floatbox ?? []).find((f) => f.id === floatId);
          if (!floatPanel) return;

          // Remove from floatbox
          const newFloatbox = (state.layout.floatbox ?? []).filter((f) => f.id !== floatId);
          let newLayout: DockLayout = { ...state.layout, floatbox: newFloatbox };

          // Add tabs to docked layout
          if (position === "center") {
            for (const tab of floatPanel.panel.tabs) {
              newLayout = TreeUtils.addTabToPanel(newLayout, targetPanelId, tab);
            }
          } else {
            newLayout = TreeUtils.splitPanel(newLayout, targetPanelId, floatPanel.panel, position);
          }

          set({ layout: newLayout });
        },

        // ============ Query Helpers ============
        findPanelById: (panelId) =>
          TreeUtils.findPanelById(get().layout, panelId),

        findTabById: (tabId) =>
          TreeUtils.findTabById(get().layout, tabId),

        findNodeById: (nodeId) =>
          TreeUtils.findNodeById(get().layout, nodeId),
      }),
      { name: "dock-workspace" }
    )
  );
}

// ===== Store type =====
export type DockWorkspaceStore = ReturnType<typeof createDockWorkspaceStore>;
