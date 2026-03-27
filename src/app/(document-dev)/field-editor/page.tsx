'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useFieldEditor } from '../_contexts/FieldEditorContext';
import { FieldEditorPreviewPanel } from '../_components/FieldEditorPreviewPanel';

// react-konva를 사용하는 컴포넌트를 동적 import로 로드 (SSR 비활성화)
const FieldOverlay = dynamic(
  () => import("../_components/FieldOverlay"),
  { ssr: false }
);

const PdfViewer = dynamic(
  () => import("../_components/PdfViewer"),
  { ssr: false }
);

interface PDFSize {
  width: number;
  height: number;
  scale: number;
}

function FieldEditorPage() {
  const [pdfSize, setPdfSize] = useState<PDFSize | null>(null);
  const {
    currentPage,
    pdfFile,
    setCurrentPage,
    setNumPages,
    getFieldsByPage,
    updateField,
    isPreviewOpen,
    togglePreview,
    addedFields,
  } = useFieldEditor();

  const handlePageLoad = (size: PDFSize) => {
    setPdfSize(size);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNumPagesChange = (pages: number) => {
    setNumPages(pages);
  };

  // 현재 페이지의 필드만 필터링
  const currentPageFields = getFieldsByPage(currentPage);

  return (
    <div className="w-full h-full flex justify-center-safe items-center-safe">
      {/* 좌: 편집 / 우: 미리보기 (겹치지 않게 나란히) */}
      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          {/* PDF 레이어 */}
          <PdfViewer
            file={pdfFile || undefined}
            currentPage={currentPage}
            onPageLoad={handlePageLoad}
            onPageChange={handlePageChange}
            onNumPagesChange={handleNumPagesChange}
            showNavigation={true}
          />

          {/* Konva 오버레이 레이어 - PDF 크기에 맞춰 동기화 */}
          {pdfSize && (
            <FieldOverlay
              width={pdfSize.width}
              height={pdfSize.height}
              fields={currentPageFields}
              onFieldUpdate={updateField}
            />
          )}
        </div>

        {/* 미리보기는 PDF와 동일 크기(동일 PdfViewer 스케일)로 우측에 표시 */}
        {isPreviewOpen && pdfFile && pdfSize && (
          <FieldEditorPreviewPanel
            pdfFile={pdfFile}
            pdfSize={pdfSize}
            currentPage={currentPage}
            fields={addedFields}
            onClose={togglePreview}
          />
        )}
      </div>
    </div>
  );
}

export default FieldEditorPage;