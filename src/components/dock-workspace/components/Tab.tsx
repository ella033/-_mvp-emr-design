"use client";

import React, { useCallback, useRef } from "react";
import type { TabData, NodeId } from "../types";
import { useDockWorkspaceContext, useDockStore } from "./DockWorkspace";
import { DEFAULT_DRAG_THRESHOLD } from "../constants";

interface TabProps {
  tab: TabData;
  isActive: boolean;
  panelId: NodeId;
  onClick: (tabId: string) => void;
  isDraggable: boolean;
}

export const Tab = React.memo(function Tab({
  tab,
  isActive,
  panelId,
  onClick,
  isDraggable,
}: TabProps) {
  const { onTabClick, onTabClose } = useDockWorkspaceContext();
  const startDrag = useDockStore((s) => s.startDrag);
  const updatePointerPosition = useDockStore((s) => s.updatePointerPosition);
  const endDrag = useDockStore((s) => s.endDrag);
  const cancelDrag = useDockStore((s) => s.cancelDrag);
  const removeTab = useDockStore((s) => s.removeTab);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || !isDraggable) return;

      // Don't interfere with close button clicks
      const target = e.target as HTMLElement;
      if (target.closest("[data-tab-close]")) return;

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
            tab.id,
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
        } else {
          // Simple click
          onClick(tab.id);
          onTabClick?.(tab.id, panelId);
        }

        dragStartPos.current = null;
        isDraggingRef.current = false;
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      isDraggable,
      tab.id,
      panelId,
      startDrag,
      updatePointerPosition,
      endDrag,
      onClick,
      onTabClick,
    ]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const shouldClose = onTabClose?.(tab.id, panelId);
      if (shouldClose !== false) {
        removeTab(panelId, tab.id);
      }
    },
    [tab.id, panelId, onTabClose, removeTab]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrag();
      }
    },
    [cancelDrag]
  );

  const closable = tab.closable !== false;

  return (
    <div
      className={`dock-tab ${isActive ? "dock-tab--active" : ""} ${
        isDraggable ? "dock-tab--draggable" : ""
      }`}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      data-tab-id={tab.id}
    >
      <span className="dock-tab-title">{tab.title}</span>
      <span data-tab-extra-left={tab.id} className="dock-tab-extra-left" />
      {closable && (
        <button
          className="dock-tab-close"
          onClick={handleClose}
          data-tab-close
          aria-label={`Close ${typeof tab.title === "string" ? tab.title : "tab"}`}
        >
          ×
        </button>
      )}
    </div>
  );
});
