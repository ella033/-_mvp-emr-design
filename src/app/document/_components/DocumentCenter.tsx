'use client';

import { useEffect, useRef, useMemo } from 'react';

import { useDocumentContext } from '../_contexts/DocumentContext';
import { EmptyDocumentContent } from '@/app/document/_templates/EmptyDocument/v1';
import { cn } from '@/lib/utils';
import './DocumentCenter.print.scss';
import { useFormById } from '@/hooks/forms/use-form-by-id';
import { useDownloadFileV2 } from '@/hooks/file/use-download-file-v2';
import { resolveFormComponent } from '../_forms/form-component-registry';
import { FormRenderType, DocumentRenderViewType } from '../_types/document-enums';
import { DocumentFormHost } from './DocumentFormHost';
import { DocumentPdfWithFieldOverlay } from './DocumentPdfWithFieldOverlay';
import { DocumentErrorBoundary } from './DocumentErrorBoundary';

function EmptyStateView() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      data-testid="document-center-empty-state"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20">
          <img
            alt=""
            className="block max-w-none w-full h-full"
            src="/icon/ic_graphic_folder.svg"
          />
        </div>
        <p className="text-[14px] text-[#70737c] text-center leading-[1.25] tracking-[-0.14px]">
          서식을 선택해 주세요
        </p>
      </div>
    </div>
  );
}

export default function DocumentCenter() {
  const {
    selectedFormId,
    selectedFormDetail,
    setSelectedFormDetail,
    renderState,
    setRenderState,
    pdfObjectUrlRef,
    selectedPatient,
    zoomLevel,
    currentPage,
    totalPages,
  } = useDocumentContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // React Query를 사용하여 폼 상세 정보 조회
  const patientId = selectedPatient?.id;
  const hasPatientId = typeof patientId === 'number' && patientId > 0;
  const { data: formDetailData, isLoading: isLoadingFormDetail, isError: isFormDetailError } = useFormById(
    selectedFormId,
    hasPatientId ? patientId : undefined
  );

  // PDF UUID 추출
  const pdfUuid = useMemo(() => {
    if (!formDetailData) return null;
    const isPdfRenderType = formDetailData.renderType === FormRenderType.Pdf;
    if (!isPdfRenderType) return null;
    const uuid = (formDetailData.pdfFileInfo as any)?.uuid;
    return typeof uuid === 'string' && uuid.length > 0 ? uuid : null;
  }, [formDetailData]);

  // React Query를 사용하여 PDF 파일 다운로드
  const { data: pdfDownloadData, isLoading: isLoadingPdf, isError: isPdfError } = useDownloadFileV2(pdfUuid);

  // 폼 상세 정보 로드 완료 시 컨텍스트 업데이트
  useEffect(function syncFormDetailToContext() {
    if (!formDetailData) return;
    setSelectedFormDetail(formDetailData);
  }, [formDetailData, setSelectedFormDetail]);

  // 렌더 상태 업데이트
  useEffect(function updateRenderState() {
    // 폼이 선택되지 않은 경우
    if (selectedFormId === null) {
      setRenderState({ type: DocumentRenderViewType.Idle });
      return;
    }

    // 폼 상세 정보 로딩 중
    if (isLoadingFormDetail) {
      setRenderState({ type: DocumentRenderViewType.Loading });
      return;
    }

    // 폼 상세 정보 로드 에러
    if (isFormDetailError) {
      setRenderState({ type: DocumentRenderViewType.Error, errorMessage: '서식 상세 정보를 불러오지 못했습니다.' });
      return;
    }

    // 폼 상세 정보가 없는 경우
    if (!formDetailData) {
      return;
    }

    const isPdfRenderType = formDetailData.renderType === FormRenderType.Pdf;
    const isComponentRenderType = formDetailData.renderType === FormRenderType.Component;

    // PDF 렌더 타입인 경우
    if (isPdfRenderType) {
      const hasPdfUuid = pdfUuid !== null;
      if (!hasPdfUuid) {
        setRenderState({ type: DocumentRenderViewType.Error, errorMessage: 'PDF 파일 정보가 없습니다.' });
        return;
      }

      // PDF 다운로드 중
      if (isLoadingPdf) {
        setRenderState({ type: DocumentRenderViewType.Loading });
        return;
      }

      // PDF 다운로드 에러
      if (isPdfError) {
        setRenderState({ type: DocumentRenderViewType.Error, errorMessage: 'PDF 파일을 불러오지 못했습니다.' });
        return;
      }

      // PDF objectURL 생성은 별도 useEffect에서 처리
      return;
    }

    // 컴포넌트 렌더 타입인 경우
    if (isComponentRenderType) {
      const componentPath = formDetailData.componentPath as any;
      const hasComponentPath = typeof componentPath === 'string' && componentPath.length > 0;
      if (!hasComponentPath) {
        setRenderState({
          type: DocumentRenderViewType.Error,
          errorMessage: '컴포넌트 경로 정보가 없습니다.',
        });
        return;
      }

      const resolved = resolveFormComponent({
        componentPath,
        version: formDetailData.version,
      });
      if (!resolved) {
        setRenderState({
          type: DocumentRenderViewType.Error,
          errorMessage: `등록되지 않은 서식 컴포넌트입니다: ${componentPath}@${formDetailData.version}`,
        });
        return;
      }

      setRenderState({
        type: DocumentRenderViewType.Component,
        componentKey: `${componentPath}@${formDetailData.version}`,
      });
      return;
    }

    setRenderState({
      type: DocumentRenderViewType.Error,
      errorMessage: '지원하지 않는 renderType 입니다.',
    });
  }, [
    selectedFormId,
    isLoadingFormDetail,
    isFormDetailError,
    formDetailData,
    pdfUuid,
    isLoadingPdf,
    isPdfError,
    pdfDownloadData,
    setRenderState,
    pdfObjectUrlRef,
  ]);

  // PDF 다운로드 완료 시 objectURL 생성 (pdfDownloadData 변경 시에만 실행)
  useEffect(function createPdfObjectUrl() {
    if (!pdfDownloadData) return;

    // 이전 object URL 해제
    if (pdfObjectUrlRef.current) {
      URL.revokeObjectURL(pdfObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(pdfDownloadData.blob);
    pdfObjectUrlRef.current = objectUrl;
    setRenderState({ type: DocumentRenderViewType.Pdf, pdfUrl: objectUrl });
  }, [pdfDownloadData, pdfObjectUrlRef, setRenderState]);

  // PrintableDocument 페이지 가시성을 현재 페이지에 맞춰 조정
  useEffect(function updatePageVisibility() {
    if (totalPages === 0) return;

    const printablePages =
      containerRef.current?.querySelectorAll('.printable-page') ?? [];
    if (printablePages.length > 0) {
      printablePages.forEach((page, index) => {
        const pageElement = page as HTMLElement;
        if (index + 1 === currentPage) {
          pageElement.style.display = 'flex';
        } else {
          pageElement.style.display = 'none';
        }
      });
    }
  }, [currentPage, totalPages]);

  useEffect(function cleanupPdfObjectUrlOnUnmount() {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
    };
  }, [pdfObjectUrlRef]);

  function renderSelectedDocument() {
    if (selectedFormId !== null) {
      if (renderState.type === DocumentRenderViewType.Loading) {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[14px] text-[#70737c]">서식 로딩 중...</p>
          </div>
        );
      }

      if (renderState.type === DocumentRenderViewType.Error) {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[14px] text-[#70737c]">{renderState.errorMessage}</p>
          </div>
        );
      }

      if (renderState.type === DocumentRenderViewType.Pdf) {
        const detail = selectedFormDetail;
        const fields = detail?.fields ?? [];
        const isEditable = Boolean(detail?.isEditable);

        return (
          <DocumentPdfWithFieldOverlay
            pdfUrl={renderState.pdfUrl}
            fields={fields}
            isEditable={isEditable}
          />
        );
      }

      if (renderState.type === DocumentRenderViewType.Component) {
        const detail = selectedFormDetail;
        const componentPath = detail ? (detail.componentPath as any) : null;
        const hasComponentPath = typeof componentPath === 'string' && componentPath.length > 0;
        const Component = hasComponentPath && detail
          ? resolveFormComponent({ componentPath, version: detail.version })
          : null;

        if (!Component) {
          return <EmptyDocumentContent />;
        }

        return (
          <DocumentErrorBoundary>
            <Component />
          </DocumentErrorBoundary>
        );
      }
    }

    return <EmptyStateView />;
  }

  return (
    <>
      <div
        className="w-full h-full flex flex-col rounded-[6px] border border-[#DBDCDF]"
        style={{ minWidth: '400px' }}
      >
        <div className="flex-1 overflow-auto bg-white border-gray-300" ref={containerRef}>
          <div
            className={cn('h-full p-6', selectedFormId === null && 'flex justify-center items-center')}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              width: `${100 / (zoomLevel / 100)}%`,
              minHeight: `${100 / (zoomLevel / 100)}%`,
            }}
          >
            <DocumentFormHost>
              {renderSelectedDocument()}
            </DocumentFormHost>
          </div>
        </div>
      </div>
    </>
  );
}
