"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useDockStore } from "./DockWorkspace";
import {
  OVERLAY_MAX_WIDTH,
  OVERLAY_MAX_HEIGHT,
  OVERLAY_MIN_WIDTH,
  OVERLAY_MIN_HEIGHT,
} from "../constants";

/**
 * Drag overlay that displays a panel-shaped preview.
 * Shows tab header + empty panel area following the cursor.
 */
export const DragOverlayComponent = React.memo(function DragOverlayComponent() {
  const isDragging = useDockStore((s) => s.drag.isDragging);
  const pointerPosition = useDockStore((s) => s.drag.pointerPosition);
  const dragTabId = useDockStore((s) => s.drag.dragTabId);
  const sourcePanelRect = useDockStore((s) => s.drag.sourcePanelRect);
  const dragOffset = useDockStore((s) => s.drag.dragOffset);
  const findTabById = useDockStore((s) => s.findTabById);

  if (!isDragging || !pointerPosition || !dragTabId || typeof window === "undefined") {
    return null;
  }

  const tabInfo = findTabById(dragTabId);
  const title = tabInfo?.tab.title ?? dragTabId;

  // Scale down source panel size for overlay
  const overlayWidth = sourcePanelRect
    ? Math.max(OVERLAY_MIN_WIDTH, Math.min(sourcePanelRect.width * 0.6, OVERLAY_MAX_WIDTH))
    : OVERLAY_MIN_WIDTH;
  const overlayHeight = sourcePanelRect
    ? Math.max(OVERLAY_MIN_HEIGHT, Math.min(sourcePanelRect.height * 0.5, OVERLAY_MAX_HEIGHT))
    : OVERLAY_MIN_HEIGHT;

  // Position: offset from cursor based on drag start point
  const scaleX = sourcePanelRect ? overlayWidth / sourcePanelRect.width : 1;
  const scaleY = sourcePanelRect ? overlayHeight / sourcePanelRect.height : 1;
  const offsetX = dragOffset ? dragOffset.x * scaleX : 10;
  const offsetY = dragOffset ? dragOffset.y * scaleY : 10;

  return createPortal(
    <div
      className="dock-drag-overlay"
      style={{
        position: "fixed",
        left: pointerPosition.x - offsetX,
        top: pointerPosition.y - offsetY,
        width: overlayWidth,
        height: overlayHeight,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div className="dock-drag-overlay-frame">
        <div className="dock-drag-overlay-tab-bar">
          <div className="dock-drag-overlay-tab">
            {title}
          </div>
        </div>
        <div className="dock-drag-overlay-body" />
      </div>
    </div>,
    document.body
  );
});
