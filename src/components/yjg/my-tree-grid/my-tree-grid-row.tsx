"use client";
import React, { useEffect, useRef, useState } from "react";
import { MyTreeGridHeaderType, MyTreeGridRowType } from "./my-tree-grid-type";
import {
  getStickyStyle,
  findParentRow,
  getHeaderDefaultWidth,
} from "./my-tree-grid-util";
import MyTreeGridCell from "./my-tree-grid-cell";
import {
  HighlightBackground,
  HighlightLine,
} from "@/app/master-data/_components/(common)/common-controls";
import { cn } from "@/lib/utils";
import MyTreeGridRowIcon from "./my-tree-grid-row-icon";

interface MyTreeGridRowProps {
  headers: MyTreeGridHeaderType[];
  data: MyTreeGridRowType[];
  row: MyTreeGridRowType;
  onClickAction: (row: MyTreeGridRowType, event?: React.MouseEvent) => void;
  onDoubleClickAction: (
    row: MyTreeGridRowType,
    event?: React.MouseEvent
  ) => void;
  onDragStartAction: (e: React.DragEvent, row: MyTreeGridRowType) => void;
  onDragOverAction: (e: React.DragEvent, row: MyTreeGridRowType) => void;
  onDropAction: (e: React.DragEvent, row: MyTreeGridRowType) => void;
  onDragEndAction: (e: React.DragEvent, row: MyTreeGridRowType) => void;
  onContextMenuAction: (
    e: React.MouseEvent,
    header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    selectedRows: MyTreeGridRowType[]
  ) => void;
  showContextMenu: boolean;
  hideBorder?: boolean;
  allowDragDrop?: boolean;
  draggedRow: MyTreeGridRowType | null;
  dropTarget: MyTreeGridRowType | null;
  dropPosition: "above" | "below" | "inside" | null;
  selectedRows: Set<MyTreeGridRowType>;
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
  isTypeOrder?: boolean;
  onToggleExpansion?: (row: MyTreeGridRowType) => void;
  searchKeyword?: string;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  focusedCell?: { rowKey: string; headerKey: string } | null;
  onCellFocus?: (rowKey: string, headerKey: string) => void;
  editingCell?: { rowKey: string; headerKey: string } | null;
  textEditTriggerMode?: "direct" | "explicit";
  onEditEnd?: () => void;
  showRowIcon?: boolean;
  isResizing?: string | null;
  onResizeMouseDown?: (e: React.MouseEvent, columnKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}

export default function MyTreeGridRow({
  headers,
  data,
  row,
  onClickAction,
  onDoubleClickAction,
  onDragStartAction,
  onDragOverAction,
  onDropAction,
  onDragEndAction,
  onContextMenuAction,
  showContextMenu,
  hideBorder = false,
  allowDragDrop = true,
  draggedRow,
  dropTarget,
  dropPosition,
  selectedRows,
  onDataChangeItem,
  isTypeOrder = false,
  onToggleExpansion,
  searchKeyword,
  size,
  focusedCell,
  onCellFocus,
  editingCell,
  textEditTriggerMode = "direct",
  onEditEnd,
  showRowIcon = true,
  isResizing = null,
  onResizeMouseDown,
  onAutoFitColumn,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: MyTreeGridRowProps) {
  const [isHighlight, setIsHighlight] = useState(row.isHighlight);
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const isDragging = draggedRow?.rowKey === row.rowKey;
  const isDropTarget = dropTarget?.rowKey === row.rowKey;
  const isSelected = Array.from(selectedRows).some(
    (n) => n.rowKey === row.rowKey
  );
  const fullWidth = headers.reduce((acc, header) => {
    const width = header.width ?? getHeaderDefaultWidth(header.name);
    return acc + width;
  }, 0);

  useEffect(() => {
    setIsHighlight(row.isHighlight);
    if (row.isHighlight) {
      setTimeout(() => {
        setIsHighlight(false);
      }, 1000);
    }
  }, [row.isHighlight]);

  // 드롭 라인 표시 여부를 결정하는 함수
  const shouldShowDropLine = () => {
    if (!isTypeOrder || !draggedRow || !isDropTarget || !dropPosition) {
      return true; // 기본적으로 표시
    }

    // inside 드롭은 항상 표시
    if (dropPosition === "inside") {
      return true;
    }

    // above/below 드롭에서 타입 순서 검증
    if (dropPosition === "above" || dropPosition === "below") {
      const { parent } = findParentRow(data, row.rowKey);
      const siblings = parent ? parent.children || [] : data;
      const currentIndex = siblings.findIndex((n) => n.rowKey === row.rowKey);

      if (currentIndex !== -1) {
        // 위쪽에 드롭할 때
        if (dropPosition === "above") {
          // 위쪽 형제가 있고, 드래그된 row와 타입이 다르면 라인 숨김
          if (currentIndex > 0) {
            const prevSibling = siblings[currentIndex - 1];
            if (prevSibling && prevSibling.type !== draggedRow.type) {
              return false; // 라인 숨김
            }
          }
        }
        // 아래쪽에 드롭할 때
        else if (dropPosition === "below") {
          // 아래쪽 형제가 있고, 드래그된 row와 타입이 다르면 라인 숨김
          if (currentIndex < siblings.length - 1) {
            const nextSibling = siblings[currentIndex + 1];
            if (nextSibling && nextSibling.type !== draggedRow.type) {
              return false; // 라인 숨김
            }
          }
        }
      }
    }

    return true; // 기본적으로 표시
  };

  return (
    <div
      ref={itemRef}
      data-tree-node="true"
      data-row-key={row.rowKey}
      className={cn(
        "flex items-center",
        isDragging ? "opacity-50" : "",
        isDropTarget ? "bg-blue-50 dark:bg-blue-900/20" : "",
        row.customRender && isSelected
          ? "text-[var(--grid-row-selected-text)] bg-[var(--grid-row-selected)]"
          : "text-[var(--grid-row-fg)] bg-[var(--grid-row-bg)]",
        row.isHighlight ? "animate-flash" : ""
      )}
      style={{
        width: `${fullWidth}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={allowDragDrop}
      onDragStart={(e) => onDragStartAction(e, row)}
      onDragOver={(e) => onDragOverAction(e, row)}
      onDrop={(e) => onDropAction(e, row)}
      onDragEnd={(e) => onDragEndAction(e, row)}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-popup-trigger="true"]')) {
          return;
        }
        e.stopPropagation();
        onClickAction(row, e);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-popup-trigger="true"]')) {
          return;
        }
        e.stopPropagation();
        onDoubleClickAction(row, e);
      }}
    >
      {row.customRender ? (
        <div
          className="flex items-center w-full h-full"
          onContextMenu={(e) => {
            e.preventDefault();
            showContextMenu &&
              onContextMenuAction(
                e,
                headers[0]!,
                row,
                Array.from(selectedRows)
              );
          }}
        >
          <MyTreeGridRowIcon
            size={size}
            data={data}
            row={row}
            onToggleExpansion={onToggleExpansion}
            showRowIcon={showRowIcon}
          />
          {row.customRender}
        </div>
      ) : (
        headers
          .filter((header) => header.visible)
          .map((header, index) => {
            const stickyStyle = getStickyStyle(headers, header);
            return (
              <MyTreeGridCell
                key={header.key}
                isFirstHeader={index === 0}
                header={header}
                data={data}
                row={row}
                selectedRows={Array.from(selectedRows)}
                stickyStyle={stickyStyle}
                onDataChangeItem={onDataChangeItem}
                onContextMenu={onContextMenuAction}
                showContextMenu={showContextMenu}
                hideBorder={hideBorder}
                onToggleExpansion={onToggleExpansion}
                searchKeyword={searchKeyword}
                size={size}
                focusedCell={focusedCell}
                onCellFocus={onCellFocus}
                editingCell={editingCell}
                textEditTriggerMode={textEditTriggerMode}
                onEditEnd={onEditEnd}
                showRowIcon={showRowIcon}
                isResizing={isResizing}
                onResizeMouseDown={onResizeMouseDown}
                onAutoFitColumn={onAutoFitColumn}
                resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
                onResizeHandleHover={onResizeHandleHover}
              />
            );
          })
      )}
      {row.rowAction && (
        <div
          className={cn(
            "sticky right-0 h-full flex items-center px-2",
            isHovered
              ? "bg-gradient-to-l from-[var(--grid-row-bg)] via-[var(--grid-row-bg)] to-transparent"
              : "invisible"
          )}
          style={{
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
        >
          {row.rowAction}
        </div>
      )}
      {isDropTarget && dropPosition && shouldShowDropLine() && (
        <div
          className={`
            absolute left-0 right-0 h-0.5 bg-blue-500 z-10
            ${dropPosition === "above" ? "top-0" : "bottom-0"}
          `}
        />
      )}
      {isHighlight && <HighlightBackground />}
      {isDropTarget && dropPosition === "inside" && <HighlightLine />}
    </div>
  );
}
