import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createPortal } from "react-dom";
import MyGridRow from "./my-grid-row";
import MyGridHeader from "./my-grid-header";
import type {
  MyGridHeaderType,
  MyGridRowType,
  FocusedCellType,
} from "./my-grid-type";
import "@/components/yjg/common/style/my-style.css";
import { MyLoadingSpinner } from "../my-loading-spinner";
import MyGridRowSkeleton from "./my-gird-row-skeleton";
import { useToastHelpers } from "@/components/ui/toast";
import { MsgContainer, LoadingMore } from "./my-grid-etc";
import {
  HEADER_MIN_WIDTH,
  computeFittingRenderHeaders,
  getRowHeight,
  getHeaderDefaultWidth,
  getColumnContentWidth,
} from "./my-grid-util";

// MyGrid의 ref 타입 정의
export interface MyGridRef {
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToRow: (rowIndex: number) => void;
  getScrollPosition: () => {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  };
  clearSelection: () => void;
}

type ContextMenuState = {
  x: number;
  y: number;
  visible: boolean;
  row: MyGridRowType | null;
};

export type { ContextMenuState };

/** 컨텍스트 메뉴가 뷰포트 밖으로 나가지 않도록 위치를 보정. 메뉴 DOM을 측정한 뒤 setContextMenu로 x,y를 클램프한다 */
function ContextMenuViewportClamp({
  contextMenu,
  setContextMenu,
  menuContent,
  zIndex = 9999,
}: {
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  menuContent: React.ReactNode;
  zIndex?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contextMenu.visible) return;
    const wrapper = wrapperRef.current;
    const menuEl = (wrapper?.firstElementChild?.firstElementChild ?? wrapper?.firstElementChild) as HTMLElement | null;
    if (!menuEl) return;

    const rect = menuEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 8;
    const clampedX = Math.max(
      padding,
      Math.min(contextMenu.x, vw - rect.width - padding)
    );
    const clampedY = Math.max(
      padding,
      Math.min(contextMenu.y, vh - rect.height - padding)
    );

    if (clampedX !== contextMenu.x || clampedY !== contextMenu.y) {
      setContextMenu((prev) => ({ ...prev, x: clampedX, y: clampedY }));
    }
  }, [contextMenu.visible, contextMenu.x, contextMenu.y, setContextMenu]);

  if (!contextMenu.visible) return null;

  return (
    <div
      ref={wrapperRef}
      style={{ position: "fixed", left: 0, top: 0, zIndex, pointerEvents: "none" }}
    >
      <div className="context-menu" style={{ pointerEvents: "auto" }}>
        {menuContent}
      </div>
    </div>
  );
}

interface MyGridProps {
  headers: MyGridHeaderType[];
  data: MyGridRowType[];
  totalCount?: number;
  isLoading?: boolean;
  loadingMsg?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isError?: boolean;
  errorMsg?: string;
  multiSelect?: boolean;
  portalTarget?: HTMLElement | null; // 새로 추가
  initialSelectedRows?: MyGridRowType[]; // 초기 선택된 rows
  isRowSelectByCheckbox?: boolean;
  enableCellNavigation?: boolean; // 셀 네비게이션 활성화
  enterSkipHeaderKeys?: string[]; // Enter 이동 시 건너뛸 컬럼 키
  testId?: string; // E2E 테스트용 data-testid
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  /**
   * 기능설명
   * 화면(부모 컨테이너) 폭이 기본 컬럼 합보다 클 때, 기본 폭 비율대로 컬럼을 확장하여 채운다.
   * 부모 컨테이너 폭이 더 작을 때는 기본 폭을 유지하고 가로 스크롤이 발생한다.
   * Settings에 저장된 width가 있는 경우는 fittingScreen
   * maxWidth를 지정하면 각 header의 width 비율대로 계산한 resizingWidth > maxWidth 일 때 maxWidth로 고정된다.
   * 
   * 사용방법 
   * - MyGrid를 사용하는 컴포넌트 내부에 하기와 같이 선언한다.
   *  const { headers, setHeadersAction, fittingScreen } = useMyGridHeaders({
        lsKey: 사용하는 키 (ex: "registration.list-view.headers"),
        defaultHeaders: 기본 헤더 설정 (ex:MyGridHeaderType[] key, name, width 등),
        fittingScreen: true,
   *   });
   * <MyGrid
          headers={headers}
          onHeadersChange={setHeadersAction}
          fittingScreen={fittingScreen}
          //이하 기존 사용방식
   *  />
   */
  fittingScreen?: boolean;
  searchKeyword?: string;
  actionRowTop?: React.ReactNode;
  actionRowBottom?: React.ReactNode;
  onLoadRange?: (startIndex: number, endIndex: number) => void;
  onLoadMore?: () => void;
  onSort?: (columnKey: string, direction: "asc" | "desc" | null) => void;
  onHeadersChange?: (newHeaders: MyGridHeaderType[]) => void;
  onRowClick?: (row: MyGridRowType, event: React.MouseEvent) => void;
  onRowDoubleClick?: (
    headerKey: string,
    row: MyGridRowType,
    event: React.MouseEvent
  ) => void;
  onSelectedRowsChange?: (
    selectedRows: MyGridRowType[],
    isClickOutside?: boolean
  ) => void;
  onDataChange?: (
    rowKey: string | number,
    columnKey: string,
    value: string | number | boolean,
    orgData?: any
  ) => void;
  onContextMenu?: (
    contextMenu: ContextMenuState,
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>,
    selectedRows: Set<MyGridRowType>,
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<MyGridRowType>>>,
    setLastSelectedRow: React.Dispatch<
      React.SetStateAction<MyGridRowType | null>
    >
  ) => React.ReactNode;
}

const MyGrid = forwardRef<MyGridRef, MyGridProps>(
  (
    {
      headers,
      data,
      totalCount,
      isLoading,
      loadingMsg,
      hasMore,
      isLoadingMore,
      isError,
      errorMsg,
      multiSelect = true,
      portalTarget,
      initialSelectedRows,
      isRowSelectByCheckbox = false,
      enableCellNavigation = false,
      enterSkipHeaderKeys = [],
      testId,
      size = "default",
      fittingScreen = false,
      searchKeyword,
      actionRowTop,
      actionRowBottom,
      onLoadRange,
      onLoadMore,
      onSort,
      onHeadersChange,
      onRowClick,
      onRowDoubleClick,
      onSelectedRowsChange,
      onDataChange,
      onContextMenu,
    },
    ref
  ) => {
    const { error } = useToastHelpers();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [checkboxColWidth, setCheckboxColWidth] = useState(0);
    const [fittingLocked, setFittingLocked] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<MyGridRowType>>(
      initialSelectedRows ? new Set(initialSelectedRows) : new Set()
    );
    const [lastSelectedRow, setLastSelectedRow] =
      useState<MyGridRowType | null>(
        initialSelectedRows &&
          initialSelectedRows.length > 0 &&
          initialSelectedRows[0]
          ? initialSelectedRows[0]
          : null
      );

    // initialSelectedRows 변경 시 내부 선택 상태 동기화
    useEffect(() => {
      if (initialSelectedRows) {
        setSelectedRows(new Set(initialSelectedRows));
        setLastSelectedRow(initialSelectedRows[0] ?? null);
      }
    }, [initialSelectedRows]);

    // 컨텍스트 메뉴 상태
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
      x: 0,
      y: 0,
      visible: false,
      row: null,
    });

    // 포커스된 셀 상태
    const [focusedCell, setFocusedCell] = useState<FocusedCellType>(null);

    // 컬럼 리사이즈 (헤더/셀 공통, hover 시 같은 컬럼 세로선 표시)
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [resizeHandleHoveredHeaderKey, setResizeHandleHoveredHeaderKey] =
      useState<string | null>(null);

    // 스크롤 디바운싱을 위한 ref
    const scrollTimeoutRef = useRef<number | null>(null);
    const lastLoadRangeRef = useRef<{ start: number; end: number } | null>(
      null
    );

    // 클라이언트 사이드에서만 실행
    useEffect(() => {
      setIsClient(true);
    }, []);

    // 컨테이너(부모) 폭 측정 (ResizeObserver)
    // - fittingScreen은 "부모 컴포넌트 폭"에 맞춰야 하는데, min-w-fit 같은 래퍼는 컨텐츠 폭을 따라가며
    //   우리가 컬럼을 늘릴수록 래퍼 폭도 같이 늘어나 "계속 커지는" 피드백 루프가 생길 수 있다.
    // - 따라서 조상 중 "폭 제약을 거는" 엘리먼트를 우선적으로 선택해서 측정한다.
    useEffect(() => {
      if (!isClient) return;
      const el = containerRef.current;
      if (!el) return;

      const getWidthTarget = (start: HTMLElement) => {
        let cur: HTMLElement | null = start;
        let depth = 0;
        while (cur && depth < 12) {
          const style = window.getComputedStyle(cur);
          const overflowX = style.overflowX;
          const minWidth = style.minWidth;

          // 폭 제약이 있는 컨테이너로 판단되는 조건들
          // - min-width: 0 (flex item에서 컨텐츠에 의해 늘어나지 않도록 하는 대표 패턴)
          // - overflow-x가 visible이 아님 (스크롤/클립으로 제약)
          //
          // NOTE: getComputedStyle(width)는 대부분 px로 반환되어(auto여도) 항상 참이 될 수 있으므로
          //       여기서는 폭 제약 판단에 사용하지 않는다. (그리드 자신을 타겟으로 잡아 축소 감지가 안 되는 문제 방지)
          if (
            minWidth === "0px" ||
            (overflowX && overflowX !== "visible")
          ) {
            return cur;
          }

          if (cur === document.body) break;
          cur = cur.parentElement;
          depth += 1;
        }
        return start.parentElement ?? start;
      };

      const target = getWidthTarget(el);
      const update = () => {
        const nextWidth = target.clientWidth || 0;
        setContainerWidth(nextWidth);
      };

      update();

      const ro = new ResizeObserver(() => update());
      ro.observe(target);

      return () => {
        ro.disconnect();
      };
    }, [isClient]);

    // 체크박스 컬럼 폭 측정 (옵션+체크박스 모드일 때만)
    useEffect(() => {
      if (!isClient) return;
      if (!isRowSelectByCheckbox) {
        setCheckboxColWidth(0);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      let ro: ResizeObserver | null = null;

      const measure = () => {
        const checkboxEl = container.querySelector(
          '[data-my-grid-checkbox-col="true"]'
        ) as HTMLElement | null;
        if (!checkboxEl) return;
        const rect = checkboxEl.getBoundingClientRect();
        setCheckboxColWidth(Math.ceil(rect.width));
      };

      const raf = requestAnimationFrame(() => measure());

      const checkboxEl = container.querySelector(
        '[data-my-grid-checkbox-col="true"]'
      ) as HTMLElement | null;
      if (checkboxEl) {
        ro = new ResizeObserver(() => measure());
        ro.observe(checkboxEl);
      }

      return () => {
        cancelAnimationFrame(raf);
        ro?.disconnect();
      };
    }, [isClient, isRowSelectByCheckbox, containerWidth, headers]);

    // fittingScreen: 표시용 headers 계산 (렌더링에만 사용)
    const renderHeaders = useMemo(() => {
      return computeFittingRenderHeaders({
        headers,
        containerWidth,
        checkboxColWidth,
        fittingScreen,
        fittingLocked,
      });
    }, [
      headers,
      fittingScreen,
      fittingLocked,
      containerWidth,
      checkboxColWidth,
    ]);

    // fitting 상태에서 사용자가 컬럼 폭을 조정하면 fitting을 잠그고(저장 우선),
    // 이후에는 base headers의 width가 그대로 적용되도록 한다.
    const handleHeadersChange = useCallback(
      (newHeaders: MyGridHeaderType[]) => {
        if (fittingScreen && !fittingLocked) {
          const prevMap = new Map<string, number | undefined>();
          for (const h of headers) prevMap.set(h.key, h.width);

          const widthChanged = newHeaders.some(
            (h) => prevMap.get(h.key) !== h.width
          );

          if (widthChanged) {
            setFittingLocked(true);
          }
        }
        onHeadersChange?.(newHeaders);
      },
      [fittingScreen, fittingLocked, headers, onHeadersChange]
    );

    // 컬럼 리사이즈 (헤더/행 셀 공통)
    const handleResize = useCallback(
      (columnKey: string, newWidth: number) => {
        const newHeaders = headers.map((h: MyGridHeaderType) =>
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
        handleHeadersChange(newHeaders);
      },
      [headers, handleHeadersChange]
    );

    const handleResizeMouseDown = useCallback(
      (e: React.MouseEvent, columnKey: string) => {
        e.preventDefault();
        setIsResizing(columnKey);
        const displayHeaders = renderHeaders ?? headers;
        const displayHeader = displayHeaders.find(
          (h: MyGridHeaderType) => h.key === columnKey
        );
        const startX = e.clientX;
        const startWidth =
          displayHeader?.width ??
          getHeaderDefaultWidth(displayHeader?.name) ??
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
      [renderHeaders, headers, handleResize]
    );

    // 리사이저 더블클릭 시 컬럼 너비를 콘텐츠에 맞춤(엑셀 스타일)
    const handleAutoFitColumn = useCallback(
      (columnKey: string) => {
        const header = headers.find((h: MyGridHeaderType) => h.key === columnKey);
        if (!header) return;
        const contentWidth = getColumnContentWidth(columnKey, header, data, size);
        handleResize(columnKey, contentWidth);
      },
      [headers, data, size, handleResize]
    );

    // 전체 데이터 개수를 기반으로 한 가상화 설정
    const virtualizer = useVirtualizer({
      count: totalCount || data.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => getRowHeight(size),
      overscan: 5, // overscan을 줄여서 성능 개선
      enabled: isClient,
      scrollPaddingEnd: 0,
      scrollPaddingStart: 0,
    });

    // 외부에서 호출할 수 있는 스크롤 함수들
    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => {
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
        },
        scrollToBottom: () => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        },
        scrollToRow: (rowIndex: number) => {
          if (containerRef.current && virtualizer) {
            const targetIndex = Math.max(0, rowIndex - 1);
            virtualizer.scrollToIndex(targetIndex, { align: "start" });
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
        },
      }),
      [virtualizer]
    );

    // 스크롤 디바운싱된 데이터 로드 함수
    const debouncedLoadRange = useCallback(
      (startIndex: number, endIndex: number) => {
        if (!isClient) return;
        if (!onLoadRange) return;

        // 이전 스크롤 타이머가 있다면 취소
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const lastRange = lastLoadRangeRef.current;
        if (
          lastRange &&
          lastRange.start === startIndex &&
          lastRange.end === endIndex
        ) {
          return;
        }

        scrollTimeoutRef.current = setTimeout(() => {
          onLoadRange(startIndex, endIndex);
          lastLoadRangeRef.current = { start: startIndex, end: endIndex };
        }, 50) as unknown as number;
      },
      [onLoadRange, isClient]
    );

    // 가상화된 아이템 범위를 확인하고 필요한 데이터 로드
    useEffect(() => {
      if (
        !isClient ||
        !virtualizer.getVirtualItems().length ||
        !onLoadRange ||
        !totalCount
      )
        return;
      const virtualItems = virtualizer.getVirtualItems();

      const firstVisibleIndex = virtualItems[0]?.index || 0;
      const lastVisibleIndex =
        virtualItems[virtualItems.length - 1]?.index || 0;

      const bufferSize = 10; // 20에서 10으로 줄임
      const startIndex = Math.max(0, firstVisibleIndex - bufferSize);
      const endIndex = Math.min(totalCount - 1, lastVisibleIndex + bufferSize);

      debouncedLoadRange(startIndex, endIndex);
    }, [
      virtualizer.getVirtualItems(),
      isClient,
      debouncedLoadRange,
      totalCount,
    ]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // 외부 영역 클릭 시 선택 해제
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isRowSelectByCheckbox) return;

        const target = event.target as Element;

        // 컨텍스트 메뉴 내부 클릭인지 확인
        if (target.closest(".context-menu")) {
          return; // 컨텍스트 메뉴 내부 클릭은 무시
        }

        // actionRow 영역 클릭인지 확인
        if (target.closest('[data-action-row="true"]')) {
          return; // actionRow 영역 클릭은 무시
        }

        if (containerRef.current && !containerRef.current.contains(target)) {
          setSelectedRows(new Set());
          setLastSelectedRow(null);
          if (onSelectedRowsChange) onSelectedRowsChange([], true);
        }

        // 컨텍스트 메뉴 외부 클릭 시 닫기
        if (contextMenu.visible) {
          setContextMenu((prev) => ({ ...prev, visible: false, row: null }));
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onSelectedRowsChange, contextMenu.visible]);

    const handleRowClick = (
      selectedRow: MyGridRowType,
      event: React.MouseEvent
    ) => {
      if (onRowClick) onRowClick(selectedRow, event);
      if (isRowSelectByCheckbox) return;

      const newSelectedRows = new Set(selectedRows);

      if (multiSelect && (event.ctrlKey || event.metaKey)) {
        // Ctrl/Cmd + 클릭: 개별 선택/해제
        const existingRow = Array.from(newSelectedRows).find(
          (r) => r.key === selectedRow.key
        );
        if (existingRow) {
          newSelectedRows.delete(existingRow);
        } else {
          newSelectedRows.add(selectedRow);
        }
        setLastSelectedRow(selectedRow);
      } else if (multiSelect && event.shiftKey && lastSelectedRow !== null) {
        // Shift + 클릭: 범위 선택
        const selectedRowIndex = data.findIndex(
          (r) => r.key === selectedRow.key
        );
        const lastSelectedRowIndex = data.findIndex(
          (r) => r.key === lastSelectedRow.key
        );
        const start = Math.min(lastSelectedRowIndex, selectedRowIndex);
        const end = Math.max(lastSelectedRowIndex, selectedRowIndex);

        if (
          end - start !=
          Math.abs(selectedRow.rowIndex - lastSelectedRow.rowIndex)
        ) {
          error("범위 선택이 가능한 범위를 벗어났습니다.");
          return;
        }

        for (let i = start; i <= end; i++) {
          newSelectedRows.add(data[i] as MyGridRowType);
        }
      } else {
        newSelectedRows.clear();
        newSelectedRows.add(selectedRow);
        setLastSelectedRow(selectedRow);
      }

      setSelectedRows(newSelectedRows);
      if (onSelectedRowsChange)
        onSelectedRowsChange(Array.from(newSelectedRows));
    };

    const handleCheckAll = (checked: boolean) => {
      if (checked) {
        // 모든 row 선택 (checkboxDisabled인 row는 제외)
        const allRows = new Set(data.filter((r) => !r.checkboxDisabled));
        setSelectedRows(allRows);
        const selectable = data.filter((r) => !r.checkboxDisabled);
        const lastRow = selectable.length > 0 ? selectable[selectable.length - 1] : null;
        setLastSelectedRow(lastRow ?? null);
        if (onSelectedRowsChange) {
          onSelectedRowsChange(Array.from(allRows));
        }
      } else {
        // 모든 row 해제
        setSelectedRows(new Set());
        setLastSelectedRow(null);
        if (onSelectedRowsChange) {
          onSelectedRowsChange([]);
        }
      }
    };

    const handleCheckRow = (checked: boolean, row: MyGridRowType) => {
      if (row.checkboxDisabled) return;
      const newSelectedRows = new Set(selectedRows);

      if (checked) {
        newSelectedRows.add(row);
        setLastSelectedRow(row);
      } else {
        newSelectedRows.delete(row);
        // 해제된 row가 lastSelectedRow였다면 null로 설정
        if (lastSelectedRow?.key === row.key) {
          const remainingRows = Array.from(newSelectedRows);
          setLastSelectedRow(
            remainingRows.length > 0 ? (remainingRows[0] ?? null) : null
          );
        }
      }

      setSelectedRows(newSelectedRows);
      if (onSelectedRowsChange) {
        onSelectedRowsChange(Array.from(newSelectedRows));
      }
    };

    // 셀 네비게이션 핸들러
    const getVisibleHeaders = useCallback(() => {
      return headers.filter((h) => h.visible);
    }, [headers]);

    const moveFocus = useCallback(
      (direction: "up" | "down" | "left" | "right") => {
        if (!enableCellNavigation || !focusedCell) return;

        const visibleHeaders = getVisibleHeaders();
        const currentHeaderIndex = visibleHeaders.findIndex(
          (h) => h.key === focusedCell.headerKey
        );
        const currentRowIndex = data.findIndex(
          (r) => r.key === focusedCell.rowKey
        );

        if (currentHeaderIndex === -1 || currentRowIndex === -1) return;

        let newHeaderIndex = currentHeaderIndex;
        let newRowIndex = currentRowIndex;

        switch (direction) {
          case "up":
            newRowIndex = Math.max(0, currentRowIndex - 1);
            break;
          case "down":
            newRowIndex = Math.min(data.length - 1, currentRowIndex + 1);
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

        const newRow = data[newRowIndex];
        const newHeader = visibleHeaders[newHeaderIndex];

        if (newRow && newHeader) {
          setFocusedCell({
            rowKey: newRow.key,
            headerKey: newHeader.key,
          });
        }
      },
      [enableCellNavigation, focusedCell, data, getVisibleHeaders]
    );

    const moveToNextCell = useCallback(() => {
      if (!enableCellNavigation || !focusedCell) return;

      const visibleHeaders = getVisibleHeaders();
      const skipHeaderKeySet = new Set(enterSkipHeaderKeys);
      const currentHeaderIndex = visibleHeaders.findIndex(
        (h) => h.key === focusedCell.headerKey
      );
      const currentRowIndex = data.findIndex(
        (r) => r.key === focusedCell.rowKey
      );

      if (currentHeaderIndex === -1 || currentRowIndex === -1) return;

      let newHeaderIndex = currentHeaderIndex + 1;
      let newRowIndex = currentRowIndex;
      const maxTries = visibleHeaders.length * data.length;

      for (let i = 0; i < maxTries; i++) {
        // 마지막 컬럼이면 다음 행의 첫 번째 컬럼으로 이동
        if (newHeaderIndex >= visibleHeaders.length) {
          newHeaderIndex = 0;
          newRowIndex += 1;
        }

        // 마지막 행이면 이동하지 않음
        if (newRowIndex >= data.length) {
          return;
        }

        const newRow = data[newRowIndex];
        const newHeader = visibleHeaders[newHeaderIndex];
        if (!newRow || !newHeader) return;

        if (!skipHeaderKeySet.has(newHeader.key)) {
          setFocusedCell({
            rowKey: newRow.key,
            headerKey: newHeader.key,
          });
          return;
        }

        newHeaderIndex += 1;
      }
    }, [enableCellNavigation, focusedCell, data, getVisibleHeaders, enterSkipHeaderKeys]);

    const handleCellFocus = useCallback(
      (rowKey: string | number, headerKey: string) => {
        if (!enableCellNavigation) return;
        setFocusedCell({ rowKey, headerKey });
      },
      [enableCellNavigation]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!enableCellNavigation || !focusedCell) return;

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

        // Enter 키로 다음 셀 이동
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          moveToNextCell();
          return;
        }
      },
      [enableCellNavigation, focusedCell, moveFocus, moveToNextCell]
    );

    // 우클릭 핸들러
    const handleRowContextMenu = (
      row: MyGridRowType,
      event: React.MouseEvent
    ) => {
      if (!onContextMenu) return;

      event.preventDefault();

      // 클릭한 행이 선택되지 않은 경우 해당 행만 선택
      const existingRow = Array.from(selectedRows).find(
        (r) => r.key === row.key
      );
      if (!existingRow) {
        setSelectedRows(new Set([row]));
        setLastSelectedRow(row);
        if (onSelectedRowsChange) onSelectedRowsChange([row]);
      }

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        visible: true,
        row,
      });
    };

    // 가상화된 행 렌더링 함수
    const VirtualizedRow = useCallback(
      (virtualRow: any) => {
        const { index, start, size: virtualSize } = virtualRow;
        if (!isClient) return;

        const row = onLoadRange
          ? data.find((row) => row.rowIndex === index + 1)
          : data[index];
        if (!row) {
          return (
            <MyGridRowSkeleton
              key={`empty-${index}`}
              index={index}
              headers={renderHeaders}
              size={virtualSize}
              start={start}
            />
          );
        }

        return (
          <div
            key={row.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${size}px`,
              transform: `translateY(${start}px)`,
            }}
          >
            <MyGridRow
              headers={renderHeaders}
              row={row}
              selectedRows={selectedRows}
              isRowSelectByCheckbox={isRowSelectByCheckbox}
              enableCellNavigation={enableCellNavigation}
              focusedCell={focusedCell}
              size={size}
              searchKeyword={searchKeyword}
              onRowClick={handleRowClick}
              onRowContextMenu={handleRowContextMenu}
              onDataChange={onDataChange}
              onRowDoubleClick={onRowDoubleClick}
              onCheckRow={handleCheckRow}
              onCellFocus={handleCellFocus}
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
        data,
        renderHeaders,
        isClient,
        totalCount,
        selectedRows,
        enableCellNavigation,
        focusedCell,
        handleCellFocus,
        searchKeyword,
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

    // 서버 사이드 렌더링 중에는 기본 UI만 표시
    if (!isClient) {
      return (
        <div className="flex flex-col w-full h-full border border-[var(--grid-border)] rounded-sm">
          <MyGridHeader
            headers={headers}
            isRowSelectByCheckbox={isRowSelectByCheckbox}
            onSort={onSort}
            onCheckAll={handleCheckAll}
            selectedRows={selectedRows}
            totalRows={data.length}
          />
          <MsgContainer>
            <MyLoadingSpinner size="fixed" />
          </MsgContainer>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex flex-col w-full h-full border border-[var(--grid-border)] rounded-sm my-scroll my-grid-virtualized relative outline-none"
        data-testid={testId}
        onScroll={handleScroll}
        onKeyDown={enableCellNavigation ? handleKeyDown : undefined}
        tabIndex={enableCellNavigation ? 0 : undefined}
      >
        <div className="sticky top-0 z-50 bg-[var(--grid-bg)]">
          {/*
           * 체크박스 선택 모드의 header checkbox는 checkboxDisabled인 row를 제외한 기준으로 계산
           */}
          <MyGridHeader
            headers={headers}
            renderHeaders={renderHeaders}
            isRowSelectByCheckbox={isRowSelectByCheckbox}
            onHeadersChange={handleHeadersChange}
            onSort={onSort}
            onCheckAll={handleCheckAll}
            selectedRows={
              isRowSelectByCheckbox
                ? new Set(Array.from(selectedRows).filter((r) => !r.checkboxDisabled))
                : selectedRows
            }
            totalRows={
              isRowSelectByCheckbox
                ? data.filter((r) => !r.checkboxDisabled).length
                : data.length
            }
            isResizing={isResizing}
            onResizeMouseDown={handleResizeMouseDown}
            onAutoFitColumn={handleAutoFitColumn}
            resizeHandleHoveredHeaderKey={resizeHandleHoveredHeaderKey}
            onResizeHandleHover={setResizeHandleHoveredHeaderKey}
          />
        </div>

        {isError && (
          <MsgContainer>
            <div className="text-[14px] text-red-500">{errorMsg}</div>
          </MsgContainer>
        )}

        {!isError && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--grid-bg)] opacity-50 z-20">
            <MyLoadingSpinner size="fixed" text={loadingMsg} />
          </div>
        )}

        {!isError && !isLoading && (
          <div className="flex-1 bg-[var(--grid-bg)]">
            {actionRowTop && (
              <div
                className="w-full bg-[var(--grid-bg)]"
                data-action-row="true"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                {actionRowTop}
              </div>
            )}
            {(totalCount || data.length) > 0 && (
              <div
                style={{
                  height: `${isClient ? virtualizer.getTotalSize() : (totalCount || data.length) * getRowHeight(size)}px`,
                  width: "100%",
                  position: "relative",
                  minWidth: "max-content",
                }}
              >
                {isClient && virtualizer.getVirtualItems().map(VirtualizedRow)}
              </div>
            )}
            {actionRowBottom && (
              <div
                className="w-full bg-[var(--grid-bg)]"
                data-action-row="true"
                style={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 10,
                }}
              >
                {actionRowBottom}
              </div>
            )}
          </div>
        )}
        {!isError && !isLoading && (totalCount || data.length) === 0 && (
          <MsgContainer>
            <div className="text-[14px] text-gray-500">데이터가 없습니다.</div>
          </MsgContainer>
        )}
        {isLoadingMore && hasMore && <LoadingMore />}

        {contextMenu.visible &&
          onContextMenu &&
          createPortal(
            <ContextMenuViewportClamp
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              menuContent={onContextMenu(
                contextMenu,
                setContextMenu,
                selectedRows,
                setSelectedRows,
                setLastSelectedRow
              )}
            />,
            portalTarget || document.body
          )}
      </div>
    );
  }
);

export default MyGrid;
