"use client";

import React, { useEffect, useCallback, useRef } from "react";
import type { DockPosition, DockTarget } from "../types";
import { useDockStore } from "./DockWorkspace";
import {
  EDGE_ZONE_RATIO,
  DOCK_OVERLAP_THRESHOLD,
  OVERLAY_MAX_WIDTH,
  OVERLAY_MAX_HEIGHT,
  OVERLAY_MIN_WIDTH,
  OVERLAY_MIN_HEIGHT,
} from "../constants";

/**
 * Centralized drop zone manager.
 * Instead of per-panel DropZones (which race each other),
 * this single component iterates all [data-panel-id] elements
 * and performs hit-testing against the current pointer position.
 *
 * Uses overlap-based detection: dock preview activates only when
 * the drag overlay significantly overlaps with a panel (>50%).
 *
 * Rendered once inside DockWorkspace when a drag is active.
 */
export const DropZoneManager = React.memo(function DropZoneManager({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const pointerPosition = useDockStore((s) => s.drag.pointerPosition);
  const sourcePanelId = useDockStore((s) => s.drag.sourcePanelId);
  const dragTabId = useDockStore((s) => s.drag.dragTabId);
  const sourcePanelRect = useDockStore((s) => s.drag.sourcePanelRect);
  const dragOffset = useDockStore((s) => s.drag.dragOffset);
  const updateDrag = useDockStore((s) => s.updateDrag);
  const findTabById = useDockStore((s) => s.findTabById);
  const findPanelById = useDockStore((s) => s.findPanelById);

  const prevTargetRef = useRef<DockTarget | null>(null);

  const computeDockPosition = useCallback(
    (
      clientX: number,
      clientY: number,
      rect: DOMRect
    ): DockPosition | null => {
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const relX = (clientX - rect.left) / rect.width;
      const relY = (clientY - rect.top) / rect.height;
      const edge = EDGE_ZONE_RATIO;

      if (relX < edge) return "left";
      if (relX > 1 - edge) return "right";
      if (relY < edge) return "top";
      if (relY > 1 - edge) return "bottom";

      return "center";
    },
    []
  );

  const computePreviewRect = useCallback(
    (position: DockPosition, rect: DOMRect) => {
      switch (position) {
        case "left":
          return {
            x: rect.left,
            y: rect.top,
            width: rect.width / 2,
            height: rect.height,
          };
        case "right":
          return {
            x: rect.left + rect.width / 2,
            y: rect.top,
            width: rect.width / 2,
            height: rect.height,
          };
        case "top":
          return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height / 2,
          };
        case "bottom":
          return {
            x: rect.left,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height / 2,
          };
        case "center":
          return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
      }
    },
    []
  );

  useEffect(() => {
    if (!pointerPosition || !containerRef.current || !dragTabId) return;

    // Compute drag overlay bounding rect (same logic as DragOverlay.tsx)
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

    // Find all panel elements inside the workspace
    const panelElements = containerRef.current.querySelectorAll<HTMLElement>(
      "[data-panel-id]"
    );

    let bestTarget: DockTarget | null = null;
    let bestPreviewRect: { x: number; y: number; width: number; height: number } | null = null;

    for (const panelEl of panelElements) {
      const panelId = panelEl.getAttribute("data-panel-id");
      if (!panelId) continue;

      // Skip panels inside float containers (float panels are not dock targets)
      if (panelEl.closest(".dock-float-panel")) continue;

      const rect = panelEl.getBoundingClientRect();

      // Overlap-based hit test: check if overlay significantly overlaps with panel
      const overlapLeft = Math.max(overlayLeft, rect.left);
      const overlapTop = Math.max(overlayTop, rect.top);
      const overlapRight = Math.min(overlayRight, rect.right);
      const overlapBottom = Math.min(overlayBottom, rect.bottom);
      const overlapWidth = Math.max(0, overlapRight - overlapLeft);
      const overlapHeight = Math.max(0, overlapBottom - overlapTop);
      const overlapArea = overlapWidth * overlapHeight;

      const panelArea = rect.width * rect.height;
      const overlayOverlapRatio = overlayArea > 0 ? overlapArea / overlayArea : 0;
      const panelOverlapRatio = panelArea > 0 ? overlapArea / panelArea : 0;

      // Skip if insufficient overlap
      if (overlayOverlapRatio < DOCK_OVERLAP_THRESHOLD && panelOverlapRatio < DOCK_OVERLAP_THRESHOLD) {
        continue;
      }

      const position = computeDockPosition(
        pointerPosition.x,
        pointerPosition.y,
        rect
      );

      if (position === null) continue;

      // Skip center-drop on same panel (just tab reorder, no-op for docking)
      if (sourcePanelId === panelId && position === "center") continue;

      // Group restriction: check if dragged tab's group is compatible with target panel
      if (dragTabId) {
        const tabInfo = findTabById(dragTabId);
        const targetPanel = findPanelById(panelId);
        if (tabInfo?.tab.group && targetPanel?.group) {
          if (tabInfo.tab.group !== targetPanel.group) continue;
        }
      }

      bestTarget = { targetPanelId: panelId, position };
      bestPreviewRect = computePreviewRect(position, rect);
      break; // First match wins (panels don't overlap in docked layout)
    }

    // Only update store if target actually changed
    const prev = prevTargetRef.current;
    const targetChanged =
      prev?.targetPanelId !== bestTarget?.targetPanelId ||
      prev?.position !== bestTarget?.position;

    if (!targetChanged) return;

    prevTargetRef.current = bestTarget;
    updateDrag(pointerPosition, bestTarget, bestPreviewRect);
  }, [
    pointerPosition,
    containerRef,
    sourcePanelId,
    dragTabId,
    sourcePanelRect,
    dragOffset,
    computeDockPosition,
    computePreviewRect,
    updateDrag,
    findTabById,
    findPanelById,
  ]);

  return null;
});
