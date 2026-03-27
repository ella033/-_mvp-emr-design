import { MyGridHeaderRowContainer } from "./my-grid-etc";
import MyGridCell from "./my-grid-cell";
import type {
  MyGridHeaderType,
  MyGridRowType,
  FocusedCellType,
} from "./my-grid-type";
import { getCell, getRowHeight, getStickyStyle } from "./my-grid-util";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

export default function MyGridRow({
  headers,
  row,
  selectedRows,
  isRowSelectByCheckbox,
  enableCellNavigation,
  focusedCell,
  size,
  searchKeyword,
  onRowClick,
  onRowContextMenu,
  onDataChange,
  onRowDoubleClick,
  onCheckRow,
  onCellFocus,
  isResizing = null,
  onResizeMouseDown,
  onAutoFitColumn,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: {
  headers: MyGridHeaderType[];
  row: MyGridRowType;
  selectedRows: Set<MyGridRowType>;
  isRowSelectByCheckbox?: boolean;
  enableCellNavigation?: boolean;
  focusedCell?: FocusedCellType;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  searchKeyword?: string;
  onRowClick: (row: MyGridRowType, event: React.MouseEvent) => void;
  onRowContextMenu?: (row: MyGridRowType, event: React.MouseEvent) => void;
  onDataChange?: (
    rowKey: string | number,
    columnKey: string,
    value: string | number | boolean,
    orgData?: any
  ) => void;
  onRowDoubleClick?: (
    headerKey: string,
    row: MyGridRowType,
    event: React.MouseEvent
  ) => void;
  onCheckRow?: (checked: boolean, row: MyGridRowType) => void;
  onCellFocus?: (rowKey: string | number, headerKey: string) => void;
  isResizing?: string | null;
  onResizeMouseDown?: (e: React.MouseEvent, columnKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}) {
  const isSelected = Array.from(selectedRows).some((r) => r.key === row.key);
  const checkboxDisabled = !!row.checkboxDisabled;
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      if (checkboxDisabled) return;
      onCheckRow?.(checked, row);
    },
    [onCheckRow, row, checkboxDisabled]
  );

  return (
    <MyGridHeaderRowContainer
      onClick={(e) => onRowClick(row, e)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRowContextMenu?.(row, e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: `${getRowHeight(size)}px`,
      }}
    >
      {isRowSelectByCheckbox && (
        <div
          className={cn(
            isSelected
              ? "bg-[var(--grid-row-selected)]"
              : isHovered
                ? "bg-[var(--grid-row-hover)]"
                : "bg-[var(--grid-row-bg)]",
            "flex pl-[8px] pr-[1px] items-center"
          )}
        >
          <MyCheckbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            disabled={checkboxDisabled}
          />
        </div>
      )}
      {headers
        .filter((header) => header.visible)
        .map((header) => {
          const item = getCell(row, header.key);
          if (!item) return null;
          return (
            <MyGridCell
              key={header.key}
              header={header}
              row={row}
              item={item}
              isSelected={isSelected}
              isHovered={isHovered}
              isFocused={
                enableCellNavigation &&
                focusedCell?.rowKey === row.key &&
                focusedCell?.headerKey === header.key
              }
              stickyStyle={getStickyStyle(headers, header)}
              size={size}
              searchKeyword={searchKeyword}
              onDataChange={onDataChange}
              onRowDoubleClick={onRowDoubleClick}
              onCellFocus={onCellFocus}
              isResizing={isResizing}
              onResizeMouseDown={onResizeMouseDown}
              onAutoFitColumn={onAutoFitColumn}
              resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
              onResizeHandleHover={onResizeHandleHover}
            />
          );
        })}
      {/* rowAction이 있으면 공간 확보, hover 상태일 때만 표시 */}
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
        >
          {row.rowAction}
        </div>
      )}
    </MyGridHeaderRowContainer>
  );
}
