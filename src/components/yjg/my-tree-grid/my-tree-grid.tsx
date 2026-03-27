"use client";
import "@/components/yjg/common/style/my-style.css";
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type {
  MyTreeGridRowType,
  MyTreeGridHeaderType,
} from "./my-tree-grid-type";
import type {
  ContextMenuAction,
  MyTreeGridDragDropInfo,
} from "./my-tree-grid-interface";
import {
  HEADER_MIN_WIDTH,
  moveNode,
  findParentRow,
  flattenTree,
  getHeaderDefaultWidth,
  getColumnContentWidth,
} from "./my-tree-grid-util";
import { MyLoadingSpinner } from "../my-loading-spinner";
import { MsgContainer } from "./my-tree-grid-etc";
import MyTreeGridHeader from "./my-tree-grid-header";
import MyTreeGridRow from "./my-tree-grid-row";
import MyTreeGridContextMenu from "./my-tree-grid-context-menu";
import { getRowHeight } from "../my-tree-grid/my-tree-grid-util";
import { ITEM_TYPE_CONTAINER_SIZE_PX } from "../common/constant/class-constants";

// MyTree의 ref 타입 정의
export interface MyTreeGridRef {
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToRow: (rowIndex: number) => void;
  startEditCell: (rowKey: string, headerKey: string) => void;
  getScrollPosition: () => {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  };
  clearSelection: () => void;
  /** 선택을 지정한 rowKey들로 설정. data에 있는 row만 선택됨. */
  setSelectedRowKeys: (rowKeys: string[]) => void;
  getSelectedRows: () => MyTreeGridRowType[];
  /** 마지막 행을 선택하고 포커스 이동 */
  focusLastRow: () => void;
}

interface MyTreeGridProps {
  headers: MyTreeGridHeaderType[];
  data: MyTreeGridRowType[];
  setHeaders: (headers: MyTreeGridHeaderType[]) => void;
  settingButtonOptions?: {
    title?: string;
    defaultHeaders: MyTreeGridHeaderType[];
    showRowIconSetting?: boolean;
    showRowIcon?: boolean;
    onShowRowIconChange?: (show: boolean) => void;
  };
  onLoadMore?: () => void;
  onDataChange: (data: MyTreeGridRowType[]) => void;
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
  onMoveNode?: (
    movedData: MyTreeGridRowType[],
    dragInfo: MyTreeGridDragDropInfo
  ) => void;
  onSelectedRowsChange?: (
    selectedRows: MyTreeGridRowType[],
    lastSelectedRow: MyTreeGridRowType | null
  ) => void;
  onRowDoubleClick?: (row: MyTreeGridRowType, event?: React.MouseEvent) => void;
  onRowClick?: (row: MyTreeGridRowType, event?: React.MouseEvent) => void;
  showContextMenu?: boolean;
  contextMenuActions?: ContextMenuAction[];
  hideBorder?: boolean;
  hideHeader?: boolean;
  allowDragDrop?: boolean;
  autoExpandOnDrop?: boolean;
  defaultExpanded?: boolean; // 하위 row의 최초 확장 상태 (기본값: true - 열린 상태)
  isLoading?: boolean;
  hasMore?: boolean;
  isTypeOrder?: boolean;
  multiSelect?: boolean;
  isOutSideClickUnSelect?: boolean;
  actionRow?: React.ReactNode;
  searchKeyword?: string;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  /** true면 행 아이콘(지시 버튼 등) 표시. 설정 버튼에서 "아이콘 보이기" 옵션을 쓰려면 showRowIconSetting도 true로 넘기고 상태를 부모에서 관리 */
  showRowIcon?: boolean;
  /** text input 셀 편집 활성화 방식. direct: 기존처럼 즉시 편집, explicit: 명시적 트리거(F2/컨텍스트 메뉴)에서만 편집 */
  textEditTriggerMode?: "direct" | "explicit";
  /** true면 package를 package 하위로 드롭할 수 없음 */
  disablePackageChildrenDrop?: boolean;
  /** 마지막 행에서 아래 방향키를 눌렀을 때 호출 */
  onNavigatePastLastRow?: () => void;
  /** 그리드 내부 빈 공간(행이 아닌 곳)을 클릭했을 때 호출 */
  onEmptyAreaClick?: () => void;
}

const MyTreeGrid = forwardRef<MyTreeGridRef, MyTreeGridProps>(
  (
    {
      headers,
      data,
      setHeaders,
      settingButtonOptions,
      onLoadMore,
      onDataChange,
      onDataChangeItem,
      onMoveNode,
      onSelectedRowsChange,
      onRowDoubleClick,
      onRowClick,
      showContextMenu = true,
      contextMenuActions,
      hideBorder = false,
      hideHeader = false,
      allowDragDrop = true,
      autoExpandOnDrop = true,
      defaultExpanded = true,
      isLoading = false,
      hasMore = false,
      isTypeOrder = false,
      multiSelect = true,
      isOutSideClickUnSelect = true,
      actionRow,
      searchKeyword,
      size = "default",
      showRowIcon = true,
      textEditTriggerMode = "direct",
      disablePackageChildrenDrop = false,
      onNavigatePastLastRow,
      onEmptyAreaClick,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    /** sticky header/actionRow 높이를 측정하여 virtualizer scrollMargin/scrollPaddingEnd에 반영 */
    const headerRef = useRef<HTMLDivElement>(null);
    const actionRowRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [actionRowHeight, setActionRowHeight] = useState(0);
    /** virtualizer 선언 전에 scrollToIndex를 참조하기 위한 ref (scrollToBottom 등에서 사용) */
    const scrollToIndexRef = useRef<
      (index: number, options?: { align?: "start" | "center" | "end" | "auto" }) => void
    >(() => {});
    const [isClient, setIsClient] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<MyTreeGridRowType>>(
      new Set()
    );
    const [lastSelectedRow, setLastSelectedRow] =
      useState<MyTreeGridRowType | null>(null);
    const [draggedRow, setDraggedRow] = useState<MyTreeGridRowType | null>(
      null
    );
    const [dropTarget, setDropTarget] = useState<MyTreeGridRowType | null>(
      null
    );
    const [dropPosition, setDropPosition] = useState<
      "above" | "below" | "inside" | null
    >(null);
    const [contextMenu, setContextMenu] = useState<{
      visible: boolean;
      x: number;
      y: number;
      header: MyTreeGridHeaderType | null;
      row: MyTreeGridRowType | null;
      selectedRows: MyTreeGridRowType[];
    }>({
      visible: false,
      x: 0,
      y: 0,
      header: null,
      row: null,
      selectedRows: [],
    });
    const [focusedCell, setFocusedCell] = useState<{
      rowKey: string;
      headerKey: string;
    } | null>(null);
    const [editingCell, setEditingCell] = useState<{
      rowKey: string;
      headerKey: string;
    } | null>(null);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [resizeHandleHoveredHeaderKey, setResizeHandleHoveredHeaderKey] =
      useState<string | null>(null);
    const rowClickTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 클라이언트 사이드에서만 실행
    useEffect(() => {
      setIsClient(true);
    }, []);

    const clearRowClickTimer = useCallback(() => {
      if (!rowClickTimerRef.current) return;
      clearTimeout(rowClickTimerRef.current);
      rowClickTimerRef.current = null;
    }, []);

    useEffect(() => {
      return () => {
        clearRowClickTimer();
      };
    }, [clearRowClickTimer]);

    const flatRows = useMemo(
      () => flattenTree(data, false, 0, 1, defaultExpanded),
      [data, defaultExpanded]
    );

    const visibleHeaders = useMemo(
      () => headers.filter((h) => h.visible !== false),
      [headers]
    );

    const moveFocus = useCallback(
      (direction: "up" | "down" | "left" | "right") => {
        if (!focusedCell || visibleHeaders.length === 0 || flatRows.length === 0)
          return;

        const currentRowIndex = flatRows.findIndex(
          (r) => r.rowKey === focusedCell.rowKey
        );
        const currentHeaderIndex = visibleHeaders.findIndex(
          (h) => h.key === focusedCell.headerKey
        );

        if (currentRowIndex === -1 || currentHeaderIndex === -1) return;

        // 마지막 행에서 아래 방향키를 누르면 콜백 호출
        if (direction === "down" && currentRowIndex === flatRows.length - 1) {
          onNavigatePastLastRow?.();
          return;
        }

        let newRowIndex = currentRowIndex;
        let newHeaderIndex = currentHeaderIndex;

        switch (direction) {
          case "up":
            newRowIndex = Math.max(0, currentRowIndex - 1);
            break;
          case "down":
            newRowIndex = Math.min(
              flatRows.length - 1,
              currentRowIndex + 1
            );
            break;
          case "left":
            newHeaderIndex = Math.max(0, currentHeaderIndex - 1);
            break;
          case "right":
            newHeaderIndex = Math.min(
              visibleHeaders.length - 1,
              currentHeaderIndex + 1
            );
            break;
        }

        const newRow = flatRows[newRowIndex];
        const newHeader = visibleHeaders[newHeaderIndex];

        if (newRow && newHeader) {
          setFocusedCell({
            rowKey: newRow.rowKey,
            headerKey: newHeader.key,
          });

          // 위/아래 이동 시 선택된 row를 따라 스크롤 이동
          // sticky header와 sticky actionRow에 가려지지 않도록 직접 스크롤 위치 계산
          if (direction === "up" || direction === "down") {
            const container = containerRef.current;
            if (container) {
              const rowHeight = getRowHeight(size);
              const headerH = headerRef.current?.offsetHeight ?? 0;
              const actionRowH = actionRowRef.current?.offsetHeight ?? 0;
              // row의 scroll container 내 좌표
              const rowTop = headerH + newRowIndex * rowHeight;
              const rowBottom = rowTop + rowHeight;
              // sticky 영역을 제외한 가시 영역
              const visibleTop = container.scrollTop + headerH;
              const visibleBottom = container.scrollTop + container.clientHeight - actionRowH;

              if (rowBottom > visibleBottom) {
                // row 하단이 actionRow에 가려짐 → 아래로 스크롤
                container.scrollTop = rowBottom - container.clientHeight + actionRowH;
              } else if (rowTop < visibleTop) {
                // row 상단이 header에 가려짐 → 위로 스크롤
                container.scrollTop = rowTop - headerH;
              }
            }

            // 선택된 row가 1개 이하이면 선택도 함께 이동
            if (selectedRows.size <= 1) {
              const newSelected = new Set<MyTreeGridRowType>([newRow]);
              setSelectedRows(newSelected);
              setLastSelectedRow(newRow);
              if (onSelectedRowsChange) {
                onSelectedRowsChange(Array.from(newSelected), newRow);
              }
            }
          }
        }
      },
      [focusedCell, flatRows, visibleHeaders, onNavigatePastLastRow, selectedRows, onSelectedRowsChange]
    );

    const handleCellFocus = useCallback(
      (rowKey: string, headerKey: string) => {
        setFocusedCell({ rowKey, headerKey });
      },
      []
    );

    const startEditCell = useCallback((rowKey: string, headerKey: string) => {
      setFocusedCell({ rowKey, headerKey });
      setEditingCell({ rowKey, headerKey });
    }, []);

    const clearEditCell = useCallback(() => {
      setEditingCell(null);
    }, []);

    // 컬럼 리사이즈 (헤더/셀 공통)
    const handleResize = useCallback(
      (columnKey: string, newWidth: number) => {
        const newHeaders = headers.map((h: MyTreeGridHeaderType) =>
          h.key === columnKey
            ? {
              ...h,
              width: (() => {
                const minW = h.minWidth ?? getHeaderDefaultWidth(h?.name);
                const maxW = h.maxWidth;
                let w = Math.max(minW, newWidth);
                if (maxW !== undefined) w = Math.min(maxW, w);
                return w;
              })(),
            }
            : h
        );
        setHeaders(newHeaders);
      },
      [headers, setHeaders]
    );

    const handleResizeMouseDown = useCallback(
      (e: React.MouseEvent, columnKey: string) => {
        e.preventDefault();
        setIsResizing(columnKey);
        const header = headers.find((h: MyTreeGridHeaderType) => h.key === columnKey);
        const startX = e.clientX;
        const startWidth =
          header?.width ??
          getHeaderDefaultWidth(header?.name) ??
          HEADER_MIN_WIDTH;

        const handleMouseMove = (ev: MouseEvent) => {
          handleResize(columnKey, startWidth + (ev.clientX - startX));
        };
        const handleMouseUp = () => {
          setIsResizing(null);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [headers, handleResize]
    );

    // 리사이저 더블클릭 시 컬럼 너비를 콘텐츠에 맞춤(엑셀 스타일)
    const handleAutoFitColumn = useCallback(
      (columnKey: string) => {
        const header = headers.find((h: MyTreeGridHeaderType) => h.key === columnKey);
        if (!header) return;
        const firstVisibleHeaderKey = visibleHeaders[0]?.key;
        const isFirstVisibleColumn = columnKey === firstVisibleHeaderKey;
        const iconContainerWidth =
          ITEM_TYPE_CONTAINER_SIZE_PX[
          size as keyof typeof ITEM_TYPE_CONTAINER_SIZE_PX
          ] ?? 0;
        const extraLeadingWidth = isFirstVisibleColumn
          ? iconContainerWidth
          : 0;
        const contentWidth = getColumnContentWidth(
          columnKey,
          header,
          flatRows,
          size,
          extraLeadingWidth
        );
        handleResize(columnKey, contentWidth);
      },
      [headers, visibleHeaders, flatRows, size, showRowIcon, handleResize]
    );

    // Enter 키로 다음 셀 이동 (my-grid와 동일)
    const moveToNextCell = useCallback(() => {
      if (!focusedCell || visibleHeaders.length === 0 || flatRows.length === 0)
        return;

      const currentHeaderIndex = visibleHeaders.findIndex(
        (h) => h.key === focusedCell.headerKey
      );
      const currentRowIndex = flatRows.findIndex(
        (r) => r.rowKey === focusedCell.rowKey
      );

      if (currentHeaderIndex === -1 || currentRowIndex === -1) return;

      let newHeaderIndex = currentHeaderIndex + 1;
      let newRowIndex = currentRowIndex;

      // 마지막 컬럼이면 다음 행의 첫 번째 컬럼으로 이동
      if (newHeaderIndex >= visibleHeaders.length) {
        newHeaderIndex = 0;
        newRowIndex = currentRowIndex + 1;
      }

      // 마지막 행이면 이동하지 않음
      if (newRowIndex >= flatRows.length) {
        return;
      }

      const newRow = flatRows[newRowIndex];
      const newHeader = visibleHeaders[newHeaderIndex];

      if (newRow && newHeader) {
        setFocusedCell({
          rowKey: newRow.rowKey,
          headerKey: newHeader.key,
        });
      }
    }, [focusedCell, flatRows, visibleHeaders]);

    // sticky header / actionRow 높이를 각각 측정
    // - headerHeight → scrollMargin: virtualizer item 좌표를 container 좌표계로 보정
    // - actionRowHeight → scrollPaddingEnd: 하단 sticky 영역을 가시 영역에서 제외
    useEffect(() => {
      const headerEl = headerRef.current;
      const actionRowEl = actionRowRef.current;
      const update = () => {
        setHeaderHeight(headerEl?.offsetHeight ?? 0);
        setActionRowHeight(actionRowEl?.offsetHeight ?? 0);
      };
      const ro = new ResizeObserver(update);
      if (headerEl) ro.observe(headerEl);
      if (actionRowEl) ro.observe(actionRowEl);
      update();
      return () => ro.disconnect();
    }, [isClient, !!actionRow, !hideHeader]);

    // 가상화 설정
    // scrollMargin: header 높이 — item 좌표(virtualizer div 기준)를 container 좌표계로 보정
    const virtualizer = useVirtualizer({
      count: flatRows.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => getRowHeight(size),
      overscan: 5,
      enabled: isClient,
      scrollMargin: headerHeight,
    });

    // moveFocus 등 선언 순서가 앞선 콜백에서 virtualizer.scrollToIndex를 사용하기 위한 ref
    scrollToIndexRef.current = (index, options) =>
      virtualizer.scrollToIndex(index, options);

    // 외부에서 호출할 수 있는 스크롤 함수들
    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => {
          if (containerRef.current) {
            // DOM 업데이트가 완료된 후 스크롤하도록 setTimeout 사용
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop = 0;
              }
            }, 0);
          }
        },
        scrollToBottom: () => {
          // React 렌더링 완료 후 스크롤하도록 requestAnimationFrame 사용
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop =
                  containerRef.current.scrollHeight;
              }
            });
          });
        },
        scrollToRow: (rowIndex: number) => {
          if (containerRef.current && virtualizer) {
            // DOM 업데이트가 완료된 후 스크롤하도록 setTimeout 사용
            setTimeout(() => {
              if (containerRef.current && virtualizer) {
                const targetIndex = Math.max(0, rowIndex);
                virtualizer.scrollToIndex(targetIndex, { align: "center" });
              }
            }, 0);
          }
        },
        getScrollPosition: () => {
          if (containerRef.current) {
            return {
              scrollTop: containerRef.current.scrollTop,
              scrollHeight: containerRef.current.scrollHeight,
              clientHeight: containerRef.current.clientHeight,
            };
          }
          return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
        },
        clearSelection: () => {
          setSelectedRows(new Set());
          setLastSelectedRow(null);
          setEditingCell(null);
        },
        setSelectedRowKeys: (rowKeys: string[]) => {
          if (!rowKeys.length) {
            setSelectedRows(new Set());
            setLastSelectedRow(null);
            if (onSelectedRowsChange) onSelectedRowsChange([], null);
            return;
          }
          const rows = flatRows.filter((r) => rowKeys.includes(r.rowKey));
          setSelectedRows(new Set(rows));
          setLastSelectedRow(rows[0] ?? null);
          if (onSelectedRowsChange) {
            onSelectedRowsChange(Array.from(rows), rows[0] ?? null);
          }
        },
        startEditCell: (rowKey: string, headerKey: string) => {
          startEditCell(rowKey, headerKey);
        },
        getSelectedRows: () => {
          return Array.from(selectedRows);
        },
        focusLastRow: () => {
          if (flatRows.length === 0 || visibleHeaders.length === 0) return;
          const lastRow = flatRows[flatRows.length - 1];
          const firstHeader = visibleHeaders[0];
          if (!lastRow || !firstHeader) return;
          setFocusedCell({ rowKey: lastRow.rowKey, headerKey: firstHeader.key });
          const newSelected = new Set<MyTreeGridRowType>([lastRow]);
          setSelectedRows(newSelected);
          setLastSelectedRow(lastRow);
          if (onSelectedRowsChange) {
            onSelectedRowsChange(Array.from(newSelected), lastRow);
          }
          // 스크롤을 마지막 행으로 이동 (actionRow에 가려지지 않도록 직접 계산)
          const container = containerRef.current;
          if (container) {
            const rowHeight = getRowHeight(size);
            const headerH = headerRef.current?.offsetHeight ?? 0;
            const actionRowH = actionRowRef.current?.offsetHeight ?? 0;
            const lastRowBottom = headerH + flatRows.length * rowHeight;
            container.scrollTop = lastRowBottom - container.clientHeight + actionRowH;
          }
          // 포커스를 그리드 컨테이너로 이동 (preventScroll로 브라우저 자동 스크롤 방지)
          containerRef.current?.focus({ preventScroll: true });
        },
      }),
      [virtualizer, selectedRows, startEditCell, flatRows, visibleHeaders, onSelectedRowsChange]
    );

    // 방향키 셀 이동: 입력 중에는 caret 경계에서만 좌/우 이동
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const arrowDirectionMap: Record<
          string,
          "up" | "down" | "left" | "right"
        > = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        };

        const arrowDirection = arrowDirectionMap[e.key];
        if (arrowDirection) {
          const target = e.target as EventTarget | null;
          const isEditableTarget = !!(
            target instanceof HTMLElement &&
            ((target instanceof HTMLInputElement && !target.readOnly) ||
              target instanceof HTMLTextAreaElement ||
              target.isContentEditable)
          );

          const shouldMoveCell = (() => {
            // editable 요소가 아니면 일반 방향키로 셀 이동
            if (!isEditableTarget) return true;

            // 상/하는 caret과 무관하게 항상 셀 이동
            if (e.key === "ArrowUp" || e.key === "ArrowDown") return true;

            // 좌/우는 caret이 경계를 벗어날 때만 셀 이동
            if (
              target instanceof HTMLInputElement ||
              target instanceof HTMLTextAreaElement
            ) {
              const selectionStart = target.selectionStart;
              const selectionEnd = target.selectionEnd;
              if (selectionStart === null || selectionEnd === null) return false;

              if (e.key === "ArrowLeft") {
                return selectionStart === 0 && selectionEnd === 0;
              }
              if (e.key === "ArrowRight") {
                const valueLength = target.value.length;
                return (
                  selectionStart === valueLength && selectionEnd === valueLength
                );
              }
            }

            return false;
          })();

          if (shouldMoveCell) {
            e.preventDefault();
            moveFocus(arrowDirection);
            return;
          }
        }

        // Enter 키로 다음 셀 이동 (usage 셀은 아래 행 같은 컬럼으로, 그 외는 오른쪽 셀으로)
        if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
          e.preventDefault();
          const isUsageCell =
            focusedCell &&
            (() => {
              const row = flatRows.find((r) => r.rowKey === focusedCell.rowKey);
              const cell = row?.cells.find(
                (c) => c.headerKey === focusedCell.headerKey
              );
              return cell?.inputType === "usage";
            })();
          if (isUsageCell) {
            moveFocus("down");
          } else {
            moveToNextCell();
          }
          return;
        }

        // F2: 현재 포커스/선택된 셀 편집 시작 (explicit 모드일 때)
        if (e.key === "F2" && textEditTriggerMode === "explicit") {
          e.preventDefault();

          const getEditableTextHeaderKey = (row: MyTreeGridRowType) => {
            const editableHeader = visibleHeaders.find((h) => {
              if (h.readonly) return false;
              const cell = row.cells.find((c) => c.headerKey === h.key);
              return cell?.inputType === "text";
            });
            return editableHeader?.key ?? null;
          };

          if (focusedCell) {
            const focusedRow = flatRows.find((r) => r.rowKey === focusedCell.rowKey);
            if (focusedRow) {
              const focusedHeader = visibleHeaders.find(
                (h) => h.key === focusedCell.headerKey
              );
              const focusedCellData = focusedRow.cells.find(
                (c) => c.headerKey === focusedCell.headerKey
              );
              if (focusedHeader && !focusedHeader.readonly && focusedCellData?.inputType === "text") {
                startEditCell(focusedCell.rowKey, focusedCell.headerKey);
                return;
              }
              const fallbackHeaderKey = getEditableTextHeaderKey(focusedRow);
              if (fallbackHeaderKey) {
                startEditCell(focusedRow.rowKey, fallbackHeaderKey);
                return;
              }
            }
          }

          if (lastSelectedRow) {
            const fallbackHeaderKey = getEditableTextHeaderKey(lastSelectedRow);
            if (fallbackHeaderKey) {
              startEditCell(lastSelectedRow.rowKey, fallbackHeaderKey);
            }
          }
          return;
        }

        // Space: 클릭 시 팝업이 열리는 셀이라면 팝업 트리거 클릭 (키보드만으로 열기)
        // 포커스가 이미 트리거 안에 있으면 해당 컴포넌트가 Space를 처리하므로 여기서는 스킵
        if (e.key === " ") {
          const active = document.activeElement as HTMLElement | null;
          const gridcell =
            active?.getAttribute("role") === "gridcell"
              ? active
              : active?.closest?.("[role=\"gridcell\"]");
          if (gridcell) {
            const trigger = (
              gridcell as HTMLElement
            ).querySelector<HTMLElement>("[data-popup-trigger=\"true\"]");
            const activeIsTrigger =
              trigger &&
              (trigger === active || trigger.contains(active as Node));
            if (trigger && !activeIsTrigger) {
              e.preventDefault();
              trigger.click();
              return;
            }
          }
        }

        // Ctrl+A로 전체 선택 (multiSelect가 true일 때만)
        if (!multiSelect) return;

        // input, textarea, contenteditable 요소에서는 동작하지 않음
        const target = e.target as HTMLElement;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable
        ) {
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "a") {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          // 모든 행 선택
          const allRows = new Set<MyTreeGridRowType>(flatRows);
          setSelectedRows(allRows);
          if (flatRows.length > 0) {
            setLastSelectedRow(flatRows[flatRows.length - 1] as MyTreeGridRowType);
          }
          if (onSelectedRowsChange) {
            onSelectedRowsChange(
              Array.from(allRows),
              flatRows.length > 0 ? (flatRows[flatRows.length - 1] as MyTreeGridRowType) : null
            );
          }
        }
      },
      [
        multiSelect,
        flatRows,
        onSelectedRowsChange,
        moveFocus,
        moveToNextCell,
        textEditTriggerMode,
        visibleHeaders,
        focusedCell,
        lastSelectedRow,
        startEditCell,
      ]
    );

    // 외부 영역 클릭 시 선택 해제
    useEffect(() => {
      if (!isOutSideClickUnSelect) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;

        // 컨텍스트 메뉴 내부 클릭인지 확인
        if (target.closest(".context-menu")) {
          return; // 컨텍스트 메뉴 내부 클릭은 무시
        }

        // actionRow 영역 클릭인지 확인
        if (target.closest('[data-action-row="true"]')) {
          return; // actionRow 영역 클릭은 무시
        }

        if (target.closest('[data-my-select-dropdown="true"]')) {
          return; // MySelect 드롭다운 내부 클릭은 무시
        }

        // 컨테이너 내부 클릭인지 확인
        if (containerRef.current && containerRef.current.contains(target)) {
          // 노드 영역이 아닌 곳을 클릭했는지 확인
          const isNodeClick =
            target.closest('[data-tree-node="true"]') ||
            target.closest(".my-tree-node") ||
            target.closest('[draggable="true"]');

          // 노드가 아닌 곳을 클릭했다면 선택 해제
          if (!isNodeClick) {
            setSelectedRows(new Set());
            setLastSelectedRow(null);
            setEditingCell(null);
            if (onSelectedRowsChange) onSelectedRowsChange([], null);
          }
        } else {
          // 컨테이너 외부 클릭 시 선택 해제
          setSelectedRows(new Set());
          setLastSelectedRow(null);
          setEditingCell(null);
          if (onSelectedRowsChange) onSelectedRowsChange([], null);
        }

        // 컨텍스트 메뉴 외부 클릭 시 닫기
        if (contextMenu.visible) {
          setContextMenu((prev) => ({ ...prev, visible: false }));
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onSelectedRowsChange, contextMenu.visible, isOutSideClickUnSelect]);

    const resetDragDrop = useCallback(() => {
      setDraggedRow(null);
      setDropTarget(null);
      setDropPosition(null);
    }, []);

    // 드래그 시작
    const handleDragStart = useCallback(
      (e: React.DragEvent, row: MyTreeGridRowType) => {
        // 기존 드래그 상태가 있다면 먼저 초기화
        resetDragDrop();
        if (row.type.includes("fixed-")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        } else {
          setDraggedRow(row);
          e.dataTransfer.effectAllowed = "move";
        }
      },
      [resetDragDrop]
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent, row: MyTreeGridRowType) => {
        e.preventDefault();

        if (!draggedRow || draggedRow.rowKey === row.rowKey) return;

        // fixed- 타입에 대한 드롭 제한
        if (row.type.includes("fixed-")) {
          e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
          return;
        }

        setDropTarget(row);

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        if (y < height * 0.25) {
          setDropPosition("above");
          // beforeRow가 fixed-인지 확인
          const { parent } = findParentRow(data, row.rowKey);
          const siblings = parent ? parent.children || [] : data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );
          if (currentIndex > 0) {
            const beforeRow = siblings[currentIndex - 1];
            if (beforeRow && beforeRow.type.includes("fixed-")) {
              e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
              return;
            }
          }
        } else if (y > height * 0.75) {
          setDropPosition("below");
          // afterRow가 fixed-인지 확인
          const { parent } = findParentRow(data, row.rowKey);
          const siblings = parent ? parent.children || [] : data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );
          if (currentIndex < siblings.length - 1) {
            const afterRow = siblings[currentIndex + 1];
            if (afterRow && afterRow.type.includes("fixed-")) {
              e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
              return;
            }
          }
        } else {
          // folder 타입이 package 타입의 자식으로 들어갈 수 없도록 제한
          if (draggedRow.type === "item") {
            e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
            return;
          }
          if (draggedRow.type === "folder" && row.type === "package") {
            e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
            return;
          }
          // package 타입이 package 타입의 자식으로 들어갈 수 없도록 제한
          if (draggedRow.type === "package" && row.type === "package") {
            if (disablePackageChildrenDrop) {
              e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
              return;
            }
            // 부모의 타입을 확인
            const { parent } = findParentRow(data, row.rowKey);
            if (parent && parent.type === "package") {
              e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
              return;
            }
          }
          setDropPosition("inside");
        }

        // 최상위 레벨에서 folder, fixed-folder가 아닌 타입이 최상단으로 올 수 없도록 제한
        const { parent } = findParentRow(data, row.rowKey);
        const isTopLevel = parent === null;

        if (
          isTopLevel &&
          (dropPosition === "above" || dropPosition === "below")
        ) {
          const siblings = data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );

          if (currentIndex !== -1) {
            // 위쪽에 드롭할 때
            if (dropPosition === "above") {
              // 최상단으로 드롭하려는 경우 (currentIndex === 0)
              if (currentIndex === 0) {
                // package 타입의 경우 afterRow가 folder인지 확인
                if (draggedRow.type === "package") {
                  // afterRow가 folder인 경우에만 제한
                  if (currentIndex < siblings.length - 1) {
                    const afterRow = siblings[currentIndex + 1];
                    if (afterRow && afterRow.type === "folder") {
                      e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
                      return;
                    }
                  }
                } else {
                  // folder, fixed-folder, item이 아닌 타입은 최상단으로 올 수 없음
                  if (
                    draggedRow.type !== "folder" &&
                    draggedRow.type !== "fixed-folder" &&
                    draggedRow.type !== "item"
                  ) {
                    e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
                    return;
                  }
                }
              }
            }
            // 아래쪽에 드롭할 때
            else if (dropPosition === "below") {
              // 최상단으로 드롭하려는 경우 (currentIndex === 0)
              if (currentIndex === 0) {
                // package 타입의 경우 afterRow가 folder인지 확인
                if (draggedRow.type === "package") {
                  // afterRow가 folder인 경우에만 제한
                  if (currentIndex < siblings.length - 1) {
                    const afterRow = siblings[currentIndex + 1];
                    if (afterRow && afterRow.type === "folder") {
                      e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
                      return;
                    }
                  }
                } else {
                  // folder, fixed-folder, item이 아닌 타입은 최상단으로 올 수 없음
                  if (
                    draggedRow.type !== "folder" &&
                    draggedRow.type !== "fixed-folder" &&
                    draggedRow.type !== "item"
                  ) {
                    e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
                    return;
                  }
                }
              }
            }
          }
        }

        // 허용된 드래그인 경우에만 move 커서 표시
        e.dataTransfer.dropEffect = "move";

        // isTypeOrder가 true일 때 타입별 순서 제한
        if (
          isTypeOrder &&
          (dropPosition === "above" || dropPosition === "below")
        ) {
          const siblings = parent ? parent.children || [] : data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );

          if (currentIndex !== -1) {
            // 위쪽에 드롭할 때
            if (dropPosition === "above") {
              // 위쪽 형제가 있고, 드래그된 row와 타입이 다르면 제한
              if (currentIndex > 0) {
                const prevSibling = siblings[currentIndex - 1];
                if (prevSibling && prevSibling.type !== draggedRow.type) {
                  e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
                  return; // 드롭 불가
                }
              }
            }
            // 아래쪽에 드롭할 때
            else if (dropPosition === "below") {
              // 아래쪽 형제가 있고, 드래그된 row와 타입이 다르면 제한
              if (currentIndex < siblings.length - 1) {
                const nextSibling = siblings[currentIndex + 1];
                if (nextSibling && nextSibling.type !== draggedRow.type) {
                  e.dataTransfer.dropEffect = "none"; // 금지 커서 표시
                  return; // 드롭 불가
                }
              }
            }
          }
        }
      },
      [draggedRow, isTypeOrder, data, findParentRow]
    );

    const handleDrop = useCallback(
      (e: React.DragEvent, row: MyTreeGridRowType) => {
        e.preventDefault();
        if (!draggedRow || !dropPosition) {
          resetDragDrop();
          return;
        }

        // fixed- 타입에 대한 드롭 제한
        if (row.type.includes("fixed-")) {
          resetDragDrop();
          return;
        }

        // beforeRow, afterRow가 fixed-인지 확인
        const { parent: parentRow } = findParentRow(data, row.rowKey);
        const siblings = parentRow ? parentRow.children || [] : data;
        const currentIndex = siblings.findIndex((n) => n.rowKey === row.rowKey);

        if (dropPosition === "above" && currentIndex > 0) {
          const beforeRow = siblings[currentIndex - 1];
          if (beforeRow && beforeRow.type.includes("fixed-")) {
            resetDragDrop();
            return;
          }
        } else if (
          dropPosition === "below" &&
          currentIndex < siblings.length - 1
        ) {
          const afterRow = siblings[currentIndex + 1];
          if (afterRow && afterRow.type.includes("fixed-")) {
            resetDragDrop();
            return;
          }
        }

        // folder 타입이 package 타입의 자식으로 들어갈 수 없도록 제한
        if (
          draggedRow.type === "folder" &&
          row.type === "package" &&
          dropPosition === "inside"
        ) {
          resetDragDrop();
          return;
        }

        // package 타입이 package 타입의 자식으로 들어갈 수 없도록 제한
        if (
          draggedRow.type === "package" &&
          row.type === "package" &&
          dropPosition === "inside"
        ) {
          if (disablePackageChildrenDrop) {
            resetDragDrop();
            return;
          }
          // 부모의 타입을 확인
          const { parent: parentForPackage } = findParentRow(data, row.rowKey);
          if (parentForPackage && parentForPackage.type === "package") {
            resetDragDrop();
            return;
          }
        }

        // 최상위 레벨에서 folder, fixed-folder가 아닌 타입이 최상단으로 올 수 없도록 제한
        const { parent } = findParentRow(data, row.rowKey);
        const isTopLevel = parent === null;

        if (
          isTopLevel &&
          (dropPosition === "above" || dropPosition === "below")
        ) {
          const siblings = data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );

          if (currentIndex !== -1) {
            // 위쪽에 드롭할 때
            if (dropPosition === "above") {
              // 최상단으로 드롭하려는 경우 (currentIndex === 0)
              if (currentIndex === 0) {
                // package 타입의 경우 afterRow가 folder인지 확인
                if (draggedRow.type === "package") {
                  // afterRow가 folder인 경우에만 제한
                  if (currentIndex < siblings.length - 1) {
                    const afterRow = siblings[currentIndex + 1];
                    if (afterRow && afterRow.type === "folder") {
                      resetDragDrop();
                      return;
                    }
                  }
                } else {
                  // folder, fixed-folder, item이 아닌 타입은 최상단으로 올 수 없음
                  if (
                    draggedRow.type !== "folder" &&
                    draggedRow.type !== "fixed-folder" &&
                    draggedRow.type !== "item"
                  ) {
                    resetDragDrop();
                    return;
                  }
                }
              }
            }
            // 아래쪽에 드롭할 때
            else if (dropPosition === "below") {
              // 최상단으로 드롭하려는 경우 (currentIndex === 0)
              if (currentIndex === 0) {
                // package 타입의 경우 afterRow가 folder인지 확인
                if (draggedRow.type === "package") {
                  // afterRow가 folder인 경우에만 제한
                  if (currentIndex < siblings.length - 1) {
                    const afterRow = siblings[currentIndex + 1];
                    if (afterRow && afterRow.type === "folder") {
                      resetDragDrop();
                      return;
                    }
                  }
                } else {
                  // folder, fixed-folder, item이 아닌 타입은 최상단으로 올 수 없음
                  if (
                    draggedRow.type !== "folder" &&
                    draggedRow.type !== "fixed-folder" &&
                    draggedRow.type !== "item"
                  ) {
                    resetDragDrop();
                    return;
                  }
                }
              }
            }
          }
        }

        // isTypeOrder가 true일 때 타입별 순서 제한
        if (
          isTypeOrder &&
          (dropPosition === "above" || dropPosition === "below")
        ) {
          const siblings = parent ? parent.children || [] : data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );

          if (currentIndex !== -1) {
            // 위쪽에 드롭할 때
            if (dropPosition === "above") {
              // 위쪽 형제가 있고, 드래그된 row와 타입이 다르면 제한
              if (currentIndex > 0) {
                const prevSibling = siblings[currentIndex - 1];
                if (prevSibling && prevSibling.type !== draggedRow.type) {
                  resetDragDrop();
                  return; // 드롭 불가
                }
              }
            }
            // 아래쪽에 드롭할 때
            else if (dropPosition === "below") {
              // 아래쪽 형제가 있고, 드래그된 row와 타입이 다르면 제한
              if (currentIndex < siblings.length - 1) {
                const nextSibling = siblings[currentIndex + 1];
                if (nextSibling && nextSibling.type !== draggedRow.type) {
                  resetDragDrop();
                  return; // 드롭 불가
                }
              }
            }
          }
        }

        let newParent: MyTreeGridRowType | null = null;
        let newIndex = 0;

        if (dropPosition === "inside") {
          newParent = row;
          newIndex = (row.children || []).length;
        } else {
          const { parent: parentForNewParent } = findParentRow(
            data,
            row.rowKey
          );
          newParent = parentForNewParent;
          const siblings = parentForNewParent
            ? parentForNewParent.children || []
            : data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );
          newIndex = dropPosition === "above" ? currentIndex : currentIndex + 1;
        }

        // beforeRow와 afterRow 계산
        let beforeRow: MyTreeGridRowType | null = null;
        let afterRow: MyTreeGridRowType | null = null;

        if (dropPosition === "inside") {
          const children = row.children || [];
          const sameTypeChildren = children.filter(
            (child) => child.type === draggedRow.type
          );
          beforeRow =
            sameTypeChildren.length > 0
              ? sameTypeChildren[sameTypeChildren.length - 1] || null
              : null;
          afterRow = null;
        } else {
          const { parent: parentForSiblings } = findParentRow(data, row.rowKey);
          const siblings = parentForSiblings
            ? parentForSiblings.children || []
            : data;
          const currentIndex = siblings.findIndex(
            (n) => n.rowKey === row.rowKey
          );

          if (dropPosition === "above") {
            // above인 경우: beforeRow는 현재 row의 이전 형제, afterRow는 현재 row
            beforeRow =
              currentIndex > 0 ? siblings[currentIndex - 1] || null : null;
            afterRow = row;
          } else if (dropPosition === "below") {
            // below인 경우: beforeRow는 현재 row, afterRow는 현재 row의 다음 형제
            beforeRow = row;
            afterRow =
              currentIndex < siblings.length - 1
                ? siblings[currentIndex + 1] || null
                : null;
          }
        }

        const dragInfo: MyTreeGridDragDropInfo = {
          draggedRow,
          beforeRow,
          afterRow,
          dropPosition,
          newParent,
          newIndex,
        };
        const updatedData = moveNode(data, dragInfo, autoExpandOnDrop);
        if (onMoveNode) {
          onMoveNode(updatedData, dragInfo);
        }
        onDataChange(updatedData);

        resetDragDrop();
      },
      [
        draggedRow,
        dropPosition,
        data,
        moveNode,
        onDataChange,
        findParentRow,
        onMoveNode,
        autoExpandOnDrop,
        resetDragDrop,
        isTypeOrder,
        disablePackageChildrenDrop,
      ]
    );

    const handleDragEnd = useCallback(
      (_e: React.DragEvent, _row: MyTreeGridRowType) => {
        // 드래그가 끝날 때 항상 상태 초기화
        resetDragDrop();
      },
      [resetDragDrop]
    );

    // 노드 확장/축소 전용 핸들러
    const handleToggleExpansion = useCallback(
      (row: MyTreeGridRowType) => {
        const updateNodeExpansion = (
          rows: MyTreeGridRowType[]
        ): MyTreeGridRowType[] => {
          return rows.map((n) => {
            if (n.rowKey === row.rowKey) {
              // isExpanded가 undefined인 경우 defaultExpanded 값을 기준으로 토글
              return { ...n, isExpanded: !(n.isExpanded ?? defaultExpanded) };
            }
            if (n.children) {
              return {
                ...n,
                children: updateNodeExpansion(n.children),
              };
            }
            return n;
          });
        };

        const updatedData = updateNodeExpansion(data);
        onDataChange(updatedData);
      },
      [data, onDataChange, defaultExpanded]
    );

    const applyRowSingleClickSelection = useCallback(
      (
        row: MyTreeGridRowType,
        clickMeta?: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }
      ) => {
        const newSelectedRows = new Set(selectedRows);
        const isCtrlOrMeta = !!clickMeta && (clickMeta.ctrlKey || clickMeta.metaKey);
        const isShift = !!clickMeta && clickMeta.shiftKey;

        if (multiSelect && isCtrlOrMeta) {
          // Ctrl/Cmd + 클릭: 개별 선택/해제
          const existingRow = Array.from(newSelectedRows).find(
            (n) => n.rowKey === row.rowKey
          );
          if (existingRow) {
            newSelectedRows.delete(existingRow);
          } else {
            newSelectedRows.add(row);
          }
          setLastSelectedRow(row);
        } else if (multiSelect && isShift && lastSelectedRow !== null) {
          // Shift + 클릭: 범위 선택 (기존 선택 모두 지우고 새로운 범위만 선택)
          newSelectedRows.clear();

          const selectedNodeIndex = flatRows.findIndex(
            (n) => n.rowKey === row.rowKey
          );
          const lastSelectedNodeIndex = flatRows.findIndex(
            (n) => n.rowKey === lastSelectedRow.rowKey
          );
          const start = Math.min(lastSelectedNodeIndex, selectedNodeIndex);
          const end = Math.max(lastSelectedNodeIndex, selectedNodeIndex);

          for (let i = start; i <= end; i++) {
            newSelectedRows.add(flatRows[i] as MyTreeGridRowType);
          }
        } else {
          // 일반 클릭: 단일 선택 (재클릭 시에도 선택 유지)
          newSelectedRows.clear();
          newSelectedRows.add(row);
          setLastSelectedRow(row);
        }

        setSelectedRows(newSelectedRows);
        setEditingCell(null);
        if (onSelectedRowsChange) {
          onSelectedRowsChange(Array.from(newSelectedRows), row);
        }
        resetDragDrop();
        onRowClick?.(row);
      },
      [
        selectedRows,
        multiSelect,
        lastSelectedRow,
        flatRows,
        onSelectedRowsChange,
        resetDragDrop,
        onRowClick,
      ]
    );

    // 노드 클릭 핸들러 (single click 전용)
    const handleRowClick = useCallback(
      (row: MyTreeGridRowType, event?: React.MouseEvent) => {
        const clickMeta = event
          ? {
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
          }
          : undefined;

        clearRowClickTimer();
        rowClickTimerRef.current = setTimeout(() => {
          applyRowSingleClickSelection(row, clickMeta);
          rowClickTimerRef.current = null;
        }, 220);
      },
      [applyRowSingleClickSelection, clearRowClickTimer]
    );

    const handleRowDoubleClick = useCallback(
      (row: MyTreeGridRowType, event?: React.MouseEvent) => {
        clearRowClickTimer();
        const isOnlySelectedRow =
          selectedRows.size === 1 &&
          Array.from(selectedRows).some((n) => n.rowKey === row.rowKey);

        if (!isOnlySelectedRow) {
          const newSelectedRows = new Set<MyTreeGridRowType>([row]);
          setSelectedRows(newSelectedRows);
          setLastSelectedRow(row);
          setEditingCell(null);
          onSelectedRowsChange?.(Array.from(newSelectedRows), row);
        }
        resetDragDrop();
        if (onRowDoubleClick) {
          onRowDoubleClick(row, event);
        }
      },
      [
        clearRowClickTimer,
        selectedRows,
        onSelectedRowsChange,
        resetDragDrop,
        onRowDoubleClick,
      ]
    );

    const handleContextMenu = useCallback(
      (
        e: React.MouseEvent,
        header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.size <= 1) {
          newSelectedRows.clear();
          newSelectedRows.add(row);
        } else {
          newSelectedRows.delete(row);
          newSelectedRows.add(row);
        }

        setSelectedRows(newSelectedRows);
        if (onSelectedRowsChange) {
          onSelectedRowsChange(Array.from(newSelectedRows), row);
        }

        resetDragDrop();
        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          header,
          row,
          selectedRows: Array.from(newSelectedRows),
        });
      },
      [onSelectedRowsChange, selectedRows, resetDragDrop, setContextMenu]
    );

    const closeContextMenu = useCallback(() => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }, []);

    // 가상화된 행 렌더링 함수
    const VirtualizedRow = useCallback(
      (virtualRow: any) => {
        const { index, start, size: virtualSize } = virtualRow;
        if (!isClient) return null;

        const row = flatRows[index];
        if (!row) return null;

        const isDropTarget = dropTarget?.rowKey === row.rowKey;

        return (
          <div
            key={row.rowKey}
            style={{
              position: "absolute",
              top: 1,
              left: 0,
              width: "100%",
              height: `${virtualSize}px`,
              transform: `translateY(${start - virtualizer.options.scrollMargin}px)`,
            }}
            tabIndex={0}
          >
            <MyTreeGridRow
              headers={headers}
              data={data}
              row={row}
              onClickAction={handleRowClick}
              onDoubleClickAction={handleRowDoubleClick}
              onDragStartAction={handleDragStart}
              onDragOverAction={handleDragOver}
              onDropAction={handleDrop}
              onDragEndAction={handleDragEnd}
              onContextMenuAction={handleContextMenu}
              showContextMenu={showContextMenu}
              hideBorder={hideBorder}
              allowDragDrop={allowDragDrop}
              draggedRow={draggedRow}
              dropTarget={dropTarget}
              dropPosition={isDropTarget ? dropPosition : null}
              selectedRows={selectedRows}
              onDataChangeItem={onDataChangeItem}
              isTypeOrder={isTypeOrder}
              onToggleExpansion={handleToggleExpansion}
              searchKeyword={searchKeyword}
              size={size}
              focusedCell={focusedCell}
              onCellFocus={handleCellFocus}
              editingCell={editingCell}
              textEditTriggerMode={textEditTriggerMode}
              onEditEnd={clearEditCell}
              showRowIcon={showRowIcon}
              isResizing={isResizing}
              onResizeMouseDown={handleResizeMouseDown}
              onAutoFitColumn={handleAutoFitColumn}
              resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
              onResizeHandleHover={setResizeHandleHoveredHeaderKey}
            />
          </div>
        );
      },
      [
        isClient,
        flatRows,
        headers,
        handleRowClick,
        handleRowDoubleClick,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleContextMenu,
        showContextMenu,
        hideBorder,
        allowDragDrop,
        draggedRow,
        dropTarget,
        dropPosition,
        selectedRows,
        onDataChangeItem,
        isTypeOrder,
        handleToggleExpansion,
        data,
        searchKeyword,
        size,
        focusedCell,
        handleCellFocus,
        editingCell,
        textEditTriggerMode,
        clearEditCell,
        showRowIcon,
        isResizing,
        handleResizeMouseDown,
        handleAutoFitColumn,
        resizeHandleHoveredHeaderKey,
        setResizeHandleHoveredHeaderKey,
      ]
    );

    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!onLoadMore) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        // 스크롤이 하단에 가까워지면 더 많은 데이터 로드
        if (scrollHeight - scrollTop <= clientHeight + 100) {
          if (onLoadMore && hasMore && !isLoading) {
            onLoadMore();
          }
        }
      },
      [onLoadMore, hasMore, isLoading]
    );

    // grid 내부 빈 공간 드롭 핸들러
    const handleGridDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();

        // node 영역에서 발생한 drop 이벤트인지 확인
        const target = e.target as Element;
        const isNodeDrop =
          target.closest('[data-tree-node="true"]') ||
          target.closest(".my-tree-node") ||
          target.closest('[draggable="true"]');

        // node 영역에서 발생한 drop이면 무시 (node의 handleDrop이 처리)
        if (isNodeDrop) {
          return;
        }

        if (!draggedRow) {
          resetDragDrop();
          return;
        }

        // 최상위 레벨에서 folder, fixed-folder, item이 아닌 타입은 최상위로 올 수 없도록 제한
        if (
          draggedRow.type !== "folder" &&
          draggedRow.type !== "fixed-folder" &&
          draggedRow.type !== "item"
        ) {
          resetDragDrop();
          return;
        }

        // 최상위 레벨로 이동
        const sameTypeRows = data.filter((row) => row.type === draggedRow.type);
        const dragInfo: MyTreeGridDragDropInfo = {
          draggedRow,
          beforeRow:
            sameTypeRows.length > 0
              ? sameTypeRows[sameTypeRows.length - 1] || null
              : null, // 동일한 타입의 마지막 행이 beforeRow
          afterRow: null, // 최상위 레벨의 마지막이므로 afterRow는 null
          dropPosition: "inside",
          newParent: null,
          newIndex: data.length, // 최상위 레벨의 마지막에 추가
        };

        const updatedData = moveNode(data, dragInfo, autoExpandOnDrop);
        if (onMoveNode) {
          onMoveNode(updatedData, dragInfo);
        }
        onDataChange(updatedData);

        resetDragDrop();
      },
      [
        draggedRow,
        data,
        moveNode,
        onDataChange,
        onMoveNode,
        autoExpandOnDrop,
        resetDragDrop,
      ]
    );

    const handleGridDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();

        // node 영역에서 발생한 dragover 이벤트인지 확인
        const target = e.target as Element;
        const isNodeDragOver =
          target.closest('[data-tree-node="true"]') ||
          target.closest(".my-tree-node") ||
          target.closest('[draggable="true"]');

        // node 영역에서 발생한 dragover면 무시 (node의 handleDragOver가 처리)
        if (isNodeDragOver) {
          return;
        }

        // 최상위 레벨에서 folder, fixed-folder, item이 아닌 타입은 최상위로 올 수 없도록 제한
        if (
          draggedRow &&
          draggedRow.type !== "folder" &&
          draggedRow.type !== "fixed-folder" &&
          draggedRow.type !== "item"
        ) {
          e.dataTransfer.dropEffect = "none";
          return;
        }

        e.dataTransfer.dropEffect = "move";
      },
      [draggedRow]
    );

    // 서버 사이드 렌더링 중에는 기본 UI만 표시
    if (!isClient) {
      return (
        <div className="flex flex-col w-full h-full rounded-sm">
          {!hideHeader && (
            <MyTreeGridHeader headers={headers} hideBorder={hideBorder} />
          )}
          <MsgContainer>
            <MyLoadingSpinner size="fixed" />
          </MsgContainer>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex flex-col w-full h-full rounded-sm my-scroll my-grid-virtualized bg-[var(--grid-bg)] outline-none"
        onScroll={handleScroll}
        onDragOver={handleGridDragOver}
        onDrop={handleGridDrop}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {!hideHeader && (
          <div ref={headerRef} className="sticky top-0 z-10">
            <MyTreeGridHeader
              headers={headers}
              onHeadersChange={setHeaders}
              settingButtonOptions={settingButtonOptions}
              hideBorder={hideBorder}
              isResizing={isResizing}
              onResizeMouseDown={handleResizeMouseDown}
              onAutoFitColumn={handleAutoFitColumn}
              resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
              onResizeHandleHover={setResizeHandleHoveredHeaderKey}
            />
          </div>
        )}

        {isLoading && (
          <MsgContainer>
            <MyLoadingSpinner size="fixed" />
          </MsgContainer>
        )}

        {!isLoading && (
          <>
            {/* 가상화된 트리 아이템들과 actionRow를 항상 같은 구조로 렌더링 */}
            <div
              className={data.length > 0 ? "flex-1 relative" : "relative"}
              onClick={(e) => {
                if (!onEmptyAreaClick) return;
                const target = e.target as Element;
                const isNodeClick =
                  target.closest('[data-tree-node="true"]') ||
                  target.closest(".my-tree-node") ||
                  target.closest('[draggable="true"]');
                const isActionRowClick = target.closest('[data-action-row="true"]');
                if (!isNodeClick && !isActionRowClick) {
                  onEmptyAreaClick();
                }
              }}
            >
              {data.length > 0 && (
                <div
                  style={{
                    height: `${isClient ? virtualizer.getTotalSize() + 1 : data.length * getRowHeight(size) + 1}px`,
                    width: "100%",
                    position: "relative",
                    minWidth: "max-content",
                  }}
                >
                  {isClient &&
                    virtualizer.getVirtualItems().map(VirtualizedRow)}
                </div>
              )}

              {/* actionRow - 항상 같은 부모 요소 안에 렌더링하여 unmount 방지 */}
              {actionRow && (
                <div
                  ref={actionRowRef}
                  className="w-full bg-[var(--grid-bg)]"
                  data-action-row="true"
                  style={
                    data.length > 0
                      ? {
                        position: "sticky",
                        bottom: 0,
                        zIndex: 10,
                      }
                      : undefined
                  }
                >
                  {actionRow}
                </div>
              )}
            </div>

            {showContextMenu && (
              <MyTreeGridContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                header={contextMenu.header}
                row={contextMenu.row}
                selectedRows={contextMenu.selectedRows}
                actions={contextMenuActions}
                onCloseAction={closeContextMenu}
              />
            )}
          </>
        )}
      </div>
    );
  }
);

MyTreeGrid.displayName = "MyTreeGrid";

export default MyTreeGrid;
