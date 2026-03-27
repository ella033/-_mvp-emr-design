"use client";

import React, { useCallback, useRef } from "react";
import type { TabData, PanelLockConfig, PanelExtraRenderer, NodeId } from "../types";
import { Tab } from "./Tab";
import { useDockStore } from "./DockWorkspace";
import { DEFAULT_DRAG_THRESHOLD } from "../constants";

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string;
  panelId: NodeId;
  onTabSelect: (tabId: string) => void;
  panelExtra?: PanelExtraRenderer;
  panelExtraLeft?: PanelExtraRenderer;
  activeTab?: TabData;
  panelLock?: PanelLockConfig;
}

export const TabBar = React.memo(function TabBar({
  tabs,
  activeTabId,
  panelId,
  onTabSelect,
  panelExtra,
  panelExtraLeft,
  activeTab,
  panelLock,
}: TabBarProps) {
  const startDrag = useDockStore((s) => s.startDrag);
  const updatePointerPosition = useDockStore((s) => s.updatePointerPosition);
  const endDrag = useDockStore((s) => s.endDrag);
  const cancelDrag = useDockStore((s) => s.cancelDrag);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleTabClick = useCallback(
    (tabId: string) => {
      onTabSelect(tabId);
    },
    [onTabSelect]
  );

  // Tab bar empty area drag: drags the active tab (effectively moves the panel)
  const handleTabBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || panelLock?.locked) return;

      // Only trigger on the tab bar itself, its empty area, or the extra zone — not on individual tabs or interactive elements
      const target = e.target as HTMLElement;
      if (target.closest(".dock-tab")) return;
      if (target.closest("[data-tab-close]")) return;
      if (target.closest("button")) return;
      if (target.closest("select")) return;
      if (target.closest("input")) return;

      // Need an active tab to drag
      const dragTabId = activeTabId;
      if (!dragTabId) return;

      // Check if the active tab is locked
      const tab = tabs.find((t) => t.id === dragTabId);
      if (tab?.locked) return;

      e.preventDefault();

      dragStartPos.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartPos.current) return;

        const dx = Math.abs(moveEvent.clientX - dragStartPos.current.x);
        const dy = Math.abs(moveEvent.clientY - dragStartPos.current.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!isDraggingRef.current && distance >= DEFAULT_DRAG_THRESHOLD) {
          isDraggingRef.current = true;
          const panelEl = document.querySelector(`[data-panel-id="${panelId}"]`);
          const panelRect = panelEl?.getBoundingClientRect();
          startDrag(
            dragTabId,
            panelId,
            { x: moveEvent.clientX, y: moveEvent.clientY },
            panelRect ? { width: panelRect.width, height: panelRect.height } : undefined,
            panelRect ? { x: moveEvent.clientX - panelRect.left, y: moveEvent.clientY - panelRect.top } : undefined
          );
        }

        if (isDraggingRef.current) {
          updatePointerPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        if (isDraggingRef.current) {
          endDrag();
        }

        dragStartPos.current = null;
        isDraggingRef.current = false;
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [panelLock?.locked, activeTabId, tabs, panelId, startDrag, updatePointerPosition, endDrag]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrag();
      }
    },
    [cancelDrag]
  );

  const isDraggable = !panelLock?.locked;

  return (
    <div
      className={`dock-tab-bar ${isDraggable ? "dock-tab-bar--draggable" : ""}`}
      onMouseDown={handleTabBarMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="dock-tab-bar-tabs">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            panelId={panelId}
            onClick={handleTabClick}
            isDraggable={!tab.locked && !panelLock?.locked}
          />
        ))}
      </div>
      {panelExtraLeft && activeTab && (
        <div className="dock-tab-bar-extra-left">
          {panelExtraLeft(activeTab, panelId)}
        </div>
      )}
      {panelExtra && activeTab && (
        <div className="dock-tab-bar-extra">
          {panelExtra(activeTab, panelId)}
        </div>
      )}
    </div>
  );
});
