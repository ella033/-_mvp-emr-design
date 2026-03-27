"use client";

import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useContext,
  createContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { PAPER_SIZES, resolvePaperSize } from "./paper";
import { PrintPageBreak } from "./PrintPageBreak";
import type { PrintableDocumentProps } from "./types";
import {
  createRepeatedRenderer,
  mmToPx,
  mmValue,
  resolveMargin,
} from "./utils";
import "./styles.css";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface PrintableItem {
  id: string;
  kind: "block" | "table" | "page-break";
  render: () => ReactNode;
  table?: ParsedTable;
}

interface ParsedTable {
  props: TableHTMLAttributes<HTMLTableElement>;
  caption?: ReactElement;
  head?: ReactElement;
  bodyRows: ReactNode[];
  footer?: ReactElement;
  tbodyProps?: TableHTMLAttributes<HTMLTableSectionElement>;
}

export interface MeasurementEntry {
  id: string;
  height: number;
  table?: {
    headHeight: number;
    footHeight: number;
    rowHeights: number[];
  };
}

export interface PaginatedPage {
  id: string;
  blocks: PaginatedBlock[];
}

interface PaginatedBlockBase {
  itemId: string;
}

export type PaginatedBlock =
  | ({
    type: "block";
  } & PaginatedBlockBase)
  | ({
    type: "table";
    startRow: number;
    endRow: number;
    showFooter: boolean;
    tablePageIndex?: number;
    tableTotalPages?: number;
  } & PaginatedBlockBase);

/**
 * 테이블 내에서 현재 페이지 정보를 공유하기 위한 컨텍스트입니다.
 */
interface TablePaginationContextValue {
  pageIndex: number;
  totalPages: number;
}

const TablePaginationContext = createContext<TablePaginationContextValue | null>(null);

export function usePrintTablePagination() {
  return useContext(TablePaginationContext);
}

/**
 * 페이지 단위 렌더링(헤더/푸터 등)에서 현재 페이지 정보를 공유하기 위한 컨텍스트입니다.
 */
interface PrintPageContextValue {
  pageIndex: number; // 1-based
  totalPages: number;
  pageId: string;
}

const PrintPageContext = createContext<PrintPageContextValue | null>(null);

export function usePrintPageContext() {
  return useContext(PrintPageContext);
}

/**
 * Fragment를 재귀적으로 평탄화하여 실제 렌더링될 노드 배열을 반환하는 헬퍼 함수입니다.
 * map() 내의 Fragment나 중첩된 Fragment들을 모두 해제하여 PrintableDocument가 인식할 수 있게 합니다.
 */
function flattenChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      if (child !== null && child !== undefined && typeof child !== 'boolean') {
        result.push(child);
      }
      return;
    }

    if (child.type === Fragment) {
      result.push(...flattenChildren(child.props.children));
    } else {
      result.push(child);
    }
  });

  return result;
}

/**
 * 두 페이지네이션 결과가 구조적으로 동일한지 비교합니다.
 * 같으면 true를 반환하여 setPages를 스킵하고 불필요한 re-render를 방지합니다.
 */
function arePagesEqual(a: PaginatedPage[], b: PaginatedPage[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const pageA = a[i]!;
    const pageB = b[i]!;
    if (pageA.blocks.length !== pageB.blocks.length) return false;
    for (let j = 0; j < pageA.blocks.length; j++) {
      const blockA = pageA.blocks[j]!;
      const blockB = pageB.blocks[j]!;
      if (blockA.type !== blockB.type || blockA.itemId !== blockB.itemId) return false;
      if (blockA.type === "table" && blockB.type === "table") {
        if (blockA.startRow !== blockB.startRow || blockA.endRow !== blockB.endRow) return false;
      }
    }
  }
  return true;
}

/**
 * 래퍼 요소(section, div 등) 내부에 <table>이 포함된 경우,
 * 래퍼를 분해하여 테이블을 개별 PrintableItem으로 추출합니다.
 * 이를 통해 기존 테이블 행 분할 로직이 래퍼 내부 테이블에도 적용됩니다.
 *
 * 한 단계(래퍼의 직접 자식)만 탐색하며, 깊은 중첩은 처리하지 않습니다.
 */
function unwrapTableContainer(
  node: ReactElement,
  parentIndex: number,
): PrintableItem[] | null {
  // React 컴포넌트 래퍼는 무시 — HTML 요소만 처리
  if (typeof node.type !== "string") {
    return null;
  }

  // 이미 table이면 기존 로직에서 처리
  if (node.type === "table") {
    return null;
  }

  const wrapperChildren = flattenChildren(
    (node.props as { children?: ReactNode }).children,
  );

  // 직접 자식 중 <table>이 없으면 기존 block 동작 유지
  const hasTable = wrapperChildren.some(
    (child) => isValidElement(child) && child.type === "table",
  );

  if (!hasTable) {
    return null;
  }

  // 래퍼의 margin 스타일 추출 (sub-item에 전파)
  const wrapperStyle =
    (node.props as { style?: Record<string, unknown> }).style ?? {};
  const wrapperMarginTop = wrapperStyle.marginTop as string | undefined;
  const wrapperMarginBottom = wrapperStyle.marginBottom as string | undefined;

  const items: PrintableItem[] = [];
  let pendingChildren: ReactNode[] = [];
  let subIndex = 0;

  const flushPendingAsBlock = (extraStyle?: Record<string, unknown>) => {
    if (pendingChildren.length === 0) return;

    const blockChildren = [...pendingChildren];
    pendingChildren = [];

    const id = `block-${parentIndex}-${subIndex}`;
    subIndex += 1;

    items.push({
      id,
      kind: "block",
      render: () => (
        <div style={extraStyle}>
          {blockChildren.length === 1 ? blockChildren[0] : blockChildren}
        </div>
      ),
    });
  };

  wrapperChildren.forEach((child) => {
    if (isValidElement(child) && child.type === "table") {
      // 누적된 비테이블 자식들을 block으로 flush
      const isFirstFlush = items.length === 0;
      const marginStyle = isFirstFlush && wrapperMarginTop
        ? { marginTop: wrapperMarginTop }
        : undefined;
      flushPendingAsBlock(marginStyle);

      // 테이블 파싱
      const parsed = parseTableElement(child);
      const tableId = `table-${parentIndex}-${subIndex}`;
      subIndex += 1;

      if (parsed) {
        // 이 테이블이 래퍼의 첫 아이템이고 marginTop이 있으면 전파
        const needsMarginTop = items.length === 0 && wrapperMarginTop !== undefined;

        items.push({
          id: tableId,
          kind: "table",
          render: () => {
            const tableEl = cloneElement(child);
            if (needsMarginTop) {
              return <div style={{ marginTop: wrapperMarginTop }}>{tableEl}</div>;
            }
            return tableEl;
          },
          table: parsed,
        });
      } else {
        // 파싱 실패 시 block으로 fallback
        items.push({
          id: tableId,
          kind: "block",
          render: () => <Fragment>{child}</Fragment>,
        });
      }
    } else {
      pendingChildren.push(child);
    }
  });

  // 남은 비테이블 자식들 flush
  if (pendingChildren.length > 0) {
    const isFirstFlush = items.length === 0;
    const marginStyle: Record<string, unknown> = {};
    if (isFirstFlush && wrapperMarginTop) {
      marginStyle.marginTop = wrapperMarginTop;
    }
    if (wrapperMarginBottom) {
      marginStyle.marginBottom = wrapperMarginBottom;
    }
    flushPendingAsBlock(
      Object.keys(marginStyle).length > 0 ? marginStyle : undefined,
    );
  } else if (items.length > 0 && wrapperMarginBottom) {
    // 남은 자식 없지만 래퍼의 marginBottom을 마지막 item에 전파
    const lastItem = items[items.length - 1]!;
    const originalRender = lastItem.render;
    lastItem.render = () => (
      <div style={{ marginBottom: wrapperMarginBottom }}>{originalRender()}</div>
    );
  }

  return items.length > 0 ? items : null;
}

export function PrintableDocument({
  children,
  paper = PAPER_SIZES.A4,
  margin,
  header,
  footer,
  footerMode = "flow",
  gap = 24,
  sectionSpacing = 4,
  // FIXME: includeMargins true일 때 동작 문제 없으면 항상 동작하게 분기 동작 삭제 
  /**
   * includeMargins는 **페이지(@page) margin**이 아니라,
   * PrintableDocument의 **top-level children(직접 자식 요소들) 사이의 실제 세로 간격(px)** 을
   * 페이지네이션(페이지 분할) 계산에 포함할지 여부를 의미합니다.
   *
   * - **페이지 여백(인쇄 영역의 margin)**: `margin` prop + `@page { margin: ... }` 규칙으로 이미 적용됩니다.
   * - **includeMargins가 포함하는 것**: 각 top-level child가 `margin-bottom`, 다음 child가 `margin-top` 등을 가지고 있을 때
   *   실제 DOM 배치에서 생기는 “요소 사이 gap(px)”을 측정해서 이전 아이템 높이에 더해 페이지 분할을 더 정확히 합니다.
   *
   * 왜 추가됐나?
   * - 기존 페이지네이션은 측정 시 `offsetHeight`를 사용했는데, `offsetHeight`는 **margin을 포함하지 않습니다.**
   * - 그래서 서식이 margin으로 간격을 만들면 “계산상으로는 페이지에 들어간다”로 판단하지만 실제 렌더는 페이지를 넘쳐
   *   테이블 분할/페이지 넘김이 늦게 발생하는(overflow) 문제가 생겼습니다.
   * - 이를 해결하려고 “연속된 top-level children 간 실제 gap(px)”을 계산해서 페이지네이션에 반영하는 옵션이 추가되었습니다.
   *
   * 기본값은 `true`(정확한 페이지 분할 우선)이며,
   * 특정 서식에서 페이지 수/끊김이 의도와 다르게 바뀌면 `includeMargins={false}`로 기존 동작(offsetHeight 기반)으로 되돌릴 수 있습니다.
   */
  includeMargins = true,
  observeDependencies = [],
  className,
  onPageCountChange,
}: PrintableDocumentProps) {
  const paperSize = resolvePaperSize(paper);
  const marginInfo = resolveMargin(margin);
  const headerRenderer = useMemo(
    () => createRepeatedRenderer(header),
    [header],
  );
  const footerRenderer = useMemo(
    () => createRepeatedRenderer(footer),
    [footer],
  );
  const contentWidthPx =
    mmToPx(paperSize.width) - marginInfo.px.left - marginInfo.px.right;
  const contentHeightPx =
    mmToPx(paperSize.height) - marginInfo.px.top - marginInfo.px.bottom;
  const sectionSpacingValue = Math.max(sectionSpacing ?? 0, 0);
  const headerSpacingMm = header ? sectionSpacingValue : 0;
  const footerSpacingMm = footer && footerMode === "flow" ? sectionSpacingValue : 0;
  const headerSpacingPx = headerSpacingMm ? mmToPx(headerSpacingMm) : 0;
  const footerSpacingPx = footerSpacingMm ? mmToPx(footerSpacingMm) : 0;
  const measureRef = useRef<HTMLDivElement | null>(null);
  const measureContentRef = useRef<HTMLDivElement | null>(null);
  const measureHeaderRef = useRef<HTMLDivElement | null>(null);
  const measureFooterRef = useRef<HTMLDivElement | null>(null);
  const pageStyleRef = useRef<HTMLStyleElement | null>(null);
  const pageStyleKey = `${paperSize.width}x${paperSize.height}`;
  const [pages, setPages] = useState<PaginatedPage[]>([]);
  const prevPageCountRef = useRef(0);
  useEffect(function setupPageRule() {
    if (typeof document === "undefined") {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-printable-page-style", pageStyleKey);
    styleElement.textContent = `
      @page {
        size: ${paperSize.width}mm ${paperSize.height}mm;
        margin: ${marginInfo.top}mm ${marginInfo.right}mm ${marginInfo.bottom}mm ${marginInfo.left}mm;
      }
    `;
    document.head.appendChild(styleElement);
    pageStyleRef.current = styleElement;

    return () => {
      if (pageStyleRef.current?.parentNode) {
        pageStyleRef.current.parentNode.removeChild(pageStyleRef.current);
      }
      pageStyleRef.current = null;
    };
  }, [
    pageStyleKey,
    paperSize.height,
    paperSize.width,
    marginInfo.bottom,
    marginInfo.left,
    marginInfo.right,
    marginInfo.top,
  ]);

  useEffect(function setupPrintContainer() {
    if (typeof document === "undefined") {
      return;
    }

    const container = document.createElement("div");
    container.setAttribute("data-print-root", "true");
    document.body.appendChild(container);
    setPrintContainer(container);

    return () => {
      document.body.removeChild(container);
      setPrintContainer(null);
    };
  }, []);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [measureVersion, setMeasureVersion] = useState(0);
  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);

  const printableItems = useMemo(() => {
    const nodes = flattenChildren(children);
    const result: PrintableItem[] = [];

    nodes.forEach((node, index) => {
      if (isValidElement(node)) {
        if (node.type === "table") {
          const parsed = parseTableElement(node);
          if (parsed) {
            result.push({
              id: `table-${index}`,
              kind: "table",
              render: () => cloneElement(node),
              table: parsed,
            });
            return;
          }
        }

        if (node.type === PrintPageBreak) {
          result.push({
            id: `page-break-${index}`,
            kind: "page-break",
            render: () => null,
          });
          return;
        }

        // 래퍼 요소 내부 테이블 감지 및 분해
        const unwrapped = unwrapTableContainer(node, index);
        if (unwrapped) {
          result.push(...unwrapped);
          return;
        }
      }

      result.push({
        id: `block-${index}`,
        kind: "block",
        render: () => <Fragment>{node}</Fragment>,
      });
    });

    return result;
  }, [children]);

  const measureBlocks = useMemo(
    () =>
      printableItems.map((item) => (
        <div
          key={item.id}
          data-print-block
          data-print-kind={item.kind}
          data-print-index={item.id}
          style={{ width: "100%" }}
        >
          {item.render()}
        </div>
      )),
    [printableItems],
  );

  useIsomorphicLayoutEffect(function bindMeasureObservers() {
    if (typeof window === "undefined") {
      return;
    }

    if (!("ResizeObserver" in window)) {
      return;
    }

    const targets = [
      measureRef.current,
      measureContentRef.current,
      measureHeaderRef.current,
      measureFooterRef.current,
    ].filter(Boolean) as HTMLElement[];

    if (!targets.length) {
      return;
    }

    const observers = targets.map((element) => {
      const observer = new ResizeObserver(() => {
        setMeasureVersion((value) => value + 1);
      });
      observer.observe(element);
      return observer;
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useIsomorphicLayoutEffect(function calculatePagination() {
    if (typeof window === "undefined") {
      return;
    }

    if (!("requestAnimationFrame" in window)) {
      return;
    }

    if (!measureRef.current || !measureContentRef.current) {
      return;
    }

    const readMeasurements = () => {
      const headerElement = measureHeaderRef.current;
      const footerElement = measureFooterRef.current;
      const headerHeightValue =
        (headerElement?.offsetHeight ?? 0) + headerSpacingPx;
      const shouldMeasureFooter = footerMode === "flow";
      const footerHeightValue = shouldMeasureFooter
        ? (footerElement?.offsetHeight ?? 0) + footerSpacingPx
        : 0;
      setHeaderHeight(headerHeightValue);
      setFooterHeight(footerHeightValue);

      const blockNodes = Array.from(
        measureContentRef.current?.querySelectorAll<HTMLElement>(
          "[data-print-block]",
        ) ?? [],
      );

      const resolveInnerRect = (node: HTMLElement) => {
        const inner = node.firstElementChild as HTMLElement | null;
        return (inner ?? node).getBoundingClientRect();
      };

      const measurementEntries: MeasurementEntry[] = blockNodes.map(
        (node, index) => {
          const id = node.dataset.printIndex ?? "";
          const kind = node.dataset.printKind;
          const spacingAfter = (() => {
            if (!includeMargins) return 0;
            const next = blockNodes[index + 1];
            if (!next) return 0;
            const currentRect = resolveInnerRect(node);
            const nextRect = resolveInnerRect(next);
            const gap = nextRect.top - currentRect.bottom;
            return gap > 0 ? gap : 0;
          })();
          if (kind === "table") {
            const rowNodes = Array.from(
              node.querySelectorAll<HTMLTableRowElement>("tbody tr"),
            );
            const rowHeights = rowNodes.map((row) => row.offsetHeight);
            const headHeight =
              node.querySelector<HTMLElement>("thead")?.offsetHeight ?? 0;
            const footHeight =
              (node.querySelector<HTMLElement>("tfoot")?.offsetHeight ?? 0) +
              spacingAfter;

            return {
              id,
              height: node.offsetHeight + spacingAfter,
              table: {
                headHeight,
                footHeight,
                rowHeights,
              },
            };
          }

          return {
            id,
            height: node.offsetHeight + spacingAfter,
          };
        },
      );

      return {
        entries: measurementEntries,
        headerHeight: headerHeightValue,
        footerHeight: footerHeightValue,
      };
    };

    const raf = window.requestAnimationFrame(() => {
      const measurements = readMeasurements();
      const paginated = paginateItems({
        items: printableItems,
        measurements,
        contentHeight: Math.max(
          0,
          contentHeightPx - measurements.headerHeight - measurements.footerHeight,
        ),
        footerSpacingPx,
        bottomMarginPx: marginInfo.px.bottom,
      });
      setPages((prev) => {
        if (arePagesEqual(prev, paginated)) return prev;
        return paginated;
      });
      if (paginated.length !== prevPageCountRef.current) {
        prevPageCountRef.current = paginated.length;
        onPageCountChange?.(paginated.length);
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [
    printableItems,
    contentHeightPx,
    footerMode,
    footerSpacingPx,
    headerSpacingPx,
    includeMargins,
    measureVersion,
    observeDependencies,
    onPageCountChange,
  ]);

  const pageStyle = {
    width: mmValue(paperSize.width),
    height: mmValue(paperSize.height),
    padding: `${marginInfo.top}mm ${marginInfo.right}mm ${marginInfo.bottom}mm ${marginInfo.left}mm`,
  };

  const availableBodyHeightPx = Math.max(
    contentHeightPx - headerHeight - footerHeight,
    0,
  );
  const bodyMinHeight = availableBodyHeightPx;

  const bodyStyle = {
    width: `${contentWidthPx}px`,
    minHeight: `${Math.max(0, bodyMinHeight)}px`,
  };

  const renderedPages = pages.length
    ? pages
    : [
      {
        id: "page-1",
        blocks: [],
      },
    ];

  const itemMap = useMemo(
    () => new Map(printableItems.map((item) => [item.id, item])),
    [printableItems],
  );

  const headerSpacingStylePage =
    headerSpacingMm > 0 ? { marginBottom: `${headerSpacingMm}mm` } : undefined;
  const footerSpacingStylePage =
    footerSpacingMm > 0 ? { marginTop: `${footerSpacingMm}mm` } : undefined;

  const renderPages = () => (
    <div
      className="printable-pages"
      style={{
        gap: `${gap}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {renderedPages.map((page, index) => {
        const totalPages = renderedPages.length;
        const pageContextValue: PrintPageContextValue = {
          pageIndex: index + 1,
          totalPages,
          pageId: page.id,
        };
        const isOverlayFooter = footerMode === "overlay";
        const pageStyleValue = isOverlayFooter
          ? ({ ...pageStyle, position: "relative" } as const)
          : pageStyle;

        return (
          <PrintPageContext.Provider key={page.id} value={pageContextValue}>
            <section className="printable-page" style={pageStyleValue}>
              {(() => {
                const node = headerRenderer(`${page.id}-header`);
                if (!node) {
                  return null;
                }
                return (
                  <div className="printable-page-header" style={headerSpacingStylePage}>
                    {node}
                  </div>
                );
              })()}
              <div className="printable-page-body" style={bodyStyle}>
                {page.blocks.map((block, blockIndex) => {
                  if (block.type === "block") {
                    const item = itemMap.get(block.itemId);
                    return (
                      <div key={`${page.id}-block-${blockIndex}`} className="printable-block">
                        {item?.render()}
                      </div>
                    );
                  }

                  const item = itemMap.get(block.itemId);
                  if (!item?.table) {
                    return null;
                  }

                  return (
                    <div key={`${page.id}-table-${blockIndex}`} className="printable-block">
                      {renderTableSlice(
                        item.table,
                        block.startRow,
                        block.endRow,
                        block.showFooter,
                        block.tablePageIndex,
                        block.tableTotalPages,
                      )}
                    </div>
                  );
                })}
              </div>
              {(() => {
                const node = footerRenderer(`${page.id}-footer`);
                if (!node) {
                  return null;
                }

                if (isOverlayFooter) {
                  return (
                    <div
                      className="printable-page-footer"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        width: "100%",
                        height: 0,
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {node}
                    </div>
                  );
                }

                return (
                  <div className="printable-page-footer" style={footerSpacingStylePage}>
                    {node}
                  </div>
                );
              })()}
            </section>
          </PrintPageContext.Provider>
        );
      })}
    </div>
  );

  return (
    <>
      <div className={cn("printable-document", className)} data-print-preview-root="true">
        {renderPages()}
      </div>

      {/* 측정 영역을 Portal로 body에 렌더링 - 스크롤에 영향 없음 */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            ref={measureRef}
            className={cn("printable-document", className)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              pointerEvents: "none",
              visibility: "hidden",
              zIndex: -9999,
              width: mmValue(paperSize.width),
            }}
          >
            {(() => {
              const node = headerRenderer("measure-header");
              if (!node) {
                return null;
              }
              return (
                <div
                  ref={measureHeaderRef}
                  style={{
                    width: `${contentWidthPx}px`,
                    ...(headerSpacingPx
                      ? { marginBottom: `${headerSpacingPx}px` }
                      : {}),
                  }}
                  data-measure="header"
                >
                  {node}
                </div>
              );
            })()}
            <div
              ref={measureContentRef}
              style={{
                width: `${contentWidthPx}px`,
                minHeight: `${contentHeightPx}px`,
              }}
            >
              {measureBlocks}
            </div>
            {(() => {
              const node = footerRenderer("measure-footer");
              if (!node || footerMode !== "flow") {
                return null;
              }
              return (
                <div
                  ref={measureFooterRef}
                  style={{
                    width: `${contentWidthPx}px`,
                    ...(footerSpacingPx
                      ? { marginTop: `${footerSpacingPx}px` }
                      : {}),
                  }}
                  data-measure="footer"
                >
                  {node}
                </div>
              );
            })()}
          </div>,
          document.body,
        )}

      {printContainer
        ? createPortal(
          <div className={cn("printable-document", className)} data-print-root="true">
            {renderPages()}
          </div>,
          printContainer,
        )
        : null}
    </>
  );
}

export function paginateItems({
  items,
  measurements,
  contentHeight,
  footerSpacingPx = 0,
  bottomMarginPx = 0,
}: {
  items: PrintableItem[];
  measurements: {
    entries: MeasurementEntry[];
    headerHeight: number;
    footerHeight: number;
  };
  contentHeight: number;
  footerSpacingPx?: number;
  /** 하단 마진(px). Widow protection 오버플로가 이 값을 넘지 않도록 제한 */
  bottomMarginPx?: number;
}): PaginatedPage[] {
  const measurementMap = new Map(measurements.entries.map((entry) => [entry.id, entry]));
  const pages: PaginatedPage[] = [];
  const EPSILON = 0.5;
  /**
   * 서브픽셀 누적 오차를 흡수하기 위한 안전 여백(px).
   *
   * 문제 배경:
   *   동일한 OS·브라우저·버전이라도 PC마다 PDF 페이지네이션 결과가 달라지는 현상이 있었음.
   *   예) 영수증이 1장이어야 하는데, 일부 PC에서 2페이지에 테이블 헤더만 출력됨.
   *
   * 원인:
   *   - Windows 디스플레이 배율(100%/125%/150% 등), 시스템 폰트 설치 여부,
   *     브라우저 확대/축소, 폰트 렌더링 방식 등 환경 차이로 인해
   *     브라우저가 각 요소의 높이를 렌더링할 때 서브픽셀(소수점) 단위로 계산하지만,
   *     offsetHeight는 정수로 반올림하여 반환함
   *   - 이 반올림 오차가 행(row)마다 누적되면, 테이블 전체에서 수 px 차이가 발생
   *   - 페이지 가용 높이 경계에 딱 맞는 콘텐츠의 경우, 이 오차만으로 다음 페이지로 밀림
   *
   * 해결:
   *   페이지 가용 높이에서 2px을 빼서, 어떤 환경에서든 콘텐츠가 경계를 넘지 않도록 함.
   *   2px은 인쇄물에서 육안으로 구분 불가능한 크기이면서,
   *   일반적인 서브픽셀 누적 오차를 충분히 흡수함.
   */
  const SUB_PIXEL_TOLERANCE = 2;
  const safeContentHeight = Math.max(0, contentHeight - footerSpacingPx - SUB_PIXEL_TOLERANCE);
  let pageIndex = 0;
  let currentPage: PaginatedPage = {
    id: `page-${pageIndex + 1}`,
    blocks: [],
  };
  let usedHeight = 0;

  const flushPage = () => {
    if (currentPage.blocks.length > 0) {
      pages.push(currentPage);
      pageIndex += 1;
      currentPage = {
        id: `page-${pageIndex + 1}`,
        blocks: [],
      };
      usedHeight = 0;
    }
  };

  items.forEach((item) => {
    if (item.kind === "page-break") {
      flushPage();
      return;
    }

    const measurement = measurementMap.get(item.id);
    if (!measurement) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[PrintableDocument] 측정값 누락: item.id="${item.id}", kind="${item.kind}". 해당 아이템은 페이지네이션에서 제외됩니다.`,
        );
      }
      return;
    }

    if (item.kind === "block") {
      if (
        usedHeight + measurement.height > safeContentHeight &&
        currentPage.blocks.length > 0
      ) {
        flushPage();
      }

      currentPage.blocks.push({
        type: "block",
        itemId: item.id,
      });
      usedHeight += measurement.height;
      if (usedHeight >= safeContentHeight) {
        flushPage();
      }
      return;
    }

    if (!measurement.table || !item.table) {
      if (
        usedHeight + measurement.height > safeContentHeight &&
        currentPage.blocks.length > 0
      ) {
        flushPage();
      }

      currentPage.blocks.push({
        type: "block",
        itemId: item.id,
      });
      usedHeight += measurement.height;
      if (usedHeight >= safeContentHeight) {
        flushPage();
      }
      return;
    }

    const { rowHeights, headHeight, footHeight } = measurement.table;
    let rowIndex = 0;
    const tableBlocks: PaginatedBlock[] = [];

    while (rowIndex < rowHeights.length) {
      if (usedHeight >= safeContentHeight && currentPage.blocks.length > 0) {
        flushPage();
      }

      let chunkStart = rowIndex;
      let chunkHeight = 0;
      const availableHeight = Math.max(0, safeContentHeight - usedHeight);

      if (headHeight > 0) {
        if (chunkHeight + headHeight > availableHeight && usedHeight > 0) {
          flushPage();
          continue;
        }
        chunkHeight += headHeight;
      }

      while (rowIndex < rowHeights.length) {
        const isLastRow = rowIndex === rowHeights.length - 1;
        const currentRowHeight = rowHeights[rowIndex];
        if (currentRowHeight === undefined) {
          break;
        }
        const rowHeight = currentRowHeight;
        const footerReserve = isLastRow ? footHeight : 0;
        const projectedHeight = chunkHeight + rowHeight + footerReserve;

        if (
          projectedHeight <= availableHeight ||
          rowIndex === chunkStart ||
          availableHeight <= 0
        ) {
          chunkHeight += rowHeight;
          rowIndex += 1;
          if (isLastRow) {
            chunkHeight += footerReserve;
          }
        } else {
          break;
        }
      }

      /**
       * Widow protection (과부 행 방지)
       *
       * 테이블 분할 시 다음 페이지에 남는 행이 너무 적으면 분할하지 않는다.
       * 판단 기준: "나머지 행 높이(tfoot 포함) ≤ thead 높이"
       *
       * 예) 영수증 테이블이 페이지 경계를 10px만 초과할 때:
       *   - 분할하면: 2페이지에 thead(54px) + 주(註)(10px) = 64px 사용 → 비효율
       *   - 분할 안 하면: 1페이지에서 10px만 마진 영역으로 약간 넘침 → 인쇄 시 무시 가능
       *
       * 이 로직 덕분에 환경별 측정값 차이(수 px)로 인한 불필요한 테이블 분할을
       * 서식마다 개별 처리 없이 시스템 레벨에서 방지할 수 있다.
       */
      let widowProtected = false;
      if (rowIndex < rowHeights.length && rowIndex > chunkStart && headHeight > 0) {
        let remainingRowsHeight = 0;
        for (let r = rowIndex; r < rowHeights.length; r++) {
          remainingRowsHeight += rowHeights[r] ?? 0;
        }
        const remainingTotalHeight = remainingRowsHeight + footHeight;
        // 나머지 행 높이가 thead보다 작으면 분할이 비효율적
        if (remainingTotalHeight <= headHeight) {
          // 오버플로가 하단 마진을 넘으면 잘릴 수 있으므로 마진 이내로 제한
          const projectedOverflow = (chunkHeight + remainingTotalHeight) - availableHeight;
          const safeOverflowLimit = Math.max(0, bottomMarginPx - SUB_PIXEL_TOLERANCE);
          if (projectedOverflow <= safeOverflowLimit) {
            while (rowIndex < rowHeights.length) {
              chunkHeight += rowHeights[rowIndex] ?? 0;
              rowIndex += 1;
            }
            chunkHeight += footHeight;
            widowProtected = true;
          }
        }
      }

      if (rowIndex === chunkStart) {
        const singleRowHeight = rowHeights[rowIndex] ?? 0;
        const wasLastRow = rowIndex === rowHeights.length - 1;
        chunkHeight += singleRowHeight;
        rowIndex += 1;
        if (wasLastRow) {
          chunkHeight += footHeight;
        }
      }

      const rowsInChunk = rowIndex - chunkStart;
      const overflowed = chunkHeight - availableHeight > EPSILON && rowsInChunk > 0;
      if (overflowed && !widowProtected) {
        if (rowsInChunk === 1 && chunkHeight > safeContentHeight + EPSILON) {
          // allow oversized row to overflow a single page
        } else {
          rowIndex = chunkStart;
          flushPage();
          continue;
        }
      }

      const showFooter = rowIndex >= rowHeights.length && footHeight > 0;

      const block: PaginatedBlock = {
        type: "table",
        itemId: item.id,
        startRow: chunkStart,
        endRow: rowIndex,
        showFooter,
      };

      currentPage.blocks.push(block);
      tableBlocks.push(block);

      usedHeight += chunkHeight;

      if (usedHeight >= safeContentHeight - EPSILON) {
        flushPage();
      }
    }

    // 테이블 내 페이지 정보 업데이트
    tableBlocks.forEach((block, idx) => {
      if (block.type === "table") {
        block.tablePageIndex = idx + 1;
        block.tableTotalPages = tableBlocks.length;
      }
    });
  });

  flushPage();
  if (!pages.length) {
    return [
      {
        id: "page-1",
        blocks: [],
      },
    ];
  }
  return pages;
}

function parseTableElement(element: ReactElement<any>): ParsedTable | null {
  const childElements = Children.toArray(element.props.children);
  const { children: _children, ...restProps } =
    element.props as TableHTMLAttributes<HTMLTableElement>;

  const tableProps: TableHTMLAttributes<HTMLTableElement> = { ...restProps };

  let caption: ReactElement<any> | undefined;
  let head: ReactElement<any> | undefined;
  let footer: ReactElement<any> | undefined;
  let bodyRows: ReactNode[] = [];
  let tbodyProps: TableHTMLAttributes<HTMLTableSectionElement> | undefined;

  childElements.forEach((child) => {
    if (!isValidElement<any>(child)) {
      return;
    }

    if (child.type === "caption") {
      caption = child;
      return;
    }

    if (child.type === "thead") {
      head = child;
      return;
    }

    if (child.type === "tfoot") {
      footer = child;
      return;
    }

    if (child.type === "tbody") {
      const childProps = child.props as { children?: ReactNode };
      const rows = Children.toArray(childProps.children);
      bodyRows.push(...rows);
      if (!tbodyProps) {
        const { children: _tbodyChildren, ...tbodyRest } =
          child.props as TableHTMLAttributes<HTMLTableSectionElement>;
        tbodyProps = { ...tbodyRest };
      }
    }
  });

  if (!bodyRows.length) {
    return null;
  }

  return {
    props: tableProps,
    caption,
    head,
    bodyRows,
    footer,
    tbodyProps,
  };
}

function renderTableSlice(
  descriptor: ParsedTable,
  startRow: number,
  endRow: number,
  showFooter: boolean,
  tablePageIndex?: number,
  tableTotalPages?: number,
) {
  const rows = descriptor.bodyRows.slice(startRow, endRow);

  const renderedRows = rows.map((row, index) => {
    if (isValidElement(row)) {
      return cloneElement(row, {
        key: `row-${startRow + index}`,
      });
    }

    return <Fragment key={`row-${startRow + index}`}>{row}</Fragment>;
  });

  const tbodyProps = descriptor.tbodyProps ?? {};

  const tableContent = (
    <table {...descriptor.props}>
      {cloneSection(descriptor.caption, "caption")}
      {cloneSection(descriptor.head, "thead")}
      <tbody {...tbodyProps}>{renderedRows}</tbody>
      {showFooter && descriptor.footer ? cloneSection(descriptor.footer, "tfoot") : null}
    </table>
  );

  if (tablePageIndex !== undefined && tableTotalPages !== undefined) {
    return (
      <TablePaginationContext.Provider value={{ pageIndex: tablePageIndex, totalPages: tableTotalPages }}>
        {tableContent}
      </TablePaginationContext.Provider>
    );
  }

  return tableContent;
}

function cloneSection(
  element: ReactElement | undefined,
  key: string,
): ReactElement | null {
  if (!element) {
    return null;
  }

  return cloneElement(element, { key });
}

