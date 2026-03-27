import React, { useState, useCallback } from "react";
import { getStickyStyle } from "./my-tree-grid-util";
import type { MyTreeGridHeaderType } from "./my-tree-grid-type";
import { MyTreeGridRowContainer } from "./my-tree-grid-etc";
import MyTreeGridHeaderCell from "./my-tree-grid-header-cell";
import { cn } from "@/lib/utils";
import { MyTreeGridSettingButton } from "./my-tree-grid-setting-button";

interface MyTreeGridHeaderProps {
  headers: MyTreeGridHeaderType[];
  onHeadersChange?: (newHeaders: MyTreeGridHeaderType[]) => void;
  settingButtonOptions?: {
    title?: string;
    defaultHeaders: MyTreeGridHeaderType[];
    showRowIconSetting?: boolean;
    showRowIcon?: boolean;
    onShowRowIconChange?: (show: boolean) => void;
  };
  hideBorder?: boolean;
  isResizing?: string | null;
  onResizeMouseDown?: (e: React.MouseEvent, columnKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}

export default function MyTreeGridHeader({
  headers,
  onHeadersChange,
  settingButtonOptions,
  hideBorder = false,
  isResizing = null,
  onResizeMouseDown,
  onAutoFitColumn,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: MyTreeGridHeaderProps) {
  const [draggedHeader, setDraggedHeader] = useState<string | null>(null);
  const [dragOverHeader, setDragOverHeader] = useState<string | null>(null);

  // ========== header reorder start ==========
  const handleHeaderReorder = useCallback(
    (draggedKey: string, targetKey: string) => {
      if (draggedKey === targetKey) return;

      const draggedIndex = headers.findIndex(
        (h: MyTreeGridHeaderType) => h.key === draggedKey
      );
      const targetIndex = headers.findIndex(
        (h: MyTreeGridHeaderType) => h.key === targetKey
      );

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newHeaders = [...headers];
      const draggedHeader = newHeaders[draggedIndex];
      if (!draggedHeader) return;

      newHeaders.splice(draggedIndex, 1);
      newHeaders.splice(targetIndex, 0, draggedHeader);

      newHeaders.forEach((header, index) => {
        header.sortNumber = index;
      });

      onHeadersChange?.(newHeaders);
    },
    [headers, onHeadersChange]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, headerKey: string) => {
      setDraggedHeader(headerKey);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, headerKey: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverHeader(headerKey);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverHeader(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetHeaderKey: string) => {
      e.preventDefault();
      if (draggedHeader && draggedHeader !== targetHeaderKey) {
        handleHeaderReorder(draggedHeader, targetHeaderKey);
      }
      setDraggedHeader(null);
      setDragOverHeader(null);
    },
    [draggedHeader, handleHeaderReorder]
  );
  // ========== header reorder end ==========

  // ========== column fix start ==========
  const handleColumnFix = useCallback(
    (columnKey: string, position: "left" | "right" | null) => {
      const newHeaders = headers.map((header: MyTreeGridHeaderType) => {
        if (header.key === columnKey) {
          return {
            ...header,
            isFixedLeft: position === "left",
            isFixedRight: position === "right",
          };
        }
        return header;
      });
      onHeadersChange?.(newHeaders);
    },
    [headers, onHeadersChange]
  );
  // ========== column fix end ==========

  return (
    <MyTreeGridRowContainer
      className={cn(
        "bg-[var(--grid-header-bg)]",
        hideBorder
          ? "border-b-0"
          : "border-b border-[var(--grid-header-border)]"
      )}
    >
      {headers
        .filter((header: MyTreeGridHeaderType) => header.visible)
        .map((header: MyTreeGridHeaderType, index: number) => {
          const showSettingButton =
            index === 0 && !!settingButtonOptions && !!onHeadersChange;

          return (
            <MyTreeGridHeaderCell
              key={header.key}
              header={header}
              settingButton={
                showSettingButton ? (
                  <MyTreeGridSettingButton
                    title={settingButtonOptions.title}
                    defaultHeaders={settingButtonOptions.defaultHeaders}
                    headers={headers}
                    setHeaders={onHeadersChange}
                    showRowIconSetting={settingButtonOptions.showRowIconSetting}
                    showRowIcon={settingButtonOptions.showRowIcon}
                    onShowRowIconChange={settingButtonOptions.onShowRowIconChange}
                  />
                ) : undefined
              }
              stickyStyle={getStickyStyle(headers, header)}
              draggedHeader={draggedHeader}
              dragOverHeader={dragOverHeader}
              isResizing={isResizing}
              hideBorder={hideBorder}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseDown={onResizeMouseDown}
              onAutoFitColumn={onAutoFitColumn}
              onColumnFix={handleColumnFix}
              resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
              onResizeHandleHover={onResizeHandleHover}
            />
          );
        })}
    </MyTreeGridRowContainer>
  );
}
