"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import type { DockPosition } from "../types";
import { useDockStore } from "./DockWorkspace";
import { findPanelById, findTabById } from "../store/layout-tree-utils";
import {
  DOCK_OVERLAP_THRESHOLD,
  OVERLAY_MAX_WIDTH,
  OVERLAY_MAX_HEIGHT,
  OVERLAY_MIN_WIDTH,
  OVERLAY_MIN_HEIGHT,
} from "../constants";

const INDICATOR_SIZE = 28;
const INDICATOR_GAP = 4;

interface IndicatorButton {
  position: DockPosition;
  label: string;
}

const INDICATORS: IndicatorButton[] = [
  { position: "top", label: "↑" },
  { position: "left", label: "←" },
  { position: "center", label: "◇" },
  { position: "right", label: "→" },
  { position: "bottom", label: "↓" },
];

/**
 * Dock Target Indicator
 *
 * During drag, shows directional dock target buttons on the hovered panel.
 * This is the SOLE mechanism for setting dockTarget — docking only happens
 * when the user hovers over one of the indicator buttons.
 *
 * Layout:
 *       [top]
 * [left] [center] [right]
 *      [bottom]
 */
export const DockTargetIndicator = React.memo(function DockTargetIndicator() {
  const isDragging = useDockStore((s) => s.drag.isDragging);
  const dockTarget = useDockStore((s) => s.drag.dockTarget);
  const sourcePanelId = useDockStore((s) => s.drag.sourcePanelId);
  const dragTabId = useDockStore((s) => s.drag.dragTabId);
  const updateDrag = useDockStore((s) => s.updateDrag);
  const pointerPosition = useDockStore((s) => s.drag.pointerPosition);
  const sourcePanelRect = useDockStore((s) => s.drag.sourcePanelRect);
  const dragOffset = useDockStore((s) => s.drag.dragOffset);
  const layout = useDockStore((s) => s.layout);

  // Check if source panel has multiple tabs (allows same-panel split)
  const sourcePanelTabCount = useMemo(() => {
    if (!sourcePanelId) return 0;
    const panel = findPanelById(layout, sourcePanelId);
    return panel ? panel.tabs.length : 0;
  }, [layout, sourcePanelId]);

  const [hoveredPanelRect, setHoveredPanelRect] = useState<DOMRect | null>(null);
  const [hoveredPanelId, setHoveredPanelId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevHoveredIdRef = useRef<string | null>(null);

  // Track which panel the pointer is over (with overlap-based threshold)
  // Also clears dockTarget when hovered panel changes or is lost
  const updateHoveredPanel = useCallback(() => {
    if (!pointerPosition || !isDragging) {
      if (prevHoveredIdRef.current !== null) {
        prevHoveredIdRef.current = null;
        updateDrag(pointerPosition ?? { x: 0, y: 0 }, null, null);
      }
      setHoveredPanelRect(null);
      setHoveredPanelId(null);
      return;
    }

    // Compute drag overlay rect
    const overlayWidth = sourcePanelRect
      ? Math.max(OVERLAY_MIN_WIDTH, Math.min(sourcePanelRect.width * 0.6, OVERLAY_MAX_WIDTH))
      : OVERLAY_MIN_WIDTH;
    const overlayHeight = sourcePanelRect
      ? Math.max(OVERLAY_MIN_HEIGHT, Math.min(sourcePanelRect.height * 0.5, OVERLAY_MAX_HEIGHT))
      : OVERLAY_MIN_HEIGHT;

    const scaleX = sourcePanelRect ? overlayWidth / sourcePanelRect.width : 1;
    const scaleY = sourcePanelRect ? overlayHeight / sourcePanelRect.height : 1;
    const offsetX = dragOffset ? dragOffset.x * scaleX : 10;
    const offsetY = dragOffset ? dragOffset.y * scaleY : 10;

    const overlayLeft = pointerPosition.x - offsetX;
    const overlayTop = pointerPosition.y - offsetY;
    const overlayRight = overlayLeft + overlayWidth;
    const overlayBottom = overlayTop + overlayHeight;
    const overlayArea = overlayWidth * overlayHeight;

    const panelElements = document.querySelectorAll<HTMLElement>("[data-panel-id]");
    let foundId: string | null = null;
    let foundRect: DOMRect | null = null;

    for (const panelEl of panelElements) {
      // Skip panels inside float containers
      if (panelEl.closest(".dock-float-panel")) continue;

      const rect = panelEl.getBoundingClientRect();

      // Overlap-based hit test
      const overlapWidth = Math.max(0, Math.min(overlayRight, rect.right) - Math.max(overlayLeft, rect.left));
      const overlapHeight = Math.max(0, Math.min(overlayBottom, rect.bottom) - Math.max(overlayTop, rect.top));
      const overlapArea = overlapWidth * overlapHeight;
      const panelArea = rect.width * rect.height;

      const overlayOverlapRatio = overlayArea > 0 ? overlapArea / overlayArea : 0;
      const panelOverlapRatio = panelArea > 0 ? overlapArea / panelArea : 0;

      if (overlayOverlapRatio < DOCK_OVERLAP_THRESHOLD && panelOverlapRatio < DOCK_OVERLAP_THRESHOLD) {
        continue;
      }

      // Pointer must also be inside panel for direction detection
      if (
        pointerPosition.x < rect.left || pointerPosition.x > rect.right ||
        pointerPosition.y < rect.top || pointerPosition.y > rect.bottom
      ) {
        continue;
      }

      const panelId = panelEl.getAttribute("data-panel-id");
      if (!panelId) continue;

      // Allow hovering on source panel if it has multiple tabs (for same-panel split)
      if (panelId !== sourcePanelId || sourcePanelTabCount > 1) {
        // Group restriction: check if dragged tab's group is compatible
        if (dragTabId) {
          const tabInfo = findTabById(layout, dragTabId);
          const targetPanel = findPanelById(layout, panelId);
          if (tabInfo?.tab.group && targetPanel?.group) {
            if (tabInfo.tab.group !== targetPanel.group) continue;
          }
        }

        foundId = panelId;
        foundRect = rect;
        break;
      }
    }

    // Clear dockTarget when hovered panel changes or is lost
    if (foundId !== prevHoveredIdRef.current) {
      prevHoveredIdRef.current = foundId;
      updateDrag(pointerPosition, null, null);
    }

    setHoveredPanelRect(foundRect);
    setHoveredPanelId(foundId);
  }, [pointerPosition, isDragging, sourcePanelId, sourcePanelTabCount, sourcePanelRect, dragOffset, dragTabId, layout, updateDrag]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateHoveredPanel);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateHoveredPanel]);

  // Handle indicator button hover → set dock target + preview
  const handleIndicatorHover = useCallback(
    (position: DockPosition) => {
      if (!hoveredPanelId || !hoveredPanelRect || !pointerPosition) return;

      const rect = hoveredPanelRect;
      let previewRect: { x: number; y: number; width: number; height: number };

      switch (position) {
        case "left":
          previewRect = { x: rect.left, y: rect.top, width: rect.width / 2, height: rect.height };
          break;
        case "right":
          previewRect = { x: rect.left + rect.width / 2, y: rect.top, width: rect.width / 2, height: rect.height };
          break;
        case "top":
          previewRect = { x: rect.left, y: rect.top, width: rect.width, height: rect.height / 2 };
          break;
        case "bottom":
          previewRect = { x: rect.left, y: rect.top + rect.height / 2, width: rect.width, height: rect.height / 2 };
          break;
        case "center":
          previewRect = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
          break;
      }

      updateDrag(
        pointerPosition,
        { targetPanelId: hoveredPanelId, position },
        previewRect
      );
    },
    [hoveredPanelId, hoveredPanelRect, pointerPosition, updateDrag]
  );

  // Handle indicator button leave → clear dock target
  const handleIndicatorLeave = useCallback(() => {
    if (pointerPosition) {
      updateDrag(pointerPosition, null, null);
    }
  }, [pointerPosition, updateDrag]);

  if (!isDragging || !hoveredPanelRect || !hoveredPanelId || !dragTabId || typeof window === "undefined") {
    return null;
  }

  // Center position of the hovered panel
  const centerX = hoveredPanelRect.left + hoveredPanelRect.width / 2;
  const centerY = hoveredPanelRect.top + hoveredPanelRect.height / 2;

  const getIndicatorStyle = (position: DockPosition): React.CSSProperties => {
    const half = INDICATOR_SIZE / 2;
    const offset = INDICATOR_SIZE + INDICATOR_GAP;

    switch (position) {
      case "top":
        return { left: centerX - half, top: centerY - offset - half };
      case "bottom":
        return { left: centerX - half, top: centerY + offset - half };
      case "left":
        return { left: centerX - offset - half, top: centerY - half };
      case "right":
        return { left: centerX + offset - half, top: centerY - half };
      case "center":
        return { left: centerX - half, top: centerY - half };
    }
  };

  // When hovering over the source panel, hide "center" indicator (no-op for same panel)
  const isSamePanel = hoveredPanelId === sourcePanelId;
  const visibleIndicators = isSamePanel
    ? INDICATORS.filter((ind) => ind.position !== "center")
    : INDICATORS;

  return createPortal(
    <div className="dock-target-indicator-container">
      {visibleIndicators.map((ind) => {
        const isActive = dockTarget?.targetPanelId === hoveredPanelId && dockTarget?.position === ind.position;
        return (
          <div
            key={ind.position}
            className={`dock-target-indicator-btn ${isActive ? "dock-target-indicator-btn--active" : ""}`}
            style={{
              ...getIndicatorStyle(ind.position),
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
            }}
            onMouseEnter={() => handleIndicatorHover(ind.position)}
            onMouseLeave={handleIndicatorLeave}
            data-dock-indicator={ind.position}
          >
            {ind.label}
          </div>
        );
      })}
    </div>,
    document.body
  );
});
