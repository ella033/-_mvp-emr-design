"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrintersStore } from "@/store/printers-store";
import { useToastHelpers } from "@/components/ui/toast";
import { usePrintPopupStore, type PrintPopupAction, type PrintPopupContext } from "@/store/print-popup-store";
import { serializeDomToSelfContainedHtml } from "@/lib/html/serialize-dom-to-html";
import { useCreatePrintJob } from "@/components/settings/printer/hooks/use-create-print-job";
import { FileService } from "@/services/file-service";
import { stampFieldsOnPdf } from "@/lib/pdf/stamp-pdf-fields";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Shadow DOM 내부를 포함하여 페이지 요소를 DOM 순서대로 탐색한다.
 * PrescriptionHtmlDocument의 .A4 페이지는 Shadow DOM 안에 있어
 * 일반 querySelectorAll로는 찾을 수 없다.
 *
 * DOM 순서 보존: 라이트 DOM 페이지와 Shadow DOM 페이지를
 * 실제 문서 트리 순서에 맞게 인터리빙한다.
 */
function queryAllPages(root: HTMLElement, selector: string): HTMLElement[] {
  // 라이트 DOM 페이지 + Shadow 호스트를 하나의 목록으로 모아 DOM 순서 결정
  const lightPages = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const shadowHosts = Array.from(root.querySelectorAll<HTMLElement>('[data-shadow-pages]'));

  if (shadowHosts.length === 0) return lightPages;

  // 모든 후보(라이트 DOM 페이지 및 Shadow 호스트)를 DOM 순서로 정렬
  const allCandidates: HTMLElement[] = [...lightPages, ...shadowHosts];
  allCandidates.sort((a, b) => {
    const pos = a.compareDocumentPosition(b);
    // eslint-disable-next-line no-bitwise
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    // eslint-disable-next-line no-bitwise
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  // 정렬된 순서로 결과 구성: Shadow 호스트는 내부 페이지로 전개
  const results: HTMLElement[] = [];
  const hostSet = new Set(shadowHosts);
  for (const el of allCandidates) {
    if (hostSet.has(el)) {
      const shadow = el.shadowRoot;
      if (shadow) {
        shadow.querySelectorAll<HTMLElement>(selector).forEach((page) => results.push(page));
      }
    } else {
      results.push(el);
    }
  }

  return results;
}

const SCALE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const getScaleByIndex = (index: number): number =>
  SCALE_OPTIONS[Math.min(Math.max(index, 0), SCALE_OPTIONS.length - 1)] as number;
const DEFAULT_SCALE_INDEX: number =
  SCALE_OPTIONS.findIndex((value) => value === 1) === -1
    ? 0
    : SCALE_OPTIONS.findIndex((value) => value === 1);

export function DocumentPrintPopup() {
  const {
    isOpen,
    config,
    generatePdf,
    renderContent,
    beforeAction,
    onDownload,
    onPrint,
    onPrintAndSend,
    onPrintComplete,
    renderPdfOptionsControls,
    extraRenderers,
    closePrintPopup,
  } = usePrintPopupStore();
  const {
    title,
    outputTypeCode,
    fileNamePrefix,
    defaultCopies = 1,
    initialPdfOptions = null,
    outputMode = 'pdf',
  } = config;

  const isHtmlMode = outputMode === 'html';

  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(DEFAULT_SCALE_INDEX);
  const [copies, setCopies] = useState(defaultCopies);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pdfOptions, setPdfOptions] = useState<unknown>(initialPdfOptions);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const hasRunBeforeActionRef = useRef(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [pageSizeMap, setPageSizeMap] = useState<Record<number, { width: number; height: number }> | null>(null);

  const printers = usePrintersStore((state) => state.printers);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>("");
  const { success: showToastSuccess, error: showToastError } = useToastHelpers();
  const createPrintJobMutation = useCreatePrintJob();

  const [isPdfReady, setIsPdfReady] = useState(false);
  // 모든 페이지 크기를 사전 측정 — 페이지 전환 시 재측정 불필요, 깜빡임 방지
  const [htmlPageSizeMap, setHtmlPageSizeMap] = useState<Record<number, { width: number; height: number }> | null>(null);

  // ── 직접 렌더링 모드 (renderContent) ──
  const [reactContent, setReactContent] = useState<ReactNode>(null);
  const [contentPageSelector, setContentPageSelector] = useState('.printable-page');
  const directRenderRef = useRef<HTMLDivElement>(null);
  const scale: number = getScaleByIndex(scaleIndex);
  const getPageFitWidth = useCallback((pageNum: number): number | undefined => {
    const size = pageSizeMap?.[pageNum];
    if (containerWidth <= 0 || containerHeight <= 0 || !size) return undefined;
    const fitScale = Math.min(containerWidth / size.width, containerHeight / size.height);
    return size.width * fitScale * scale;
  }, [containerWidth, containerHeight, pageSizeMap, scale]);

  // 옵션이 변경되었을 때 PDF를 다시 로드해야 하는지 추적
  const [shouldReload, setShouldReload] = useState(false);

  const loadPdf = useCallback(async (nextPdfOptions?: unknown) => {
    const canLoadPdf = isOpen && Boolean(generatePdf);
    if (!canLoadPdf || !generatePdf) return null;

    setLoading(true);
    setError(null);

    try {
      // 이전에 생성된 URL이 있다면 해제
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setHtmlContent(null);

      const resolvedOptions = nextPdfOptions ?? pdfOptions;
      const result = await generatePdf(resolvedOptions);

      // Blob이면 URL 생성, 문자열이면 (URL or HTML)로 취급
      if (typeof result === "string") {
        const trimmed = result.trim();
        const looksLikeHtml = trimmed.startsWith("<!doctype") || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<");
        if (looksLikeHtml) {
          setHtmlContent(result);
          return null;
        }
        setPdfUrl(result);
        return result;
      }

      const url = URL.createObjectURL(result);
      setPdfUrl(url);
      return url;
    } catch (err) {
      console.error('[PDF-DEBUG] loadPdf 실패:', err);
      if (err instanceof Error) {
        console.error('[PDF-DEBUG] name:', err.name, 'message:', err.message);
        console.error('[PDF-DEBUG] stack:', err.stack);
        if ('cause' in err) console.error('[PDF-DEBUG] cause:', (err as any).cause);
      }
      const message =
        err instanceof Error ? err.message : "문서를 불러오지 못했습니다.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isOpen, generatePdf, pdfOptions]);

  useEffect(function resetViewerState() {
    if (!isOpen) {
      return;
    }

    setIsPdfReady(false);
    setPageNumber(1);
    setScaleIndex(DEFAULT_SCALE_INDEX);
    setNumPages(0);
    setCopies(defaultCopies);
    setIsPrinting(false);
    setShouldReload(false);
    setIsIssuing(false);
    hasRunBeforeActionRef.current = false;
    setPdfOptions(initialPdfOptions);
    setPageSizeMap(null);
    setHtmlContent(null);
    setHtmlPageSizeMap(null);
    setReactContent(null);
    setContentPageSelector('.printable-page');
    setSelectedPrinterId("");

    if (renderContent) {
      // 직접 렌더링 모드: renderContent() 호출 → React 콘텐츠 세팅
      setLoading(true);
      setError(null);
      renderContent()
        .then((result) => {
          // setReactContent와 setLoading을 같은 콜백에서 호출해야
          // React가 배치 처리하여 단일 렌더에서 loading=false + reactContent 세팅됨.
          // 분리하면 loading=true인 중간 렌더에서 directRenderRef가 null이 되어
          // measureDirectRenderPages가 스킵된 후 재실행되지 않는 버그 발생.
          setReactContent(result.content);
          if (result.pageSelector) {
            setContentPageSelector(result.pageSelector);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('[DocumentPrintPopup] renderContent failed:', err);
          const message = err instanceof Error ? err.message : "문서를 불러오지 못했습니다.";
          setError(message);
          setLoading(false);
        });
    } else {
      // 기존 경로: generatePdf로 PDF/HTML 로드
      loadPdf(initialPdfOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultCopies, generatePdf, renderContent, initialPdfOptions]);

  // ── 프린터 매칭: printers 변경 시 별도 처리 (콘텐츠 리셋 없음) ──
  useEffect(function syncMatchedPrinter() {
    if (!isOpen) return;
    const matchedPrinter = printers.find((p) =>
      p.outputTypeCodes?.includes(outputTypeCode)
    );
    setSelectedPrinterId((prev) => prev || (matchedPrinter ? matchedPrinter.id : ""));
  }, [isOpen, printers, outputTypeCode]);

  useEffect(function reloadOnOptionsChange() {
    if (!isOpen || !shouldReload) return;

    setShouldReload(false);
    loadPdf(pdfOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReload, isOpen, pdfOptions]);

  useEffect(function cleanupObjectUrl() {
    return function revokeUrl() {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(function observeContainerSize() {
    const container = viewerContainerRef.current;
    if (!container) return;

    setContainerWidth(container.clientWidth);
    setContainerHeight(container.clientHeight);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    return function cleanup() {
      observer.disconnect();
    };
  }, [isOpen]);

  // ── 직접 렌더링 모드: reactContent 마운트 후 페이지 측정 ──
  // PrintableDocument는 useLayoutEffect + rAF + ResizeObserver로 페이지네이션을 수행하므로
  // 고정 프레임 대기 대신 .printable-page 수가 안정화될 때까지 폴링한다.
  useEffect(function measureDirectRenderPages() {
    if (!reactContent || !directRenderRef.current) return;

    let cancelled = false;

    const measure = async () => {
      await document.fonts.ready;

      // 1프레임 대기 (초기 레이아웃 안정)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (cancelled || !directRenderRef.current) return;

      const el = directRenderRef.current;
      const STABLE_FRAMES = 3;
      const TIMEOUT_MS = 8_000;
      const start = performance.now();
      let lastCount = -1;
      let stableCount = 0;

      // .printable-page가 1개 이상이고 N프레임 연속 동일하면 안정화 완료
      await new Promise<void>((resolve) => {
        function tick() {
          if (cancelled || !directRenderRef.current) { resolve(); return; }
          if (performance.now() - start > TIMEOUT_MS) { resolve(); return; }

          const pages = queryAllPages(el, contentPageSelector);
          const count = pages.length;

          if (count > 0 && count === lastCount) {
            stableCount += 1;
          } else {
            stableCount = 0;
          }
          lastCount = count;

          if (stableCount >= STABLE_FRAMES) {
            resolve();
            return;
          }

          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });

      if (cancelled || !directRenderRef.current) return;

      const pages = queryAllPages(el, contentPageSelector);
      const pageCount = pages.length || 1;
      setNumPages(pageCount);
      setIsPdfReady(true);

      // 측정 전 모든 페이지를 표시 (showCurrentHtmlPage useLayoutEffect가
      // 이미 non-first 페이지를 display:none으로 만들었을 수 있음)
      pages.forEach((page) => {
        page.style.display = '';
      });

      // 모든 페이지 크기 사전 측정
      const sizeMap: Record<number, { width: number; height: number }> = {};
      pages.forEach((page, i) => {
        sizeMap[i + 1] = { width: page.offsetWidth, height: page.offsetHeight };
      });
      setHtmlPageSizeMap(sizeMap);

      // 첫 페이지만 표시
      pages.forEach((page, i) => {
        page.style.display = i === 0 ? '' : 'none';
      });
    };

    measure();

    return () => { cancelled = true; };
  }, [reactContent, contentPageSelector]);

  // ── HTML 모드: iframe 로드 시 페이지 수 감지 + 모든 페이지 크기 사전 측정 ──
  const handleIframeLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // 미리보기용 body 스타일 오버라이드: 배경 투명 + 여백 제거
    const overrideStyle = doc.createElement('style');
    overrideStyle.textContent = `
      body { background: transparent !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
    `;
    doc.head.appendChild(overrideStyle);

    const pages = doc.querySelectorAll('.printable-page, .A4');
    setNumPages(pages.length || 1);
    setIsPdfReady(true);

    // 모든 페이지 크기를 한 번에 측정 (display:none이면 0이므로 숨기기 전에 측정)
    const sizeMap: Record<number, { width: number; height: number }> = {};
    pages.forEach((page, i) => {
      const el = page as HTMLElement;
      sizeMap[i + 1] = { width: el.offsetWidth, height: el.offsetHeight };
    });
    setHtmlPageSizeMap(sizeMap);

    // 첫 페이지만 표시
    pages.forEach((page, i) => {
      (page as HTMLElement).style.display = i === 0 ? '' : 'none';
    });
  }, []);

  // ── HTML 모드: pageNumber 변경 시 해당 페이지만 표시 ──
  // useLayoutEffect: 브라우저 페인트 전에 실행하여 이전 페이지가 잠깐 보이는 깜빡임 방지
  useLayoutEffect(function showCurrentHtmlPage() {
    if (!isHtmlMode) return;

    // 직접 렌더링 또는 iframe에서 페이지 요소 탐색
    let pages: HTMLElement[] | null = null;
    if (reactContent && directRenderRef.current) {
      pages = queryAllPages(directRenderRef.current, contentPageSelector);
    } else if (htmlContent) {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        pages = Array.from(doc.querySelectorAll<HTMLElement>('.printable-page, .A4'));
      }
    }

    if (!pages || pages.length === 0) return;

    const targetIndex = pageNumber - 1;
    pages.forEach((page, i) => {
      page.style.display = i === targetIndex ? '' : 'none';
    });
  }, [pageNumber, isHtmlMode, htmlContent, reactContent, contentPageSelector]);

  const canNavigatePdf = useMemo(
    () => Boolean(pdfUrl) && !loading && isPdfReady && numPages > 0,
    [pdfUrl, loading, isPdfReady, numPages]
  );
  const canNavigateHtml = isHtmlMode && (Boolean(htmlContent) || Boolean(reactContent)) && !loading && numPages > 0;
  const canNavigate = isHtmlMode ? canNavigateHtml : canNavigatePdf;

  const hasPdfPages = numPages > 0;
  const isAfterLastPage = hasPdfPages && pageNumber >= numPages;
  const isPrevDisabled = !canNavigate || pageNumber <= 1;
  const isNextDisabled = !canNavigate || isAfterLastPage;

  const hasContent = isHtmlMode ? (Boolean(htmlContent) || Boolean(reactContent)) : Boolean(pdfUrl);
  const hasSelectedPrinter = Boolean(selectedPrinterId);
  const shouldDisablePrintByPrinter = !hasSelectedPrinter;
  const isPrintDisabled =
    !hasContent || loading || isIssuing || isPrinting || shouldDisablePrintByPrinter;
  const isDownloadDisabled =
    !hasContent || loading || isIssuing || isPrinting;

  const zoomOptions = SCALE_OPTIONS.map((value) => ({
    value,
    label: `${Math.round(value * 100)}%`,
  }));

  const handleDocumentLoadSuccess = function handleDocumentLoadSuccess(
    pdf: { numPages: number; getPage(n: number): Promise<{ getViewport(p: { scale: number }): { width: number; height: number } }> },
  ) {
    setNumPages(pdf.numPages);
    setIsPdfReady(true);
    setPageNumber((prev) => {
      const next = Math.min(Math.max(prev, 1), pdf.numPages || 1);
      return next;
    });

    const pagePromises = Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1).then((page) => {
        const viewport = page.getViewport({ scale: 1 });
        return { pageNum: i + 1, width: viewport.width, height: viewport.height };
      }),
    );
    Promise.all(pagePromises).then((pages) => {
      const sizeMap: Record<number, { width: number; height: number }> = {};
      for (const p of pages) {
        sizeMap[p.pageNum] = { width: p.width, height: p.height };
      }
      setPageSizeMap(sizeMap);
    }).catch(() => {});
  };

  const buildContext = useCallback(
    (action: PrintPopupAction): PrintPopupContext => ({
      action,
      copies,
      printerId: selectedPrinterId || null,
      pdfOptions,
    }),
    [copies, pdfOptions, selectedPrinterId]
  );

  const preparePdfForAction = useCallback(
    async (action: PrintPopupAction) => {
      const hasBeforeAction = typeof beforeAction === "function";
      const shouldRunBeforeAction = hasBeforeAction && !hasRunBeforeActionRef.current;
      if (!shouldRunBeforeAction) {
        return pdfUrl;
      }

      setIsIssuing(true);
      try {
        const context = buildContext(action);
        const result = await beforeAction(context);
        hasRunBeforeActionRef.current = true;

        if (result?.pdfStamp && pdfUrl) {
          const res = await fetch(pdfUrl);
          const pdfBytes = await res.arrayBuffer();
          const stamped = await stampFieldsOnPdf({
            pdfBytes,
            fields: result.pdfStamp.fields,
            values: result.pdfStamp.values,
          });
          const newUrl = URL.createObjectURL(stamped);
          setPdfUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return newUrl;
          });
          return newUrl;
        }

        const shouldRegeneratePdf = Boolean(result && result.shouldRegeneratePdf);
        if (!shouldRegeneratePdf) {
          return pdfUrl;
        }

        const reloadedUrl = await loadPdf(pdfOptions);
        const hasReloadedUrl = typeof reloadedUrl === "string" && reloadedUrl.length > 0;
        if (!hasReloadedUrl) {
          showToastError("PDF를 다시 생성하지 못했습니다. 다시 시도해주세요.");
          return null;
        }
        return reloadedUrl;
      } catch (err) {
        console.error("[DocumentPrintPopup] beforeAction failed", err);
        showToastError("처리에 실패했습니다. 다시 시도해주세요.");
        return null;
      } finally {
        setIsIssuing(false);
      }
    },
    [beforeAction, buildContext, loadPdf, pdfOptions, pdfUrl, showToastError]
  );

  // ── HTML 모드: beforeAction 실행 + HTML 재생성 ──
  // PDF 모드의 preparePdfForAction에 대응하는 HTML 모드 전용 함수.
  // beforeAction(발급 처리 등) 실행 후, shouldRegeneratePdf이면
  // React 리렌더를 기다린 뒤 generatePdf를 다시 호출하여 최신 DOM을 캡처한 HTML을 반환.
  const prepareHtmlForAction = useCallback(
    async (action: PrintPopupAction): Promise<string | null> => {
      const hasBeforeAction = typeof beforeAction === "function";
      const shouldRunBeforeAction = hasBeforeAction && !hasRunBeforeActionRef.current;
      let regeneratedHtml: string | null = null;

      if (shouldRunBeforeAction) {
        setIsIssuing(true);
        try {
          const context = buildContext(action);
          const result = await beforeAction(context);
          hasRunBeforeActionRef.current = true;

          if (result?.shouldRegeneratePdf && generatePdf) {
            // React 리렌더 대기 (setLoadedIssuance → initialFormData 재계산 → form reset)
            await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
            await new Promise((r) => setTimeout(r, 150));

            const regenerated = await generatePdf(pdfOptions);
            if (typeof regenerated === "string") {
              // 미리보기(iframe)는 업데이트하지 않음 — srcDoc 교체 시 iframe이
              // 완전히 리로드되어 모든 페이지/배경/마진이 순간 보이는 깜빡임 발생.
              // 출력/다운로드에는 반환된 HTML만 사용하고, 출력 후 팝업은 닫힘.
              regeneratedHtml = regenerated;
            }
          }
        } catch (err) {
          console.error("[DocumentPrintPopup] beforeAction failed", err);
          showToastError("처리에 실패했습니다. 다시 시도해주세요.");
          return null;
        } finally {
          setIsIssuing(false);
        }
      }

      // 재생성된 HTML이 있으면 사용, 없으면 기존 콘텐츠 사용
      if (regeneratedHtml) return regeneratedHtml;
      return htmlContent;
    },
    [beforeAction, buildContext, generatePdf, htmlContent, pdfOptions, showToastError]
  );

  // ── 직접 렌더링 콘텐츠 → self-contained HTML 직렬화 ──
  const serializeDirectContent = useCallback(async (): Promise<string> => {
    const el = directRenderRef.current;
    if (!el) throw new Error('직접 렌더링 컨테이너를 찾을 수 없습니다.');

    // Shadow DOM 호스트를 라이트 DOM에 풀어놓기 (직렬화 전)
    // cloneNode는 shadow root를 복사하지 않으므로, shadow 내용을 라이트 DOM으로 이동해야 한다.
    const shadowHosts = el.querySelectorAll<HTMLElement>('[data-shadow-pages]');
    const restoreFns: (() => void)[] = [];
    shadowHosts.forEach((host) => {
      const shadow = host.shadowRoot;
      if (!shadow) return;
      // shadow 내용을 호스트의 innerHTML로 복사
      const originalInner = host.innerHTML;
      host.innerHTML = shadow.innerHTML;
      restoreFns.push(() => { host.innerHTML = originalInner; });
    });

    // 모든 페이지를 보이게 한 후 직렬화
    const pages = queryAllPages(el, contentPageSelector);
    const prevDisplays: string[] = [];
    pages.forEach((page, i) => {
      prevDisplays[i] = page.style.display;
      page.style.display = '';
    });

    try {
      return await serializeDomToSelfContainedHtml({
        root: el,
        pageSelector: contentPageSelector,
        mode: 'preview',
      });
    } finally {
      // 가시성 복원
      pages.forEach((page, i) => {
        page.style.display = prevDisplays[i] ?? '';
      });
      // Shadow DOM 복원
      restoreFns.forEach((fn) => fn());
    }
  }, [contentPageSelector]);

  // ── 다운로드 ──
  const handleDownload = async () => {
    if (isHtmlMode && reactContent) {
      // 직접 렌더링 모드: DOM → HTML 직렬화 후 다운로드
      try {
        const html = await serializeDirectContent();
        const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${fileNamePrefix}.html`;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('[DocumentPrintPopup] serializeDirectContent failed:', err);
        showToastError("HTML 직렬화에 실패했습니다.");
      }
      return;
    }
    if (isHtmlMode && htmlContent) {
      // iframe 모드: beforeAction 실행 후 HTML 다운로드
      const resolvedHtml = await prepareHtmlForAction("download");
      if (!resolvedHtml) return;

      if (typeof onDownload === "function") {
        await onDownload({ ...buildContext("download"), resolvedPdfUrl: "" });
        return;
      }

      const blob = new Blob([resolvedHtml], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileNamePrefix}.html`;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    const resolvedPdfUrl = await preparePdfForAction("download");
    const hasResolvedPdfUrl = typeof resolvedPdfUrl === "string" && resolvedPdfUrl.length > 0;
    if (!hasResolvedPdfUrl) return;

    if (typeof onDownload === "function") {
      await onDownload({ ...buildContext("download"), resolvedPdfUrl });
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = resolvedPdfUrl;
    anchor.download = `${fileNamePrefix}.pdf`;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    anchor.click();
  };

  // ── 출력 (Print) ──
  const handlePrintClick = async () => {
    if (isHtmlMode && (reactContent || htmlContent)) {
      await handleHtmlPrint();
      return;
    }

    const resolvedPdfUrl = await preparePdfForAction("print");
    const hasResolvedPdfUrl = typeof resolvedPdfUrl === "string" && resolvedPdfUrl.length > 0;
    if (!hasResolvedPdfUrl) return;
    if (typeof onPrint === "function") {
      await onPrint({ ...buildContext("print"), resolvedPdfUrl });
      return;
    }

    await handlePrinterPrint(resolvedPdfUrl);
  };

  const handlePrintAndSendClick = async () => {
    if (isHtmlMode && (reactContent || htmlContent)) {
      await handleHtmlPrint();
      if (typeof onPrintAndSend === "function") {
        // HTML 모드에서는 resolvedPdfUrl이 없으므로 빈 문자열 전달
        await onPrintAndSend({ ...buildContext("print"), resolvedPdfUrl: "" });
      }
      return;
    }

    const resolvedPdfUrl = await preparePdfForAction("print");
    const hasResolvedPdfUrl = typeof resolvedPdfUrl === "string" && resolvedPdfUrl.length > 0;
    if (!hasResolvedPdfUrl) return;

    await handlePrinterPrint(resolvedPdfUrl);

    if (typeof onPrintAndSend === "function") {
      await onPrintAndSend({ ...buildContext("print"), resolvedPdfUrl });
    }
  };

  // ── HTML 출력: beforeAction 실행 + HTML을 서버에 업로드 후 프린트 작업 생성 ──
  const handleHtmlPrint = async () => {
    // 직접 렌더링 또는 iframe 모드에서 HTML 콘텐츠 확보
    let resolvedHtml: string | null = null;
    if (reactContent) {
      try {
        resolvedHtml = await serializeDirectContent();
      } catch (err) {
        console.error('[DocumentPrintPopup] serializeDirectContent failed:', err);
        showToastError("HTML 직렬화에 실패했습니다.");
        return;
      }
    } else {
      // iframe 모드: beforeAction 실행 후 HTML 확보 (발급번호 등 반영)
      resolvedHtml = await prepareHtmlForAction("print");
    }
    if (!resolvedHtml) return;

    const canDefaultPrint = Boolean(outputTypeCode);
    if (!canDefaultPrint) {
      showToastError("출력 타입이 설정되지 않았습니다.");
      return;
    }

    setIsPrinting(true);

    try {
      const htmlBlob = new Blob([resolvedHtml], { type: 'text/html; charset=utf-8' });
      const fileName = `${fileNamePrefix}-${Date.now()}.html`;
      const file = new File([htmlBlob], fileName, { type: 'text/html' });

      const uploadResult = await FileService.uploadFileV2({
        file,
        category: "patient_document",
        entityType: "patient",
        description: "document print (html)",
      });

      const selectedPrinter = printers.find((p) => p.id === selectedPrinterId);
      const agents = selectedPrinter?.agents ?? [];
      const targetAgentId = agents.length === 1 ? agents[0] : undefined;

      await createPrintJobMutation.mutateAsync({
        printerId: selectedPrinterId,
        payload: {
          outputTypeCode,
          contentType: "text/html",
          fileName,
          contentUrl: uploadResult.storagePath,
          copies,
          options: {
            paperSize: "A4",
          },
          ...(targetAgentId ? { targetAgentId } : {}),
        },
      });

      showToastSuccess("출력 작업이 생성되었습니다.");
      onPrintComplete?.();
      closePrintPopup();
    } catch (err) {
      console.error("[DocumentPrintPopup] HTML print failed", err);
      showToastError("출력 요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrinterPrint = async (resolvedPdfUrl: string) => {
    const canDefaultPrint = Boolean(outputTypeCode);
    if (!canDefaultPrint) {
      showToastError("출력 타입이 설정되지 않았습니다.");
      return;
    }

    setIsPrinting(true);

    try {
      const pdfResponse = await fetch(resolvedPdfUrl, {
        credentials: "include",
      });

      if (!pdfResponse.ok) {
        throw new Error("PDF를 불러오지 못했습니다.");
      }

      const pdfBlob = await pdfResponse.blob();

      const fileName = `${fileNamePrefix}-${Date.now()}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      const uploadResult = await FileService.uploadFileV2({
        file: pdfFile,
        category: "patient_document",
        entityType: "patient",
        description: "document print",
      });

      const selectedPrinter = printers.find((p) => p.id === selectedPrinterId);
      const agents = selectedPrinter?.agents ?? [];
      const targetAgentId = agents.length === 1 ? agents[0] : undefined;

      await createPrintJobMutation.mutateAsync({
        printerId: selectedPrinterId,
        payload: {
          outputTypeCode,
          contentType: "application/pdf",
          fileName,
          contentUrl: uploadResult.storagePath,
          copies,
          options: {
            paperSize: "A4",
          },
          ...(targetAgentId ? { targetAgentId } : {}),
        },
      });

      showToastSuccess("출력 작업이 생성되었습니다.");
      onPrintComplete?.();
      closePrintPopup();
    } catch (err) {
      console.error("[DocumentPrintPopup] Printer print failed", err);
      showToastError("출력 요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePageChange = (delta: number) => {
    if (!canNavigate) return;
    const nextPage = Math.min(Math.max(pageNumber + delta, 1), numPages);
    setPageNumber(nextPage);
  };

  const handleZoomSelect = (value: number) => {
    const nearestIndex = SCALE_OPTIONS.reduce((closestIndex, option, index) => {
      const closestDiff = Math.abs(SCALE_OPTIONS[closestIndex]! - value);
      const candidateDiff = Math.abs(option - value);
      return candidateDiff < closestDiff ? index : closestIndex;
    }, 0);

    setScaleIndex(nearestIndex);
  };

  const handleCopiesChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const sanitized = Math.min(Math.max(parsed, 1), 99);
    setCopies(sanitized);
  };

  const renderViewer = () => {
    if (loading) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c2c4c8] border-t-[var(--main-color)]" />
          <div className="text-[var(--gray-500)]">{isHtmlMode ? "미리보기 준비 중..." : "PDF 생성 중..."}</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm">
          <div className="text-[var(--gray-500)]">{error}</div>
          <MyButton size="sm" variant="outline" onClick={() => loadPdf()}>
            다시 시도
          </MyButton>
        </div>
      );
    }

    // HTML 모드 직접 렌더링: React 컴포넌트를 직접 뷰어에 렌더링
    if (isHtmlMode && reactContent) {
      const currentPageSize = htmlPageSizeMap?.[pageNumber] ?? null;
      const hasValidPageSize = currentPageSize != null && currentPageSize.width > 0 && currentPageSize.height > 0;
      const naturalW = hasValidPageSize ? currentPageSize.width : containerWidth;
      const naturalH = hasValidPageSize ? currentPageSize.height : containerHeight;

      const htmlFitScale = (hasValidPageSize && containerWidth > 0 && containerHeight > 0)
        ? Math.min(containerWidth / naturalW, containerHeight / naturalH)
        : 1;
      const effectiveScale = htmlFitScale * scale;

      const visualW = Math.floor(naturalW * effectiveScale) || 0;
      const visualH = Math.floor(naturalH * effectiveScale) || 0;

      return (
        <div style={{
          width: visualW,
          height: visualH,
          overflow: 'hidden',
          margin: '0 auto',
          opacity: hasValidPageSize ? 1 : 0,
        }}>
          <div style={{
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top left',
            width: naturalW || undefined,
            height: naturalH || undefined,
            overflow: 'hidden',
          }}>
            <div
              ref={directRenderRef}
              style={{
                width: '210mm',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {reactContent}
            </div>
          </div>
        </div>
      );
    }

    // HTML 모드 iframe: iframe 뷰어 (한 페이지씩 표시, PDF와 동일한 fitScale 적용)
    // size wrapper 패턴: 외부 div에 변환 후 시각적 크기를 명시하여 부모 스크롤을 제어
    if (isHtmlMode && htmlContent) {
      // 사전 측정된 맵에서 현재 페이지 크기 조회 (페이지 전환 시 재측정 불필요)
      const currentPageSize = htmlPageSizeMap?.[pageNumber] ?? null;
      const naturalW = currentPageSize?.width ?? containerWidth;
      const naturalH = currentPageSize?.height ?? containerHeight;

      // fitScale: 100% 줌 시 컨테이너에 딱 맞게 피팅
      const htmlFitScale = (currentPageSize && containerWidth > 0 && containerHeight > 0)
        ? Math.min(containerWidth / naturalW, containerHeight / naturalH)
        : 1;
      const effectiveScale = htmlFitScale * scale;

      // Math.floor: 부동소수점 반올림으로 컨테이너를 1px 초과하는 것 방지 → 스크롤바 제거
      const visualW = Math.floor(naturalW * effectiveScale);
      const visualH = Math.floor(naturalH * effectiveScale);

      return (
        <div style={{
          width: visualW,
          height: visualH,
          overflow: 'hidden',
          margin: '0 auto',
          // 초기 로드 시 페이지 크기 측정 전까지 숨김 (깜빡임 방지)
          opacity: currentPageSize ? 1 : 0,
        }}>
          <div style={{
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top left',
            width: naturalW,
            height: naturalH,
          }}>
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              style={{ width: naturalW, height: naturalH, border: 'none', display: 'block' }}
              sandbox="allow-same-origin"
              onLoad={handleIframeLoad}
              title="HTML 미리보기"
            />
          </div>
        </div>
      );
    }

    // 하위호환: outputMode가 'pdf'이지만 generatePdf가 HTML string을 반환한 경우 (debugHtml 역할)
    if (htmlContent) {
      return (
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full bg-white border-none"
          title="Debug View"
        />
      );
    }

    if (!pdfUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--gray-500)]">
          표시할 문서가 없습니다.
        </div>
      );
    }

    const adjacentPages = [pageNumber - 1, pageNumber, pageNumber + 1].filter(
      (p) => p >= 1 && p <= numPages,
    );

    return (
      <Document
        file={pdfUrl}
        loading={<></>}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={(pdfError) => console.error("[PDF] load error", pdfError)}
        error={
          <div className="text-sm text-[var(--danger-color,#dc2626)]">
            문서를 불러오지 못했습니다.
          </div>
        }
      >
        {adjacentPages.map((p) => (
          <div
            key={p}
            style={p !== pageNumber ? { position: "absolute", left: -9999, visibility: "hidden", pointerEvents: "none" } : undefined}
          >
            <Page
              pageNumber={p}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              canvasBackground="#f4f4f5"
              className="flex justify-center"
              loading={<></>}
              width={getPageFitWidth(p)}
              devicePixelRatio={Math.min(window.devicePixelRatio, 1.5)}
            />
          </div>
        ))}
      </Document>
    );
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={closePrintPopup}
      title={title}
      width="1050px"
      height="980px"
      minWidth="900px"
      minHeight="700px"
      closeOnOutsideClick={false}
      fitContent={false}
      localStorageKey="document-print-popup"
    >
      <div className="flex h-full w-full flex-col gap-2 bg-[var(--background-base,#f4f4f5)]">
        <div className="flex items-center justify-between bg-[#fbfaff] px-[16px] py-[6px] border-b border-t border-[#dbdcdf]">
          <div className="flex flex-1 items-center gap-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[8px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white border border-[#c2c4c8] rounded-[4px] p-[8px] min-w-[20px] h-auto hover:bg-gray-50"
                  onClick={() => handlePageChange(-1)}
                  disabled={isPrevDisabled}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center justify-center rounded-lg min-w-[32px] h-[32px] px-[4px] shrink-0">
                  <span className="text-[14px] text-[#292a2d] text-center leading-[1.25] tracking-[-0.14px] whitespace-nowrap">
                    {numPages > 0 ? `${pageNumber} / ${numPages}` : "0 / 0"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white border border-[#c2c4c8] rounded-[4px] p-[8px] min-w-[20px] h-auto hover:bg-gray-50"
                  onClick={() => handlePageChange(1)}
                  disabled={isNextDisabled}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={String(scaleIndex)}
                onValueChange={(value) =>
                  handleZoomSelect(getScaleByIndex(Number(value)))
                }
                disabled={loading || !hasContent}
              >
                <SelectTrigger size="sm" className="!h-[32px] w-[80px] bg-white px-[8px] text-[13px] text-[#171719] [&_svg]:text-[#46474C] [&_svg]:opacity-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zoomOptions.map((option, index) => (
                    <SelectItem key={option.value} value={String(index)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-[12px]">
              {renderPdfOptionsControls?.({
                pdfOptions,
                setPdfOptions,
                requestReload: () => setShouldReload(true),
              }) ?? null}

              <div className="relative w-[71px]">
                <input
                  type="number"
                  min={1}
                  value={copies}
                  onChange={(event) => handleCopiesChange(event.target.value)}
                  className="h-[32px] w-full rounded-[6px] border border-[#c2c4c8] bg-white px-[8px] text-[13px] placeholder:text-[#989ba2]"
                  placeholder="수량"
                />
              </div>

              <Select
                value={selectedPrinterId || undefined}
                onValueChange={setSelectedPrinterId}
              >
                <SelectTrigger size="sm" className="!h-[32px] w-[140px] bg-white px-[8px] text-[13px] placeholder:text-[#989ba2] [&_svg]:text-[#46474C] [&_svg]:opacity-100">
                  <SelectValue placeholder="프린터 선택" />
                </SelectTrigger>
                <SelectContent>
                  {printers.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      프린터 없음
                    </SelectItem>
                  ) : (
                    printers.map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        {printer.displayName || printer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-[8px]">
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloadDisabled}
              onClick={handleDownload}
              className="bg-white border border-[#c2c4c8] px-[16px] py-[8px] rounded-[4px] text-[13px] text-[#171719] font-medium hover:bg-gray-50"
            >
              {isHtmlMode ? "HTML 저장" : "PDF 저장"}
            </Button>
            {typeof onPrintAndSend === "function" && (
              <Button
                size="sm"
                onClick={handlePrintAndSendClick}
                disabled={isPrintDisabled}
                className="bg-[#180f38] text-white px-[16px] p-[8px] rounded-[4px] text-[13px] font-medium hover:bg-[#180f38]/90"
              >
                출력+전송
              </Button>
            )}
            <Button
              size="sm"
              onClick={handlePrintClick}
              disabled={isPrintDisabled}
              className="bg-[#180f38] text-white w-[64px] p-[8px] rounded-[4px] text-[13px] font-medium hover:bg-[#180f38]/90"
            >
              출력
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#F4F4F5] p-3">
          <div
            ref={viewerContainerRef}
            className={`h-full w-full ${isHtmlMode && !isPdfReady ? 'overflow-hidden' : 'overflow-auto'}`}
          >
            {renderViewer()}
          </div>
        </div>
      </div>
      {extraRenderers}
    </MyPopup>
  );
}

export default DocumentPrintPopup;
