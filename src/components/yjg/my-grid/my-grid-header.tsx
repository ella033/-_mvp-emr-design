import React, { useState, useCallback } from "react";
import { getStickyStyle } from "./my-grid-util";
import type { MyGridHeaderType } from "./my-grid-type";
import { MyGridHeaderRowContainer } from "./my-grid-etc";
import MyGridHeaderCell from "./my-grid-header-cell";
import MyCheckbox from "@/components/yjg/my-checkbox";

interface MyGridHeaderProps {
  headers: MyGridHeaderType[];
  /**
   * 렌더링 전용 헤더 배열.
   * fittingScreen 등으로 계산된 width를 표시/스티키 계산에만 사용하고,
   * 저장/상태 변경(onHeadersChange)은 props.headers(base)를 기준으로 처리한다.
   */
  renderHeaders?: MyGridHeaderType[];
  isRowSelectByCheckbox?: boolean;
  onHeadersChange?: (newHeaders: MyGridHeaderType[]) => void;
  onSort?: (columnKey: string, direction: "asc" | "desc" | null) => void;
  onCheckAll?: (checked: boolean) => void;
  selectedRows?: Set<any>;
  totalRows?: number;
  isResizing?: string | null;
  onResizeMouseDown?: (e: React.MouseEvent, columnKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}

export default function MyGridHeader({
  headers,
  renderHeaders,
  isRowSelectByCheckbox,
  onHeadersChange,
  onSort,
  onCheckAll,
  selectedRows,
  totalRows = 0,
  isResizing = null,
  onResizeMouseDown,
  onAutoFitColumn,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: MyGridHeaderProps) {
  const displayHeaders = renderHeaders ?? headers;

  // 모든 row가 선택되어 있으면 true, 일부만 선택되면 indeterminate, 아무것도 선택되지 않으면 false
  const checked =
    selectedRows && totalRows > 0 ? selectedRows.size === totalRows : false;
  const indeterminate =
    selectedRows && totalRows > 0
      ? selectedRows.size > 0 && selectedRows.size < totalRows
      : false;
  const [draggedHeader, setDraggedHeader] = useState<string | null>(null);
  const [dragOverHeader, setDragOverHeader] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  // ========== header reorder start ==========
  const handleHeaderReorder = useCallback(
    (draggedKey: string, targetKey: string) => {
      if (draggedKey === targetKey) return;

      const draggedIndex = headers.findIndex(
        (h: MyGridHeaderType) => h.key === draggedKey
      );
      const targetIndex = headers.findIndex(
        (h: MyGridHeaderType) => h.key === targetKey
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
      const newHeaders = headers.map((header: MyGridHeaderType) => {
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

  const handleOnSort = (header: MyGridHeaderType) => {
    if (header.sortable) {
      let newDirection: "asc" | "desc" | null = "asc";

      if (sortColumn === header.key) {
        if (sortDirection === "asc") {
          newDirection = "desc";
        } else if (sortDirection === "desc") {
          newDirection = null;
        }
      }

      setSortColumn(newDirection ? header.key : null);
      setSortDirection(newDirection);
      onSort?.(header.key, newDirection);
    }
  };

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onCheckAll?.(checked);
    },
    [onCheckAll]
  );

  return (
    <MyGridHeaderRowContainer>
      {isRowSelectByCheckbox && (
        <div
          className="flex pl-[8px] pr-[1px] items-center bg-[var(--grid-header-bg)]"
          data-my-grid-checkbox-col="true"
        >
          <MyCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={handleCheckboxChange}
          />
        </div>
      )}
      {displayHeaders
        .filter((header: MyGridHeaderType) => header.visible)
        .map((header: MyGridHeaderType) => {
          return (
            <MyGridHeaderCell
              key={header.key}
              header={header}
              stickyStyle={getStickyStyle(displayHeaders, header)}
              draggedHeader={draggedHeader}
              dragOverHeader={dragOverHeader}
              isResizing={isResizing}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseDown={onResizeMouseDown}
              onAutoFitColumn={onAutoFitColumn}
              onSort={handleOnSort}
              onColumnFix={handleColumnFix}
              resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
              onResizeHandleHover={onResizeHandleHover}
            />
          );
        })}
    </MyGridHeaderRowContainer>
  );
}
