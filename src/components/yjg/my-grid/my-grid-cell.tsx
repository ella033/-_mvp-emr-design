import { useRef, useEffect } from "react";
import {
  type MyGridHeaderType,
  type MyGridCellType,
  type MyGridRowType,
} from "./my-grid-type";
import MyInput from "../my-input";
import MyCheckbox from "../my-checkbox";
import { MySelect } from "../my-select";
import { getHeaderDefaultWidth, HEADER_MIN_WIDTH } from "./my-grid-util";
import { cn } from "@/lib/utils";
import { getSafeBooleanValue, getSafeValue, highlightKeyword } from "../common/util/ui-util";
import { MyTooltip } from "../my-tooltip";
import {
  GRID_FONT_SIZE_CLASS,
  TOOLTIP_CLASS,
} from "../common/constant/class-constants";
import MyGridResizeHandle from "./my-grid-resize-handle";

interface MyGridCellProps {
  header: MyGridHeaderType | undefined;
  row: MyGridRowType;
  item: MyGridCellType | undefined;
  isSelected: boolean;
  isHovered: boolean;
  isFocused?: boolean;
  stickyStyle: React.CSSProperties;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  searchKeyword?: string;
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
  onCellFocus?: (rowKey: string | number, headerKey: string) => void;
  isResizing?: string | null;
  onResizeMouseDown?: (e: React.MouseEvent, columnKey: string) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  resizeHandleHoveredHeaderKey?: string | null;
  onResizeHandleHover?: (headerKey: string | null) => void;
}

export default function MyGridCell({
  header,
  row,
  item,
  isSelected,
  isHovered = false,
  isFocused = false,
  stickyStyle,
  size,
  searchKeyword,
  onDataChange,
  onRowDoubleClick,
  onCellFocus,
  isResizing = null,
  onResizeMouseDown,
  onAutoFitColumn,
  resizeHandleHoveredHeaderKey = null,
  onResizeHandleHover,
}: MyGridCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);

  // isFocused가 true가 되면 내부 input에 포커스
  useEffect(() => {
    if (isFocused && cellRef.current) {
      const input = cellRef.current.querySelector(
        'input, textarea, select, [contenteditable="true"]'
      ) as HTMLElement | null;
      if (input) {
        input.focus();
      }
    }
  }, [isFocused]);

  if (!item || !header) return null;

  const align = () => {
    const cellAlign = item.align ?? header.align;
    switch (cellAlign) {
      case "left":
        return "justify-start";
      case "center":
        return "justify-center";
      case "right":
        return "justify-end";
    }
    return "justify-start";
  };

  const handleCellClick = () => {
    // 클릭 시 해당 셀에 포커스 설정
    onCellFocus?.(row.key, header.key);
  };

  return (
    <div
      ref={cellRef}
      data-my-grid-col-key={header.key}
      className={cn(
        "flex overflow-hidden items-center whitespace-nowrap text-ellipsis",
        item?.inputType ? "hover:outline hover:outline-[var(--input-focus)] hover:-outline-offset-1" : "",
        align(),
        isSelected && !row.rowAction
          ? "text-[var(--grid-row-selected-text)] bg-[var(--grid-row-selected)]"
          : isHovered
            ? "text-[var(--grid-row-fg)] bg-[var(--grid-row-hover)]"
            : "text-[var(--grid-row-fg)] bg-[var(--grid-row-bg)]"
      )}
      style={{
        width: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        minWidth: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        ...stickyStyle,
      }}
      onClick={handleCellClick}
      onDoubleClick={(event) => {
        onRowDoubleClick?.(header.key, row, event);
      }}
    >
      <div
        data-my-grid-cell-content-key={header.key}
        className={cn("flex flex-1 min-w-0 overflow-hidden items-center", align())}
      >
        <MyGridCellValue
          header={header}
          rowKey={row.key}
          item={item}
          size={size}
          searchKeyword={searchKeyword}
          onDataChange={onDataChange}
        />
      </div>
      <MyGridResizeHandle
        headerKey={header.key}
        showHandle={
          isResizing === header.key ||
          resizeHandleHoveredHeaderKey === header.key
        }
        onMouseDown={onResizeMouseDown}
        onDoubleClick={onAutoFitColumn}
        onResizeHandleHover={onResizeHandleHover}
        stopPropagationOnMouseDown
      />
    </div>
  );
}

function MyGridCellValue({
  header,
  rowKey,
  item,
  size,
  searchKeyword,
  onDataChange,
}: {
  header: MyGridHeaderType;
  rowKey: string | number;
  item: MyGridCellType;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  searchKeyword?: string;
  onDataChange?: (
    rowKey: string | number,
    columnKey: string,
    value: string | number | boolean,
    orgData?: any
  ) => void;
}) {
  if (!item || !header) return null;

  const sizeClass =
    GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS];

  const align = () => {
    const cellAlign = item.align ?? header.align;
    switch (cellAlign) {
      case "left":
        return "text-left";
      case "center":
        return "text-center";
      case "right":
        return "text-right";
    }
    return "text-left";
  };

  if (item.customRender) {
    return <>{item.customRender}</>;
  }

  if (header.readonly) {
    return (
      <MyGridRowItemLabel
        item={item}
        headerKey={header.key}
        align={align()}
        searchKeyword={searchKeyword}
      />
    );
  }

  switch (item.inputType) {
    case "text":
      return (
        <MyInput
          type="text"
          readOnly={header.readonly}
          className={cn(
            sizeClass,
            `m-[1px] rounded-none border-none bg-transparent focus-within:bg-[var(--input-bg)] ${align()}`
          )}
          value={String(getSafeValue(item.value))}
          maxLength={item.textOption?.maxLength}
          onBlur={(value) => {
            if (!header.readonly) {
              onDataChange?.(rowKey, header.key, String(value), item.orgData);
            }
          }}
        />
      );
    case "textNumber":
      return (
        <MyInput
          type="text-number"
          readOnly={header.readonly}
          className={cn(
            sizeClass,
            `m-[1px] rounded-none border-none ${align()}`
          )}
          value={String(getSafeValue(item.value))}
          min={item.textNumberOption?.min}
          max={item.textNumberOption?.max}
          referenceValue={{
            normalMin: item.textNumberOption?.normalMin,
            normalMax: item.textNumberOption?.normalMax,
          }}
          pointPos={item.textNumberOption?.pointPos}
          pointType={item.textNumberOption?.pointType}
          unit={item.textNumberOption?.unit}
          showComma={item.textNumberOption?.showComma}
          onBlur={(value) => {
            if (!header.readonly) {
              onDataChange?.(rowKey, header.key, String(value), item.orgData);
            }
          }}
        />
      );
    case "select":
      return (
        <MySelect
          readOnly={header.readonly}
          className="border-none w-full"
          parentClassName="w-full"
          value={String(getSafeValue(item.value))}
          onChange={(value) => {
            if (!header.readonly) {
              onDataChange?.(rowKey, header.key, value, item.orgData);
            }
          }}
          options={item.selectOption}
        />
      );

    case "date":
      return (
        <MyInput
          type="date"
          readOnly={header.readonly}
          className="border-none"
          value={String(getSafeValue(item.value))}
          onChange={(value) => {
            if (!header.readonly) {
              onDataChange?.(rowKey, header.key, value, item.orgData);
            }
          }}
        />
      );

    case "time":
      return (
        <MyInput
          type="time"
          readOnly={header.readonly}
          className="border-none"
          value={String(getSafeValue(item.value))}
          onChange={(value) => {
            if (!header.readonly) {
              onDataChange?.(rowKey, header.key, value, item.orgData);
            }
          }}
        />
      );

    case "dateTime":
      return (
        <MyInput
          type="dateTime"
          readOnly={header.readonly}
          className={cn(
            sizeClass,
            "border-none bg-transparent focus-within:bg-[var(--input-bg)] rounded-none"
          )}
          value={String(getSafeValue(item.value))}
          onChange={(value) => {
            if (!header.readonly) {
              onDataChange?.(rowKey, header.key, value, item.orgData);
            }
          }}
        />
      );

    case "checkbox":
      return (
        <MyCheckbox
          checked={getSafeBooleanValue(item.value)}
          onChange={(checked) => {
            if (!header.readonly && !item.disabled) {
              onDataChange?.(rowKey, header.key, checked, item.orgData);
            }
          }}
          readOnly={header.readonly}
          disabled={item.disabled}
          tooltip={item.tooltip}
          tooltipDelayDuration={item.tooltipDelayDuration}
        />
      );

    default:
      return (
        <MyGridRowItemLabel
          item={item}
          headerKey={header.key}
          align={align()}
          searchKeyword={searchKeyword}
        />
      );
  }
}

function MyGridRowItemLabel({
  item,
  headerKey,
  align,
  searchKeyword,
}: {
  item: MyGridCellType;
  headerKey: string;
  align: string;
  searchKeyword?: string;
}) {
  const formatNumber = (
    value: string | number | boolean | null | undefined
  ): string => {
    const safeValue = getSafeValue(value);
    if (item.inputType === "textNumber" && item.textNumberOption?.showComma) {
      const numStr = String(safeValue);
      if (!numStr || numStr === "" || numStr === "-") return numStr;

      const parts = numStr.split(".");
      const integerPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "";
      return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
    }
    return String(safeValue);
  };

  const displayValue = formatNumber(item.value);
  const highlightedValue = highlightKeyword(displayValue, searchKeyword);

  return (
    <div
      className={`px-2 py-1 ${align} whitespace-nowrap overflow-hidden text-ellipsis`}
    >
      <MyTooltip
        align="start"
        delayDuration={500}
        content={<pre className={TOOLTIP_CLASS}>{displayValue}</pre>}
      >
        <div
          data-my-grid-cell-overflow-key={headerKey}
          className="w-full truncate text-[12px]"
        >
          {highlightedValue}
        </div>
      </MyTooltip>
    </div>
  );
}
