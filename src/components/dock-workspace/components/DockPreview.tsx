"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useDockStore } from "./DockWorkspace";

/**
 * Drop indicator overlay.
 * Shows a semi-transparent rectangle where the tab will be docked.
 * Rendered as a portal to document.body.
 */
export const DockPreview = React.memo(function DockPreview() {
  const isDragging = useDockStore((s) => s.drag.isDragging);
  const previewRect = useDockStore((s) => s.drag.previewRect);

  if (!isDragging || !previewRect || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="dock-preview-indicator"
      style={{
        position: "fixed",
        left: previewRect.x,
        top: previewRect.y,
        width: previewRect.width,
        height: previewRect.height,
        pointerEvents: "none",
        zIndex: 9998,
        transition: "all 100ms ease-out",
      }}
    />,
    document.body
  );
});
