'use client';

import { useState, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';

import type { Encounter } from '@/types/chart/encounter-types';
import type { components } from '@/generated/api/types';
import { FormFieldOverlay, type OverlayLastFocusedFieldRef } from './FormFieldOverlay';
import { FIELD_EDITOR_SCALE } from '@/constants/pdf-scale';

const PdfViewer = dynamic(() => import('@/app/(document-dev)/_components/PdfViewer'), {
  ssr: false,
});

type FormFieldDto = components['schemas']['FormFieldDto'];

interface PdfSize {
  width: number;
  height: number;
  scale: number;
}


export function PdfWithFieldOverlay(props: {
  file: File | Uint8Array | string;
  fields: FormFieldDto[];
  currentPage: number;
  onPageChangeAction: (page: number) => void;
  onTotalPagesChangeAction: (pages: number) => void;
  isEditMode: boolean;
  showNavigation?: boolean;
  appliedEncounters?: Encounter[];
  lastFocusedFieldRef?: OverlayLastFocusedFieldRef;
  stampPlaceholder?: string;
  getImageFallbackSrcAction?: (field: FormFieldDto) => string | undefined;
  preferFallbackImage?: boolean;
  scale?: number;
}) {
  const {
    file,
    fields,
    currentPage,
    onPageChangeAction,
    onTotalPagesChangeAction,
    isEditMode,
    showNavigation = false,
    appliedEncounters,
    lastFocusedFieldRef,
    stampPlaceholder,
    getImageFallbackSrcAction,
    preferFallbackImage,
    scale,
  } = props;

  const [pdfSize, setPdfSize] = useState<PdfSize | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(true);

  const currentPageFields = fields.filter((f) => f.pageNumber === currentPage);

  // file 또는 currentPage 변경 시 즉시 로딩 상태로 전환 (기존 콘텐츠를 먼저 숨김)
  useLayoutEffect(function hideContentOnChange() {
    setIsPdfLoading(true);
  }, [file, currentPage]);

  const handlePageLoad = (size: PdfSize) => {
    setPdfSize(size);
  };

  const handleNumPagesChange = (pages: number) => {
    onTotalPagesChangeAction(pages);
  };

  const handleLoadingChange = (isLoading: boolean) => {
    setIsPdfLoading(isLoading);
  };

  // PDF와 필드 오버레이가 모두 준비되었는지 확인
  const isReady = !isPdfLoading && pdfSize !== null;

  // scale이 기본값(1.5)과 다르면 화면에는 기본 크기로 보이도록 CSS 보정
  const targetScale = scale ?? FIELD_EDITOR_SCALE;
  const scaleRatio = targetScale / FIELD_EDITOR_SCALE;
  const needsScaleCompensation = Math.abs(scaleRatio - 1) > 0.001;

  return (
    <div className="w-full h-full flex justify-center">
      {/* 시각 보정 wrapper — data-client-pdf-root 바깥에서 zoom으로 축소.
          zoom은 layout 단계에서 적용되어 pointer-events 좌표 매핑이 정상 동작.
          내부 overlay도 zoom을 사용하므로 중첩 zoom이 상쇄됨:
          - 필드 border/padding: 1px × zoom(2) × zoom(0.5) = 1px (정상)
          - 캘린더 등 popup: zoom(2) × zoom(0.5) = zoom(1.0) (원본 크기) */}
      <div
        style={needsScaleCompensation ? {
          zoom: 1 / scaleRatio,
        } : undefined}
      >
        {/* 캡처 루트 — 실제 scale로 렌더링됨 */}
        <div className="relative" data-client-pdf-root="true" style={{ backgroundColor: '#ffffff' }}>
          {/* PDF와 필드 오버레이 - 준비 완료 시에만 표시 */}
          <div style={{ opacity: isReady ? 1 : 0, visibility: isReady ? 'visible' : 'hidden' }}>
            <PdfViewer
              file={file}
              currentPage={currentPage}
              scale={scale}
              onPageLoad={handlePageLoad}
              onPageChange={onPageChangeAction}
              onNumPagesChange={handleNumPagesChange}
              onLoadingChange={handleLoadingChange}
              showNavigation={showNavigation}
            />

            {pdfSize && (() => {
              // 필드 좌표는 기본 스케일(1.5) 기준 절대 픽셀값.
              // scale이 다르면 zoom으로 오버레이를 확대하여 PDF canvas에 맞춤.
              // transform: scale()은 중첩 시 pointer-events 좌표 매핑이 깨지지만,
              // zoom은 layout 단계에서 적용되어 좌표 매핑을 정상 처리하며
              // border/padding도 함께 스케일됨.
              const overlayScaleRatio = pdfSize.scale / FIELD_EDITOR_SCALE;
              const needsOverlayZoom = Math.abs(overlayScaleRatio - 1) > 0.001;
              const overlayWidth = needsOverlayZoom ? pdfSize.width / overlayScaleRatio : pdfSize.width;
              const overlayHeight = needsOverlayZoom ? pdfSize.height / overlayScaleRatio : pdfSize.height;

              const overlay = (
                <FormFieldOverlay
                  width={overlayWidth}
                  height={overlayHeight}
                  fields={currentPageFields}
                  allFields={fields}
                  isEditMode={isEditMode}
                  appliedEncounters={appliedEncounters}
                  lastFocusedFieldRef={lastFocusedFieldRef}
                  stampPlaceholder={stampPlaceholder}
                  getImageFallbackSrcAction={getImageFallbackSrcAction}
                  preferFallbackImage={preferFallbackImage}
                />
              );

              if (!needsOverlayZoom) return overlay;

              return (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zoom: overlayScaleRatio,
                  }}
                >
                  {overlay}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
