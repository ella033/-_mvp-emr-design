'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FIELD_EDITOR_SCALE } from '@/constants/pdf-scale';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfViewerProps {
  file?: File | Uint8Array | string; // string은 URL 지원
  currentPage?: number; // 현재 페이지 (1-indexed, 기본값 1)
  onPageLoad?: (size: { width: number; height: number; scale: number }) => void;
  onPageRender?: () => void;
  onPageChange?: (page: number) => void; // 페이지 변경 콜백
  onNumPagesChange?: (numPages: number) => void; // 전체 페이지 수 변경 콜백
  onLoadingChange?: (isLoading: boolean) => void; // 로딩 상태 변경 콜백
  showNavigation?: boolean; // 페이지 네비게이션 UI 표시 여부 (기본값 true)
  scale?: number; // 렌더링 스케일 (기본값 1.5)
}

function PdfViewer({
  file,
  currentPage = 1,
  onPageLoad,
  onPageRender,
  onPageChange,
  onNumPagesChange,
  onLoadingChange,
  showNavigation = true,
  scale = FIELD_EDITOR_SCALE,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(currentPage);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);
  const lastPageLoadKeyRef = useRef<string | null>(null);
  const lastPageRenderKeyRef = useRef<string | null>(null);

  const pdfFileForViewer = useMemo(() => {
    if (!file) return undefined;

    // string (URL)인 경우 그대로 반환
    if (typeof file === 'string') {
      return file;
    }

    if (file instanceof Uint8Array) {
      return new File([file], 'template.pdf', { type: 'application/pdf' });
    }

    return file;
  }, [file]);

  const fileKey = useMemo(() => {
    if (!file) return "none";
    if (typeof file === 'string') return file;
    if (file instanceof Uint8Array) return `u8:${file.byteLength}`;
    if (file instanceof File) {
      return `file:${file.name}:${file.size}:${file.lastModified}`;
    }
    return "unknown";
  }, [file]);

  // 파일이나 페이지가 변경되면 로딩 상태로 전환
  useEffect(function resetLoadingOnChange() {
    if (isPageLoaded) {
      setIsPageLoaded(false);
    }
    onLoadingChange?.(true);
  }, [pdfFileForViewer, pageNumber]);

  // currentPage prop이 변경되면 내부 state 업데이트
  useEffect(function syncCurrentPage() {
    if (currentPage >= 1 && currentPage <= (numPages || Infinity)) {
      setPageNumber(currentPage);
    }
  }, [currentPage, numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    onNumPagesChange?.(numPages);

    // currentPage가 유효한 범위인지 확인
    if (currentPage >= 1 && currentPage <= numPages) {
      setPageNumber(currentPage);
    } else {
      setPageNumber(1);
      onPageChange?.(1);
    }
  }

  function onPageLoadSuccess(page: any): void {
    const loadedPageNumber = page?.pageNumber ?? pageNumber;
    const loadKey = `${fileKey}|${loadedPageNumber}|${scale}`;
    if (lastPageLoadKeyRef.current === loadKey) {
      return;
    }
    lastPageLoadKeyRef.current = loadKey;

    const viewport = page.getViewport({ scale });
    const size = {
      width: viewport.width,
      height: viewport.height,
      scale,
    };
    onPageLoad?.(size);
  }

  function onPageRenderSuccess(): void {
    const renderKey = `${fileKey}|${pageNumber}|${scale}`;
    if (lastPageRenderKeyRef.current === renderKey) {
      return;
    }
    lastPageRenderKeyRef.current = renderKey;
    onPageRender?.();
    if (!isPageLoaded) {
      setIsPageLoaded(true);
    }
    onLoadingChange?.(false);
  }

  function onDocumentLoadError(error: Error): void {
    console.error('[PDF-ERROR] === PDF Load Error ===');
    console.error('[PDF-ERROR] Error:', error);
    console.error('[PDF-ERROR] Error message:', error.message);
    console.error('[PDF-ERROR] Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
  }

  function goToPrevPage() {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  }

  function goToNextPage() {
    if (numPages && pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  }

  // PDF 파일이 없을 때 빈 상태 표시
  if (!pdfFileForViewer) {
    return (
      <div className="flex items-center justify-center w-[595px] h-[842px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-1">PDF 파일을 선택해주세요</p>
          <p className="text-sm">상단의 "PDF 선택" 버튼을 클릭하여<br />편집할 PDF 파일을 불러오세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div style={{ opacity: isPageLoaded ? 1 : 0, visibility: isPageLoaded ? 'visible' : 'hidden' }}>
        <Document
          file={pdfFileForViewer}
          loading={null}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            onLoadSuccess={onPageLoadSuccess}
            onRenderSuccess={onPageRenderSuccess}
            loading={null}
          />
        </Document>
      </div>

      {/* 페이지 네비게이션 UI */}
      {showNavigation && numPages && numPages > 1 && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border"
          style={{ zIndex: 50 }}
        >
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            이전
          </button>
          <span className="text-sm text-gray-700 px-2">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
