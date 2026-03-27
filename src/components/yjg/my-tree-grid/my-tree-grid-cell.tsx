import MyInput from "../my-input";
import MyCheckbox from "../my-checkbox";
import { MySelect } from "../my-select";
import { cn } from "@/lib/utils";
import { getSafeBooleanValue, getSafeValue, highlightKeyword } from "../common/util/ui-util";
import {
  getCellValueAsString,
  getHeaderDefaultWidth,
  getRowHeight,
  HEADER_MIN_WIDTH,
} from "./my-tree-grid-util";
import MyTreeGridResizeHandle from "./my-tree-grid-resize-handle";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
  MyTreeGridRowCellType,
} from "./my-tree-grid-type";
import { Check } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import MySelectPopUp from "@/components/yjg/my-select-pop-up";
import { MyTooltip } from "../my-tooltip";
import MyTreeGridRowIcon from "./my-tree-grid-row-icon";
import {
  GRID_FONT_SIZE_CLASS,
  ITEM_TYPE_ICON_SIZE_CLASS,
  TOOLTIP_CLASS,
} from "../common/constant/class-constants";
import DrugSeparationExceptionCodeInput from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-input";
import SpecimenDetailInput from "@/components/library/specimen-detail/specimen-detail-input";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import ExternalCauseCodeInput from "@/components/library/external-cause-code/external-cause-code-input";
import MyCalendar from "../my-calendar";
import MyDropDown from "../my-drop-down";
import { MyButton } from "../my-button";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/date-utils";
import MyHorizontalScrollContainer from "../my-horizontal-scroll-container";
import SpecificDetailInput from "@/components/library/specific-detail/specific-detail-input";
import UsageInput from "@/components/library/usage/usage-input";
import OrderIsClaimButton from "@/components/disease-order/order/order-is-claim-button";
import OrderPaymentMethod from "@/components/disease-order/order/order-payment-method";

interface MyTreeGridCellProps {
  isFirstHeader: boolean;
  header: MyTreeGridHeaderType | undefined;
  data: MyTreeGridRowType[];
  row: MyTreeGridRowType;
  selectedRows: MyTreeGridRowType[];
  stickyStyle: React.CSSProperties;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
  onContextMenu: (
    e: React.MouseEvent,
    header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    selectedRows: MyTreeGridRowType[]
  ) => void;
  showContextMenu: boolean;
  hideBorder?: boolean;
  onToggleExpansion?: (row: MyTreeGridRowType) => void;
  searchKeyword?: string;
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

export default function MyTreeGridCell({
  isFirstHeader,
  header,
  data,
  row,
  selectedRows,
  stickyStyle,
  size,
  onDataChangeItem,
  onContextMenu,
  showContextMenu,
  hideBorder = false,
  onToggleExpansion,
  searchKeyword,
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
}: MyTreeGridCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const item =
    row && header ? row.cells.find((c) => c.headerKey === header.key) : undefined;
  const isFocused =
    !!focusedCell &&
    !!row &&
    !!header &&
    focusedCell.rowKey === row.rowKey &&
    focusedCell.headerKey === header.key;
  const isEditingCell =
    !!header &&
    editingCell?.rowKey === row.rowKey &&
    editingCell?.headerKey === header.key;

  useEffect(() => {
    if (!isFocused || !cellRef.current) return;
    const el = cellRef.current.querySelector<HTMLElement>(
      'input:not([disabled]):not([readonly]), select:not([disabled]), button:not([disabled]), [tabindex="0"]'
    );
    if (el) {
      el.focus({ preventScroll: true });
    } else {
      cellRef.current.focus({ preventScroll: true });
    }
  }, [isFocused]);

  if (!row || !header) return null;

  const isSelected = Array.from(selectedRows).some(
    (n) => n.rowKey === row.rowKey
  );

  const align = () => {
    if (isFirstHeader) {
      return "justify-start";
    }

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

  return (
    <div
      ref={cellRef}
      data-my-tree-grid-col-key={header.key}
      role="gridcell"
      tabIndex={0}
      className={cn(
        "flex overflow-hidden items-center whitespace-nowrap text-ellipsis",
        item?.inputType && item.inputType !== "specimen-detail-external"
          ? "hover:outline hover:outline-[var(--input-focus)] hover:-outline-offset-1 focus:outline focus:outline-[var(--input-focus)] focus:-outline-offset-1 focus-within:outline focus-within:outline-[var(--input-focus)] focus-within:-outline-offset-1"
          : "",
        isSelected
          ? "text-[var(--grid-row-selected-text)] bg-[var(--grid-row-selected)]"
          : row.className
            ? row.className
            : "text-[var(--grid-row-fg)] bg-[var(--grid-row-bg)]",
        hideBorder
          ? "border-none"
          : "border-b border-r border-[var(--grid-border)]",
        align()
      )}
      style={{
        width: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        minWidth: `${Math.max(header.width ?? getHeaderDefaultWidth(header.name), header.minWidth ?? HEADER_MIN_WIDTH)}px`,
        height: `${getRowHeight(size)}px`,
        ...stickyStyle,
      }}
      onFocus={() => {
        if (onCellFocus) {
          onCellFocus(row.rowKey, header.key);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        showContextMenu && onContextMenu(e, header, row, selectedRows);
      }}
    >
      {isFirstHeader && (
        <MyTreeGridRowIcon
          size={size}
          data={data}
          row={row}
          onToggleExpansion={onToggleExpansion}
          showRowIcon={showRowIcon}
        />
      )}

      <div
        data-my-tree-grid-cell-content-key={header.key}
        className={cn("flex flex-1 min-w-0 overflow-hidden items-center", align())}
      >
        <MyTreeGridCellValue
          header={header}
          row={row}
          item={item}
          onDataChangeItem={onDataChangeItem}
          isEditingCell={isEditingCell}
          textEditTriggerMode={textEditTriggerMode}
          onEditEnd={onEditEnd}
          searchKeyword={searchKeyword}
          size={size}
        />
      </div>

      <MyTreeGridResizeHandle
        headerKey={header.key}
        showHandle={
          isResizing === header.key || resizeHandleHoveredHeaderKey === header.key
        }
        onMouseDown={onResizeMouseDown}
        onDoubleClick={onAutoFitColumn}
        onResizeHandleHover={onResizeHandleHover}
        stopPropagationOnMouseDown
      />
    </div>
  );
}

function MyTreeGridCellValue({
  header,
  row,
  item,
  onDataChangeItem,
  isEditingCell = false,
  textEditTriggerMode = "direct",
  onEditEnd,
  searchKeyword,
  size,
}: {
  header: MyTreeGridHeaderType;
  row: MyTreeGridRowType;
  item: MyTreeGridRowCellType | undefined;
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
  isEditingCell?: boolean;
  textEditTriggerMode?: "direct" | "explicit";
  onEditEnd?: () => void;
  searchKeyword?: string;
  size: "xs" | "sm" | "default" | "lg" | "xl";
}) {
  if (!row || !header) return null;

  if (!item) {
    return (
      <div className="flex items-center w-full h-full hover:cursor-not-allowed"></div>
    )
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const isEscapePressedRef = useRef(false);
  const isTextCell = item.inputType === "text";
  const isTextReadOnly =
    isTextCell &&
    (!!header.readonly || (textEditTriggerMode === "explicit" && !isEditingCell));

  useEffect(() => {
    if (!isTextCell || isTextReadOnly || !isEditingCell || !inputRef.current) return;

    // 편집 모드 진입 시 즉시 포커스 + 전체 선택하여 바로 덮어쓰기 가능하게 처리
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.select();
    });
  }, [isTextCell, isTextReadOnly, isEditingCell]);

  const sizeClass =
    GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS];

  const align = () => {
    switch (header.align) {
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

  switch (item.inputType) {
    case "text": {
      const isReadOnly = isTextReadOnly;
      // readOnly 텍스트 셀은 검색어 하이라이트를 위해 MyTreeGridCellLabel 사용
      if (isReadOnly) {
        return (
          <MyTreeGridCellLabel
            item={item}
            headerKey={header.key}
            align={align()}
            searchKeyword={searchKeyword}
            size={size}
          />
        );
      }
      return (
        <MyInput
          ref={inputRef}
          type="text"
          readOnly={isReadOnly}
          className={cn(
            sizeClass,
            isReadOnly && "pointer-events-none",
            isReadOnly
              ? `rounded-none border-none bg-transparent hover:border-transparent focus:border-transparent focus:ring-0 ${align()}`
              : `rounded-none border-none m-[1px] ${align()}`,
            item.className
          )}
          value={String(getSafeValue(item.value))}
          maxLength={item.textOption?.maxLength}
          onMouseDown={(e) => {
            if (isReadOnly) {
              // readOnly 상태에서는 입력 포커스를 막고 row 선택으로 처리
              e.preventDefault();
              return;
            }
            e.stopPropagation();
          }}
          onClick={(e) => {
            if (!isReadOnly) {
              e.stopPropagation();
            }
          }}
          onBlur={(value) => {
            // Escape로 blur된 경우 저장하지 않음
            if (isEscapePressedRef.current) {
              isEscapePressedRef.current = false;
              onEditEnd?.();
              return;
            }
            if (!isReadOnly) {
              onDataChangeItem?.(header.key, row, String(value));
            }
            onEditEnd?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter는 blur만 호출 (onBlur에서 저장됨)
              inputRef.current?.blur();
            } else if (e.key === "Escape") {
              // Escape는 저장 없이 취소
              isEscapePressedRef.current = true;
              inputRef.current?.blur();
            }
          }}
        />
      );
    }
    case "textNumber":
      return (
        <MyInput
          ref={inputRef}
          type="text-number"
          readOnly={header.readonly}
          className={cn(
            sizeClass,
            `m-[1px] rounded-none border-none bg-transparent focus:bg-[var(--input-bg)] ${align()}`
          )}
          value={String(getSafeValue(item.value))}
          min={item.textNumberOption?.min}
          max={item.textNumberOption?.max}
          pointPos={item.textNumberOption?.pointPos}
          pointType={item.textNumberOption?.pointType}
          unit={item.textNumberOption?.unit}
          showComma={item.textNumberOption?.showComma}
          onBlur={(value) => {
            // Escape로 blur된 경우 저장하지 않음
            if (isEscapePressedRef.current) {
              isEscapePressedRef.current = false;
              return;
            }
            onDataChangeItem?.(header.key, row, String(value));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter는 blur만 호출 (onBlur에서 저장됨)
              inputRef.current?.blur();
            } else if (e.key === "Escape") {
              // Escape는 저장 없이 취소
              isEscapePressedRef.current = true;
              inputRef.current?.blur();
            }
          }}
        />
      );
    case "select":
      return (
        <MySelect
          size={size}
          readOnly={header.readonly}
          className={cn(sizeClass, "w-full border-none bg-transparent")}
          parentClassName="w-full"
          value={String(getSafeValue(item.value))}
          onChange={(value) => {
            if (!header.readonly) {
              onDataChangeItem?.(header.key, row, value);
            }
          }}
          options={item.selectOption}
        />
      );

    case "select-popup":
      return (
        <div className="flex items-center w-full h-full hover:border">
          <MySelectPopUp
            value={String(item.value)}
            title={header.name}
            options={item.selectPopupOption || []}
            onChange={(option) => {
              if (!header.readonly) {
                onDataChangeItem?.(header.key, row, option.value);
              }
            }}
            className="w-full border-none"
            disabled={header.readonly}
          />
        </div>
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
              onDataChangeItem?.(header.key, row, value);
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
              onDataChangeItem?.(header.key, row, value);
            }
          }}
        />
      );

    case "dateTime":
      return (
        <MyInput
          type="dateTime"
          readOnly={header.readonly}
          className="border-none"
          value={String(getSafeValue(item.value))}
          onChange={(value) => {
            if (!header.readonly) {
              onDataChangeItem?.(header.key, row, value);
            }
          }}
        />
      );

    case "myDateTime":
      return (
        <MyDateTimeCell
          header={header}
          row={row}
          item={item}
          size={size}
          onDataChangeItem={onDataChangeItem}
        />
      );

    case "checkbox":
      return (
        <MyCheckbox
          checked={getSafeBooleanValue(item.value)}
          onChange={(checked) => {
            if (!header.readonly) {
              onDataChangeItem?.(header.key, row, checked);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          readOnly={header.readonly}
        />
      );

    case "external-cause-code":
      return (
        <ExternalCauseCodeInput
          size={size}
          currentCode={String(getSafeValue(item.value))}
          onChange={(value) => {
            onDataChangeItem?.(header.key, row, value);
          }}
          readonly={item.readonly ?? false}
        />
      );

    case "usage":
      return (
        <UsageInput
          size={size}
          itemType={getCellValueAsString(row, "itemType") || ""}
          currentUsage={String(getSafeValue(item.value))}
          onChange={(usageCode, usageText) => {
            onDataChangeItem?.(
              header.key,
              row,
              usageCode ? usageCode.code : usageText
            );
          }}
          readonly={item.readonly ?? false}
        />
      );

    case "exception-code":
      return (
        <DrugSeparationExceptionCodeInput
          size={size}
          type={DrugSeparationExceptionCodeType.Drug}
          currentCode={String(getSafeValue(item.value))}
          onChange={(value) => {
            onDataChangeItem?.(header.key, row, value);
          }}
          readonly={item.readonly ?? false}
        />
      );

    case "specific-detail":
      return (
        <SpecificDetailInput
          size={size}
          row={row}
          currentSpecificDetail={String(getSafeValue(item.value))}
          onChange={(value) => {
            onDataChangeItem?.(header.key, row, value);
          }}
          readonly={item.readonly ?? false}
        />
      );

    case "specimen-detail":
      return (
        <SpecimenDetailInput
          specimenDetailsJson={JSON.stringify(item.value)}
          onChange={(value) => {
            onDataChangeItem?.(header.key, row, value);
          }}
          readonly={item.readonly ?? false}
        />
      );

    case "specimen-detail-external":
      const specimenDetail = JSON.parse(String(item.value));
      const specimenDetailValue =
        specimenDetail?.length
          ? specimenDetail.map((s: any) => s.name).filter(Boolean).join(", ")
          : null;

      return (
        <div className={cn(
          GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS],
        )}
        >
          {specimenDetailValue}
        </div>
      )

    case "is-claim":
      return (
        <OrderIsClaimButton
          size={size}
          row={row}
          onDataChangeItem={onDataChangeItem}
        />
      );

    case "payment-method":
      return (
        <OrderPaymentMethod
          size={size}
          row={row}
          readOnly={!!header.readonly}
          onDataChangeItem={onDataChangeItem}
        />
      );

    default:
      return (
        <MyTreeGridCellLabel
          item={item}
          headerKey={header.key}
          align={align()}
          searchKeyword={searchKeyword}
          size={size}
        />
      );
  }
}

// myDateTime 기간 버튼 설정
const DATE_PERIOD_BUTTONS = [
  { label: "다음에", days: null },
  { label: "1주일", days: 7 },
  { label: "2주일", days: 14 },
  { label: "1개월", months: 1 },
  { label: "2개월", months: 2 },
  { label: "3개월", months: 3 },
  { label: "6개월", months: 6 },
  { label: "1년", months: 12 },
] as const;

// myDateTime 셀 컴포넌트
function MyDateTimeCell({
  header,
  row,
  item,
  size,
  onDataChangeItem,
}: {
  header: MyTreeGridHeaderType;
  row: MyTreeGridRowType;
  item: MyTreeGridRowCellType;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const sizeClass =
    GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS];
  const iconSizeClass =
    ITEM_TYPE_ICON_SIZE_CLASS[size as keyof typeof ITEM_TYPE_ICON_SIZE_CLASS];

  // 현재 값을 Date로 변환
  const currentDate = item.value ? new Date(String(item.value)) : null;
  const displayValue = currentDate ? formatDate(currentDate, "-") : "다음 내원";

  const handleDateSelect = (date: Date) => {
    if (!header.readonly) {
      // yyyy-MM-dd 형식으로 저장
      onDataChangeItem?.(header.key, row, formatDate(date, "-"));
      setIsOpen(false);
      setSelectedPeriod(null);
    }
  };

  // 기간 버튼 클릭 핸들러
  const handlePeriodClick = (
    label: string,
    days?: number | null,
    months?: number
  ) => {
    if (header.readonly) return;

    // "다음에" 버튼 - 날짜 초기화
    if (days === null) {
      onDataChangeItem?.(header.key, row, "");
      setIsOpen(false);
      setSelectedPeriod(null);
      return;
    }

    const baseDate = new Date();
    let targetDate: Date;

    if (months) {
      targetDate = new Date(baseDate);
      targetDate.setMonth(targetDate.getMonth() + months);
    } else if (days) {
      targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + days);
    } else {
      return;
    }

    onDataChangeItem?.(header.key, row, formatDate(targetDate, "-"));
    setSelectedPeriod(label);
    setIsOpen(false);
  };

  return (
    <MyDropDown
      trigger={
        <button
          type="button"
          disabled={header.readonly}
          className={cn(
            "flex items-center w-full h-full px-1 gap-1",
            "hover:bg-[var(--bg-hover)] transition-colors",
            header.readonly && "cursor-not-allowed opacity-50",
            sizeClass
          )}
        >
          <span className="flex-1 truncate text-left min-w-0">
            {displayValue}
          </span>
          <CalendarIcon
            className={cn(
              iconSizeClass,
              "flex-shrink-0 text-[var(--gray-400)]"
            )}
          />
        </button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      fixedWidth={280}
      maxHeight={450}
    >
      <MyCalendar
        selectedDate={currentDate}
        onDateSelectAction={handleDateSelect}
        size="sm"
        className="border-none shadow-none"
        disabledRule={{
          minDate: new Date(new Date().setHours(0, 0, 0, 0)), // 오늘 이전 날짜 비활성화
        }}
        headerContent={
          <div className="flex flex-row items-center justify-between">
            <div className="flex-1 min-w-0">
              <MyHorizontalScrollContainer gap={4}>
                {DATE_PERIOD_BUTTONS.map((btn) => (
                  <MyButton
                    key={btn.label}
                    variant={
                      selectedPeriod === btn.label ? "default" : "outline"
                    }
                    onClick={() =>
                      handlePeriodClick(
                        btn.label,
                        "days" in btn ? btn.days : undefined,
                        "months" in btn ? btn.months : undefined
                      )
                    }
                    className="shrink-0 whitespace-nowrap"
                  >
                    {btn.label}
                  </MyButton>
                ))}
              </MyHorizontalScrollContainer>
            </div>
            <div className="shrink-0">
              <MyButton
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6"
              >
                <XMarkIcon className="w-4 h-4" />
              </MyButton>
            </div>
          </div>
        }
      />
    </MyDropDown>
  );
}

function MyTreeGridCellLabel({
  item,
  headerKey,
  align,
  searchKeyword,
  size,
}: {
  item: MyTreeGridRowCellType;
  headerKey: string;
  align: string;
  searchKeyword?: string;
  size: "xs" | "sm" | "default" | "lg" | "xl";
}) {
  if (typeof item.value === "boolean") {
    return (
      <div className={`flex items-center`}>
        {item.value && (
          <Check
            className={cn(
              ITEM_TYPE_ICON_SIZE_CLASS[
              size as keyof typeof ITEM_TYPE_ICON_SIZE_CLASS
              ]
            )}
          />
        )}
      </div>
    );
  }


  const value = getSafeValue(item.value);
  const highlightedValue = highlightKeyword(String(value), searchKeyword);

  return (
    <div
      className={`flex flex-1 items-center min-w-0 h-full ${align} select-none`}
      tabIndex={0}
    >
      <MyTooltip
        align="start"
        delayDuration={500}
        content={<pre className={TOOLTIP_CLASS}>{value}</pre>}
      >
        <div
          data-my-tree-grid-cell-overflow-key={headerKey}
          className={cn("w-full truncate text-[12px] px-[4px] py-[2px]",
            item.className
          )}
        >
          {highlightedValue}
        </div>
      </MyTooltip>
    </div>
  );
}
