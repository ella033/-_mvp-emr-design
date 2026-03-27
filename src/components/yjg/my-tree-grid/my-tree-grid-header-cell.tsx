import { MyTreeGridHeaderType } from "./my-tree-grid-type";
import { useState } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { getHeaderDefaultWidth, HEADER_MIN_WIDTH } from "./my-tree-grid-util";
import { CheckIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import MyTreeGridResizeHandle from "./my-tree-grid-resize-handle";

interface MyTreeGridHeaderCellProps {
  header: MyTreeGridHeaderType;
  settingButton?: React.ReactNode;
  stickyStyle: React.CSSProperties;
  draggedHeader?: string | null;
  dragOverHeader?: string | null;
  isResizing?: string | null;
  hideBorder?: boolean;
  onDragStart: (e: React.DragEvent, headerKey: string) => void;
  onDragOver: (e: React.DragEvent, headerKey: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetHeaderKey: string) => void;
  onMouseDown?: (e: React.MouseEvent, headerKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  onColumnFix: (columnKey: string, position: "left" | "right" | null) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}

export default function MyTreeGridHeaderCell({
  header,
  settingButton,
  stickyStyle,
  draggedHeader,
  dragOverHeader,
  isResizing,
  hideBorder = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMouseDown,
  onAutoFitColumn,
  onColumnFix,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: MyTreeGridHeaderCellProps) {
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
      data-my-tree-grid-col-key={header.key}
      className={cn(
        "flex flex-nowrap items-center justify-between bg-[var(--grid-header-bg)] hover:bg-[var(--grid-header-hover)] active:cursor-grabbing",
        draggedHeader === header.key ? "opacity-50" : "",
        dragOverHeader === header.key ? "border-l-4 border-l-[var(--grid-cell-focus)]" : ""
      )}
      style={{
        width: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        minWidth: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        borderRight: hideBorder
          ? "none"
          : "1px solid var(--grid-header-border)",
        color: "var(--grid-header-text)",
        ...stickyStyle,
      }}
      draggable={true}
      onDragStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-tree-grid-setting-btn="true"]')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onDragStart(e, header.key);
      }}
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
        data-my-tree-grid-header-content-key={header.key}
        className={`flex overflow-hidden relative flex-1 items-center gap-[3px] ${align()}`}
        style={{
          width: "fit-content",
        }}
      >
        {settingButton ? (
          <div
            data-tree-grid-setting-btn="true"
            className="flex shrink-0 items-center"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {settingButton}
          </div>
        ) : null}
        {header.customRender ? (
          header.customRender
        ) : (
          <span
            data-my-tree-grid-header-overflow-key={header.key}
            className={cn("text-[11px] font-[500] py-[1px] whitespace-nowrap overflow-hidden text-ellipsis", settingButton ? "ps-[0px]" : "ps-[4px]")}
          >
            {header.name}
          </span>
        )}

        {/* 컨텍스트 메뉴 */}
        {openMenu === header.key && menuPosition && (
          <MyTreeGridHeaderMenu
            header={header}
            onColumnFix={handleColumnFix}
            position={menuPosition}
          />
        )}
      </div>
      <MyTreeGridResizeHandle
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

function MyTreeGridHeaderMenu({
  header,
  onColumnFix,
  position,
}: {
  header: MyTreeGridHeaderType;
  onColumnFix: (columnKey: string, position: "left" | "right" | null) => void;
  position: { x: number; y: number };
}) {
  const menuContent = (
    <div
      className="fixed shadow-lg z-90"
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
