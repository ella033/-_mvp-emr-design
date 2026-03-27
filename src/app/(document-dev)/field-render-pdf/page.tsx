'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AddedField } from '@/types/document';

// PdfViewer를 동적 import로 로드 (react-pdf가 서버에서 문제를 일으킬 수 있음)
const PdfViewer = dynamic(
  () => import('../_components/PdfViewer'),
  { ssr: false }
);

interface PDFSize {
  width: number;
  height: number;
  scale: number;
}

function FieldRenderPdfPage() {
  const [fields, setFields] = useState<AddedField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [pdfSize, setPdfSize] = useState<PDFSize | null>(null);

  useEffect(function loadDataFromUrl() {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fieldsParam = urlParams.get('fields');
      const valuesParam = urlParams.get('values');

      if (fieldsParam) {
        const parsedFields: AddedField[] = JSON.parse(decodeURIComponent(fieldsParam));
        setFields(parsedFields);
      }

      if (valuesParam) {
        const parsedValues: Record<string, string> = JSON.parse(decodeURIComponent(valuesParam));
        setFieldValues(parsedValues);
      }
    } catch (error) {
      console.error('[FIELD-RENDER-PDF] Failed to load data:', error);
    }
  }, []);

  const handlePageLoad = (size: PDFSize) => {
    setPdfSize(size);
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="relative">
        {/* PDF 레이어 */}
        <PdfViewer onPageLoad={handlePageLoad} />

        {/* 필드 오버레이 레이어 - 일반 텍스트로 렌더링 */}
        {pdfSize && (
          <div
            className="absolute top-0 left-0"
            style={{ width: pdfSize.width, height: pdfSize.height }}
          >
            {fields.map((field) => {
              const fieldValue = fieldValues[field.key] || '';

              return (
                <div
                  key={field.key}
                  className="absolute"
                  style={{
                    left: `${field.x}px`,
                    top: `${field.y}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    fontSize: `${field.fontSize || 12}px`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 4px',
                  }}
                >
                  <span className="text-black">{fieldValue}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldRenderPdfPage;
