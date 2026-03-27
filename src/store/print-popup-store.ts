import { create } from "zustand";
import { OutputTypeCode } from "@/types/printer-types";
import type { ReactNode } from "react";
import type { components } from "@/generated/api/types";

type FormFieldDto = components["schemas"]["FormFieldDto"];

export type RenderContentResult = {
  content: ReactNode;
  pageSelector?: string;
};

export interface PrintPopupConfig {
  title: string;
  outputTypeCode: OutputTypeCode;
  fileNamePrefix: string;
  defaultCopies?: number;

  initialPdfOptions?: unknown;
  /** 출력 모드: 'pdf' (기존 래스터 PDF) | 'html' (신규 벡터 HTML). 기본값 'pdf' */
  outputMode?: 'html' | 'pdf';
}

export type PrintPopupAction = "download" | "print";

export type PdfStampData = {
  fields: FormFieldDto[];
  values: Record<string, unknown>;
};

export type PrintPopupBeforeActionResult = {
  shouldRegeneratePdf?: boolean;
  pdfStamp?: PdfStampData;
};

export type PrintPopupContext = {
  action: PrintPopupAction;
  copies: number;
  printerId: string | null;
  pdfOptions: unknown;
};

interface PrintPopupState {
  isOpen: boolean;
  config: PrintPopupConfig;
  generatePdf: ((options?: unknown) => Promise<Blob | string>) | null;
  renderContent: (() => Promise<RenderContentResult>) | null;
  beforeAction:
    | ((context: PrintPopupContext) => Promise<PrintPopupBeforeActionResult | void>)
    | null;
  onDownload: ((context: PrintPopupContext & { resolvedPdfUrl: string }) => Promise<void>) | null;
  onPrint: ((context: PrintPopupContext & { resolvedPdfUrl: string }) => Promise<void>) | null;
  onPrintAndSend:
    | ((context: PrintPopupContext & { resolvedPdfUrl: string }) => Promise<void>)
    | null;
  onClose: (() => void) | null;
  onPrintComplete: (() => void) | null;
  renderPdfOptionsControls:
    | ((params: {
        pdfOptions: unknown;
        setPdfOptions: (next: unknown) => void;
        requestReload: () => void;
      }) => ReactNode)
    | null;
  extraRenderers: ReactNode | null;

  // Actions
  openPrintPopup: (params: {
    config: PrintPopupConfig;
    generatePdf?: (options?: unknown) => Promise<Blob | string>;
    renderContent?: () => Promise<RenderContentResult>;
    beforeAction?: (context: PrintPopupContext) => Promise<PrintPopupBeforeActionResult | void>;
    onDownload?: (context: PrintPopupContext & { resolvedPdfUrl: string }) => Promise<void>;
    onPrint?: (context: PrintPopupContext & { resolvedPdfUrl: string }) => Promise<void>;
    onPrintAndSend?: (context: PrintPopupContext & { resolvedPdfUrl: string }) => Promise<void>;
    onClose?: () => void;
    onPrintComplete?: () => void;
    renderPdfOptionsControls?: (params: {
      pdfOptions: unknown;
      setPdfOptions: (next: unknown) => void;
      requestReload: () => void;
    }) => ReactNode;
    extraRenderers?: ReactNode;
  }) => void;
  closePrintPopup: () => void;
}

const DEFAULT_CONFIG: PrintPopupConfig = {
  title: "서식출력",
  outputTypeCode: OutputTypeCode.ETC,
  fileNamePrefix: "document",
  defaultCopies: 1,
  initialPdfOptions: null,
};

export const usePrintPopupStore = create<PrintPopupState>((set, get) => ({
  isOpen: false,
  config: DEFAULT_CONFIG,
  generatePdf: null,
  renderContent: null,
  beforeAction: null,
  onDownload: null,
  onPrint: null,
  onPrintAndSend: null,
  onClose: null,
  onPrintComplete: null,
  renderPdfOptionsControls: null,
  extraRenderers: null,

  openPrintPopup: ({
    config,
    generatePdf,
    renderContent,
    beforeAction,
    onDownload,
    onPrint,
    onPrintAndSend,
    onClose,
    onPrintComplete,
    renderPdfOptionsControls,
    extraRenderers,
  }) =>
    set({
      isOpen: true,
      config: { ...DEFAULT_CONFIG, ...config },
      generatePdf: generatePdf ?? null,
      renderContent: renderContent ?? null,
      beforeAction: beforeAction ?? null,
      onDownload: onDownload ?? null,
      onPrint: onPrint ?? null,
      onPrintAndSend: onPrintAndSend ?? null,
      onClose: onClose ?? null,
      onPrintComplete: onPrintComplete ?? null,
      renderPdfOptionsControls: renderPdfOptionsControls ?? null,
      extraRenderers: extraRenderers ?? null,
    }),

  closePrintPopup: () => {
    const { onClose } = get();
    set({
      isOpen: false,
      generatePdf: null,
      renderContent: null,
      beforeAction: null,
      onDownload: null,
      onPrint: null,
      onPrintAndSend: null,
      onClose: null,
      onPrintComplete: null,
      renderPdfOptionsControls: null,
      extraRenderers: null,
    });
    onClose?.();
  },
}));
