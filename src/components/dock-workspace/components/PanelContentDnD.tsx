"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DEFAULT_DRAG_THRESHOLD } from "../constants";

// ===== Types =====

export interface ContentDragItem {
  /** Unique ID of the dragged item */
  id: string;
  /** Source panel ID */
  sourcePanelId: string;
  /** Arbitrary data */
  data: Record<string, unknown>;
}

export interface ContentDropInfo {
  /** The item being dropped */
  item: ContentDragItem;
  /** Target panel ID */
  targetPanelId: string;
  /** Drop index within the target panel (-1 = append) */
  dropIndex: number;
}

interface ContentDragState {
  isDragging: boolean;
  item: ContentDragItem | null;
  pointerPosition: { x: number; y: number } | null;
  targetPanelId: string | null;
  dropIndex: number;
}

interface PanelContentDnDContextValue {
  dragState: ContentDragState;
  startContentDrag: (
    item: ContentDragItem,
    pointerPosition: { x: number; y: number }
  ) => void;
  updateContentDrag: (pointerPosition: { x: number; y: number }) => void;
  endContentDrag: () => void;
  cancelContentDrag: () => void;
  registerDropZone: (panelId: string, element: HTMLElement) => void;
  unregisterDropZone: (panelId: string) => void;
  onDrop?: (info: ContentDropInfo) => void;
}

const INITIAL_STATE: ContentDragState = {
  isDragging: false,
  item: null,
  pointerPosition: null,
  targetPanelId: null,
  dropIndex: -1,
};

// ===== Context =====

const PanelContentDnDContext =
  createContext<PanelContentDnDContextValue | null>(null);

export function usePanelContentDnD() {
  const ctx = useContext(PanelContentDnDContext);
  if (!ctx) {
    throw new Error(
      "usePanelContentDnD must be used within <PanelContentDnDProvider>"
    );
  }
  return ctx;
}

// ===== Provider =====

interface PanelContentDnDProviderProps {
  children: React.ReactNode;
  onDrop?: (info: ContentDropInfo) => void;
  /** Custom overlay renderer for dragged content items */
  renderDragOverlay?: (item: ContentDragItem) => React.ReactNode;
}

export function PanelContentDnDProvider({
  children,
  onDrop,
  renderDragOverlay,
}: PanelContentDnDProviderProps) {
  const [dragState, setDragState] = useState<ContentDragState>(INITIAL_STATE);
  const dropZonesRef = useRef<Map<string, HTMLElement>>(new Map());
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const registerDropZone = useCallback(
    (panelId: string, element: HTMLElement) => {
      dropZonesRef.current.set(panelId, element);
    },
    []
  );

  const unregisterDropZone = useCallback((panelId: string) => {
    dropZonesRef.current.delete(panelId);
  }, []);

  const findTargetPanel = useCallback(
    (x: number, y: number): { panelId: string; dropIndex: number } | null => {
      for (const [panelId, element] of dropZonesRef.current) {
        const rect = element.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          // Calculate drop index based on y position within the panel
          const items = element.querySelectorAll("[data-content-item-index]");
          let dropIndex = -1;

          for (const item of items) {
            const itemRect = item.getBoundingClientRect();
            const midY = itemRect.top + itemRect.height / 2;
            const idx = parseInt(
              item.getAttribute("data-content-item-index") ?? "-1",
              10
            );
            if (y < midY) {
              dropIndex = idx;
              break;
            }
          }

          return { panelId, dropIndex };
        }
      }
      return null;
    },
    []
  );

  const startContentDrag = useCallback(
    (item: ContentDragItem, pointerPosition: { x: number; y: number }) => {
      setDragState({
        isDragging: true,
        item,
        pointerPosition,
        targetPanelId: null,
        dropIndex: -1,
      });
    },
    []
  );

  const updateContentDrag = useCallback(
    (pointerPosition: { x: number; y: number }) => {
      const target = findTargetPanel(pointerPosition.x, pointerPosition.y);
      setDragState((prev) => ({
        ...prev,
        pointerPosition,
        targetPanelId: target?.panelId ?? null,
        dropIndex: target?.dropIndex ?? -1,
      }));
    },
    [findTargetPanel]
  );

  const endContentDrag = useCallback(() => {
    setDragState((prev) => {
      if (prev.item && prev.targetPanelId) {
        onDropRef.current?.({
          item: prev.item,
          targetPanelId: prev.targetPanelId,
          dropIndex: prev.dropIndex,
        });
      }
      return INITIAL_STATE;
    });
  }, []);

  const cancelContentDrag = useCallback(() => {
    setDragState(INITIAL_STATE);
  }, []);

  const contextValue: PanelContentDnDContextValue = {
    dragState,
    startContentDrag,
    updateContentDrag,
    endContentDrag,
    cancelContentDrag,
    registerDropZone,
    unregisterDropZone,
    onDrop,
  };

  return (
    <PanelContentDnDContext.Provider value={contextValue}>
      {children}
      {dragState.isDragging && dragState.pointerPosition && dragState.item && typeof window !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: dragState.pointerPosition.x + 8,
              top: dragState.pointerPosition.y + 8,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            {renderDragOverlay ? (
              renderDragOverlay(dragState.item)
            ) : (
              <div className="dock-content-drag-overlay">
                {dragState.item.id}
              </div>
            )}
          </div>,
          document.body
        )}
    </PanelContentDnDContext.Provider>
  );
}

// ===== Draggable Item Hook =====

interface UseContentDraggableOptions {
  item: ContentDragItem;
  disabled?: boolean;
}

export function useContentDraggable({ item, disabled }: UseContentDraggableOptions) {
  const { startContentDrag, updateContentDrag, endContentDrag, cancelContentDrag } =
    usePanelContentDnD();

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || disabled) return;

      // Don't conflict with dock tab drag
      const target = e.target as HTMLElement;
      if (target.closest(".dock-tab") || target.closest(".dock-tab-bar")) return;

      e.stopPropagation();
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartPos.current) return;

        const dx = Math.abs(moveEvent.clientX - dragStartPos.current.x);
        const dy = Math.abs(moveEvent.clientY - dragStartPos.current.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!isDraggingRef.current && distance >= DEFAULT_DRAG_THRESHOLD) {
          isDraggingRef.current = true;
          startContentDrag(item, {
            x: moveEvent.clientX,
            y: moveEvent.clientY,
          });
        }

        if (isDraggingRef.current) {
          updateContentDrag({
            x: moveEvent.clientX,
            y: moveEvent.clientY,
          });
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        if (isDraggingRef.current) {
          endContentDrag();
        }

        dragStartPos.current = null;
        isDraggingRef.current = false;
      };

      const handleKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === "Escape") {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          document.removeEventListener("keydown", handleKeyDown);
          cancelContentDrag();
          dragStartPos.current = null;
          isDraggingRef.current = false;
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("keydown", handleKeyDown);
    },
    [disabled, item, startContentDrag, updateContentDrag, endContentDrag, cancelContentDrag]
  );

  return { handleMouseDown };
}

// ===== Drop Zone Hook =====

export function useContentDropZone(panelId: string) {
  const { registerDropZone, unregisterDropZone, dragState } =
    usePanelContentDnD();

  const dropRef = useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        registerDropZone(panelId, element);
      } else {
        unregisterDropZone(panelId);
      }
    },
    [panelId, registerDropZone, unregisterDropZone]
  );

  const isOver = dragState.isDragging && dragState.targetPanelId === panelId;

  return { dropRef, isOver, dropIndex: isOver ? dragState.dropIndex : -1 };
}
