import type { ReactNode } from "react";

import type { PaperPreset, PaperSize } from "./paper";

export interface PrintableMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type PrintableHeaderRenderer =
  | ReactNode
  | (() => ReactNode | null | undefined);

export type PrintableFooterMode = "flow" | "overlay";

export interface PrintableDocumentProps {
  paper?: PaperPreset | PaperSize;
  margin?: Partial<PrintableMargin>;
  header?: PrintableHeaderRenderer;
  footer?: PrintableHeaderRenderer;
  /**
   * - flow(기본): footer 높이를 측정하여 페이지네이션에 반영하고, body 아래에 레이아웃으로 배치합니다.
   * - overlay: footer를 페이지 하단에 오버레이로 배치하며, 페이지네이션 계산에서 footer 높이를 제외합니다.
   *
   * overlay는 Paged.js처럼 “페이지 분할 후 푸터를 덧붙이는” 출력물과 동일한 동작이 필요할 때 사용합니다.
   */
  footerMode?: PrintableFooterMode;
  gap?: number; // px gap between pages when rendered on screen
  sectionSpacing?: number; // gap between header-content and content-footer in mm
  /**
   * When enabled, pagination measurement will include the actual vertical gap
   * between consecutive top-level children (e.g. margins).
   *
   * This helps prevent visual overflow when layouts rely on CSS margins for spacing.
   */
  includeMargins?: boolean;
  children: ReactNode;
  observeDependencies?: ReadonlyArray<unknown>;
  className?: string;
  onPageCountChange?: (pageCount: number) => void;
}

