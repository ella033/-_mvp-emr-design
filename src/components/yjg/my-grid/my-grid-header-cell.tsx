import { MyGridHeaderType } from "./my-grid-type";
import { useState } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { getHeaderDefaultWidth, HEADER_MIN_WIDTH } from "./my-grid-util";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import MyGridResizeHandle from "./my-grid-resize-handle";

interface MyGridHeaderCellProps {
  header: MyGridHeaderType;
  stickyStyle: React.CSSProperties;
  draggedHeader?: string | null;
  dragOverHeader?: string | null;
  isResizing?: string | null;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onDragStart: (e: React.DragEvent, headerKey: string) => void;
  onDragOver: (e: React.DragEvent, headerKey: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetHeaderKey: string) => void;
  onMouseDown?: (e: React.MouseEvent, headerKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  onSort: (header: MyGridHeaderType) => void;
  onColumnFix: (columnKey: string, position: "left" | "right" | null) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}

export default function MyGridHeaderCell({
  header,
  stickyStyle,
  draggedHeader,
  dragOverHeader,
  isResizing,
  sortColumn,
  sortDirection,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMouseDown,
  onAutoFitColumn,
  onSort,
  onColumnFix,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: MyGridHeaderCellProps) {
  const align = () => {
    switch (header.align) {
      case "left":
        return "justify-start";
      case "center":
        return "justify-center";
      case "right":
        return "justify-end";
    }
    return "justify-start";
  };

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // ========== menu close start ==========
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu) {
        const target = event.target as Element;
        const isMenuClick = target.closest('[data-menu="true"]');

        if (!isMenuClick) {
          setOpenMenu(null);
          setMenuPosition({ x: 0, y: 0 });
        }
      }
    };

    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);
  // ========== menu close end ==========

  const handleColumnFix = (
    columnKey: string,
    position: "left" | "right" | null
  ) => {
    onColumnFix(columnKey, position);
    setOpenMenu(null);
    setMenuPosition({ x: 0, y: 0 });
  };

  return (
    <div
      data-my-grid-col-key={header.key}
      className={cn(
        "flex flex-nowrap items-center justify-between bg-[var(--grid-header-bg)] hover:bg-[var(--grid-header-hover)] active:cursor-grabbing",
        draggedHeader === header.key ? "opacity-50" : "",
        dragOverHeader === header.key ? "border-l-4 border-l-[var(--grid-cell-focus)]" : ""
      )}
      style={{
        width: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        minWidth: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        color: "var(--grid-header-text)",
        ...stickyStyle,
      }}
      draggable={true}
      onDragStart={(e) => onDragStart(e, header.key)}
      onDragOver={(e) => onDragOver(e, header.key)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, header.key)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition?.({
          x: rect.left,
          y: rect.bottom + 5,
        });
        setOpenMenu?.(openMenu === header.key ? null : header.key);
      }}
    >
      <div
        data-my-grid-header-content-key={header.key}
        className={`flex overflow-hidden relative flex-1 items-center ${align()}`}
        style={{
          width: "fit-content",
        }}
      >
        {header.customRender ? (
          header.customRender
        ) : (
          <span
            data-my-grid-header-overflow-key={header.key}
            className="text-[11px] font-[500] ps-[4px] py-[1px] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {header.name}
          </span>
        )}

        {/* 컨텍스트 메뉴 */}
        {openMenu === header.key && menuPosition && (
          <MyGridHeaderMenu
            header={header}
            onColumnFix={handleColumnFix}
            position={menuPosition}
          />
        )}
      </div>
      {header.sortable && (
        <div
          className="flex items-center ps-[5px] text-[var(--grid-sort-icon)] hover:text-[var(--grid-sort-icon-hover)]"
          onClick={(e) => {
            e.stopPropagation();
            onSort(header);
          }}
        >
          {sortColumn === header.key ? (
            sortDirection === "asc" ? (
              <ChevronUpIcon className="w-[14px] h-[14px]" />
            ) : (
              <ChevronDownIcon className="w-[14px] h-[14px]" />
            )
          ) : (
            <ChevronUpDownIcon className="w-[14px] h-[14px]" />
          )}
        </div>
      )}
      <MyGridResizeHandle
        headerKey={header.key}
        showHandle={
          isResizing === header.key ||
          resizeHandleHoveredHeaderKey === header.key
        }
        onMouseDown={onMouseDown}
        onDoubleClick={onAutoFitColumn}
        onResizeHandleHover={onResizeHandleHover}
      />
    </div>
  );
}

function MyGridHeaderMenu({
  header,
  onColumnFix,
  position,
}: {
  header: MyGridHeaderType;
  onColumnFix: (columnKey: string, position: "left" | "right" | null) => void;
  position: { x: number; y: number };
}) {
  const menuContent = (
    <div
      className="fixed shadow-lg z-99"
      data-menu="true"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: "var(--grid-menu-bg)",
        border: "1px solid var(--grid-menu-border)",
        boxShadow: "var(--grid-menu-shadow)",
      }}
    >
      <div>
        <button
          className="flex whitespace-nowrap items-center gap-[5px] w-full px-[5px] py-[5px] text-left text-[12px]"
          style={{
            color: "var(--grid-menu-text)",
            ...(header.isFixedLeft && {
              backgroundColor: "var(--grid-menu-hover)",
            }),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--grid-menu-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = header.isFixedLeft
              ? "var(--grid-menu-hover)"
              : "transparent";
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onColumnFix(header.key, header.isFixedLeft ? null : "left");
          }}
        >
          좌측 고정
          {header.isFixedLeft ? (
            <CheckIcon className="w-[16px] h-[16px]" />
          ) : (
            ""
          )}
        </button>
        <button
          className="flex whitespace-nowrap items-center gap-[5px] w-full px-[5px] py-[5px] text-left text-[12px]"
          style={{
            color: "var(--grid-menu-text)",
            ...(header.isFixedRight && {
              backgroundColor: "var(--grid-menu-hover)",
            }),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--grid-menu-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = header.isFixedRight
              ? "var(--grid-menu-hover)"
              : "transparent";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onColumnFix(header.key, header.isFixedRight ? null : "right");
          }}
        >
          우측 고정
          {header.isFixedRight ? (
            <CheckIcon className="w-[16px] h-[16px]" />
          ) : (
            ""
          )}
        </button>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
