'use client';

import { useDocumentContext } from '../_contexts/DocumentContext';
import type { components } from '@/generated/api/types';
import { PdfWithFieldOverlay } from './shared/PdfWithFieldOverlay';

type FormFieldDto = components['schemas']['FormFieldDto'];

export function DocumentPdfWithFieldOverlay(props: { pdfUrl: string; fields: FormFieldDto[]; isEditable: boolean }) {
  const { pdfUrl, fields, isEditable } = props;
  const { currentPage, setCurrentPage, setTotalPages, formMode, appliedEncounters, lastFocusedFieldRef } =
    useDocumentContext();

  const isViewMode = formMode === 'view';
  const isEditMode = !isViewMode && isEditable;

  return (
    <PdfWithFieldOverlay
      file={pdfUrl}
      fields={fields}
      currentPage={currentPage}
      onPageChangeAction={setCurrentPage}
      onTotalPagesChangeAction={setTotalPages}
      isEditMode={isEditMode}
      showNavigation={false}
      appliedEncounters={appliedEncounters}
      lastFocusedFieldRef={lastFocusedFieldRef}
      scale={3}
    />
  );
}
