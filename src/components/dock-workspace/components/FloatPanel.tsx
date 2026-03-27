"use client";

import React, { useCallback, useRef, useState } from "react";
import type { FloatPanelData } from "../types";
import { PanelNodeComponent } from "./PanelNode";
import { useDockStore, useDockWorkspaceContext } from "./DockWorkspace";

const MIN_FLOAT_WIDTH = 200;
const MIN_FLOAT_HEIGHT = 150;

interface FloatPanelProps {
  floatPanel: FloatPanelData;
}

export const FloatPanelComponent = React.memo(function FloatPanelComponent({
  floatPanel,
}: FloatPanelProps) {
  const updateFloatPanel = useDockStore((s) => s.updateFloatPanel);
  const removeFloatPanel = useDockStore((s) => s.removeFloatPanel);
  const bringFloatToFront = useDockStore((s) => s.bringFloatToFront);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // ===== Move handling =====
  const handleMoveStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      // Only allow move from the header area
      const target = e.target as HTMLElement;
      if (target.closest(".dock-tab") || target.closest("[data-tab-close]") || target.closest(".dock-float-close")) return;
      if (!target.closest(".dock-float-header")) return;

      e.preventDefault();
      bringFloatToFront(floatPanel.id);
      setIsMoving(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = floatPanel.x;
      const startTop = floatPanel.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        updateFloatPanel(floatPanel.id, {
          x: startLeft + dx,
          y: startTop + dy,
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        setIsMoving(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [floatPanel.id, floatPanel.x, floatPanel.y, updateFloatPanel, bringFloatToFront]
  );

  // ===== Resize handling =====
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      bringFloatToFront(floatPanel.id);
      setIsResizing(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = floatPanel.width;
      const startHeight = floatPanel.height;
      const startLeft = floatPanel.x;
      const startTop = floatPanel.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startLeft;
        let newY = startTop;

        if (direction.includes("e")) newWidth = Math.max(MIN_FLOAT_WIDTH, startWidth + dx);
        if (direction.includes("w")) {
          newWidth = Math.max(MIN_FLOAT_WIDTH, startWidth - dx);
          newX = startLeft + (startWidth - newWidth);
        }
        if (direction.includes("s")) newHeight = Math.max(MIN_FLOAT_HEIGHT, startHeight + dy);
        if (direction.includes("n")) {
          newHeight = Math.max(MIN_FLOAT_HEIGHT, startHeight - dy);
          newY = startTop + (startHeight - newHeight);
        }

        updateFloatPanel(floatPanel.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        setIsResizing(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [floatPanel, updateFloatPanel, bringFloatToFront]
  );

  const handleClose = useCallback(() => {
    removeFloatPanel(floatPanel.id);
  }, [floatPanel.id, removeFloatPanel]);

  const handleFocus = useCallback(() => {
    bringFloatToFront(floatPanel.id);
  }, [floatPanel.id, bringFloatToFront]);

  const { floatClosable } = useDockWorkspaceContext();
  const closable = floatPanel.closable ?? floatClosable;

  return (
    <div
      ref={containerRef}
      className={`dock-float-panel ${isMoving ? "dock-float-panel--moving" : ""} ${isResizing ? "dock-float-panel--resizing" : ""}`}
      style={{
        position: "fixed",
        left: floatPanel.x,
        top: floatPanel.y,
        width: floatPanel.width,
        height: floatPanel.height,
        zIndex: floatPanel.zIndex,
      }}
      onMouseDown={handleFocus}
    >
      {/* Move handle (header area) */}
      <div
        className="dock-float-header"
        onMouseDown={handleMoveStart}
      >
        <PanelNodeComponent node={floatPanel.panel} />
      </div>

      {/* Close button */}
      {closable && (
        <button
          className="dock-float-close"
          onClick={handleClose}
          aria-label="Close float panel"
        >
          ×
        </button>
      )}

      {/* Resize handles */}
      {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((dir) => (
        <div
          key={dir}
          className={`dock-float-resize dock-float-resize--${dir}`}
          onMouseDown={(e) => handleResizeStart(e, dir)}
        />
      ))}
    </div>
  );
});
