"use client";

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useStore } from "zustand";
import {
  createDockWorkspaceStore,
  type DockWorkspaceStore,
  type DockWorkspaceState,
} from "../store/dock-workspace-store";
import { serializeLayout, deserializeLayout } from "../store/serialization";
import type {
  DockLayout,
  DockWorkspaceProps,
  DockWorkspaceRef,
  TabContentLoader,
  PanelExtraRenderer,
  TabData,
  SerializedLayout,
  GroupConfig,
  LayoutNode,
} from "../types";
import { BoxNodeComponent } from "./BoxNode";
import { DockPreview } from "./DockPreview";
import { DragOverlayComponent } from "./DragOverlay";
import { DockTargetIndicator } from "./DockTargetIndicator";
import { FloatPanelComponent } from "./FloatPanel";
import { useLayoutPersistence } from "../hooks/use-layout-persistence";
import "../styles/dock-workspace.css";

// ===== Context =====

interface DockWorkspaceContextValue {
  store: DockWorkspaceStore;
  loadTab: TabContentLoader;
  panelExtra?: PanelExtraRenderer;
  panelExtraLeft?: PanelExtraRenderer;
  groups?: Record<string, GroupConfig>;
  theme: "light" | "dark";
  floatClosable: boolean;
  onTabClick?: (tabId: string, panelId: string) => void;
  onTabClose?: (tabId: string, panelId: string) => boolean | void;
  onPanelFocus?: (panelId: string) => void;
}

const DockWorkspaceContext = createContext<DockWorkspaceContextValue | null>(
  null
);

export function useDockWorkspaceContext() {
  const ctx = useContext(DockWorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useDockWorkspaceContext must be used within <DockWorkspace>"
    );
  }
  return ctx;
}

/** Zustand selector hook scoped to the workspace's store */
export function useDockStore<T>(selector: (state: DockWorkspaceState) => T): T {
  const { store } = useDockWorkspaceContext();
  return useStore(store, selector);
}

// ===== Component =====

export const DockWorkspace = forwardRef<DockWorkspaceRef, DockWorkspaceProps>(
  function DockWorkspace(
    {
      defaultLayout,
      layout: controlledLayout,
      onLayoutChange,
      loadTab,
      panelExtra,
      panelExtraLeft,
      settingsConfig,
      enableAutoSave,
      groups,
      floatable = true,
      floatClosable = false,
      className = "",
      style,
      theme = "light",
      onTabClick,
      onTabClose,
      onPanelFocus,
    },
    ref
  ) {
    // ===== Store Creation =====
    const initialLayout = controlledLayout ?? defaultLayout;
    if (!initialLayout) {
      throw new Error(
        "DockWorkspace requires either `defaultLayout` or `layout` prop"
      );
    }

    const storeRef = useRef<DockWorkspaceStore | null>(null);
    if (!storeRef.current) {
      storeRef.current = createDockWorkspaceStore(initialLayout);
    }
    const store = storeRef.current;

    // ===== Sync floatable config to store =====
    useEffect(() => {
      store.setState({ floatable });
    }, [floatable, store]);

    // ===== Controlled Layout Sync =====
    useEffect(() => {
      if (controlledLayout) {
        store.getState().setLayout(controlledLayout);
      }
    }, [controlledLayout, store]);

    // ===== Layout Change Callback =====
    useEffect(() => {
      if (!onLayoutChange) return;
      const unsub = store.subscribe((state, prevState) => {
        if (state.layout !== prevState.layout) {
          onLayoutChange(state.layout);
        }
      });
      return unsub;
    }, [store, onLayoutChange]);

    // ===== Tab Registry for deserialization =====
    const tabRegistryRef = useRef(new Map<string, TabData>());

    const updateTabRegistry = useCallback(
      (layout: DockLayout) => {
        const collectTabs = (
          node: LayoutNode
        ): void => {
          if (node.type === "panel") {
            for (const tab of node.tabs) {
              tabRegistryRef.current.set(tab.id, tab);
            }
          } else if (node.type === "box") {
            for (const child of node.children) {
              collectTabs(child);
            }
          }
        };
        tabRegistryRef.current.clear();
        collectTabs(layout.dockbox);
      },
      []
    );

    // Build registry from initial layout
    useEffect(() => {
      updateTabRegistry(store.getState().layout);
    }, [store, updateTabRegistry]);

    // ===== Layout Persistence (server-backed) =====
    useLayoutPersistence({
      store,
      settingsConfig,
      enableAutoSave,
      tabRegistry: tabRegistryRef,
      onLayoutChange,
    });

    // ===== Imperative Handle =====
    useImperativeHandle(
      ref,
      () => ({
        saveLayout: () => serializeLayout(store.getState().layout),
        loadLayout: (serialized: SerializedLayout) => {
          const deserialized = deserializeLayout(
            serialized,
            tabRegistryRef.current
          );
          store.getState().setLayout(deserialized);
        },
        getCurrentLayout: () => store.getState().layout,
        resetLayout: () => {
          if (initialLayout) {
            store.getState().setLayout(initialLayout);
          }
        },
        addTab: (panelId, tab, index) =>
          store.getState().addTab(panelId, tab, index),
        removeTab: (panelId, tabId) =>
          store.getState().removeTab(panelId, tabId),
        addPanel: (targetNodeId, position, panel) =>
          store.getState().addPanel(targetNodeId, position, panel),
        removePanel: (panelId) => store.getState().removePanel(panelId),
        find: (nodeId) => store.getState().findNodeById(nodeId),
        updateTab: (tabId, updates) => {
          const found = store.getState().findTabById(tabId);
          if (found) {
            store.getState().updateTab(found.panel.id, tabId, updates);
          }
        },
        dockMove: (sourceTabId, targetPanelId, position) => {
          const found = store.getState().findTabById(sourceTabId);
          if (found) {
            store
              .getState()
              .moveTab(
                found.panel.id,
                targetPanelId,
                sourceTabId,
                position
              );
          }
        },
      }),
      [store, initialLayout]
    );

    // ===== Layout from store =====
    const dockbox = useStore(store, (s) => s.layout.dockbox);
    const floatbox = useStore(store, (s) => s.layout.floatbox);
    const containerRef = useRef<HTMLDivElement>(null);

    // ===== Context Value =====
    const contextValue = useMemo<DockWorkspaceContextValue>(
      () => ({
        store,
        loadTab,
        panelExtra,
        panelExtraLeft,
        groups,
        theme,
        floatClosable,
        onTabClick,
        onTabClose,
        onPanelFocus,
      }),
      [store, loadTab, panelExtra, panelExtraLeft, groups, theme, floatClosable, onTabClick, onTabClose, onPanelFocus]
    );

    // ===== Render =====
    return (
      <DockWorkspaceContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          className={`dock-workspace ${className}`}
          style={style}
          data-theme={theme}
        >
          <BoxNodeComponent node={dockbox} />
          {floatbox?.map((fp) => (
            <FloatPanelComponent key={fp.id} floatPanel={fp} />
          ))}
          <DockPreview />
          <DockTargetIndicator />
          <DragOverlayComponent />
        </div>
      </DockWorkspaceContext.Provider>
    );
  }
);

DockWorkspace.displayName = "DockWorkspace";
