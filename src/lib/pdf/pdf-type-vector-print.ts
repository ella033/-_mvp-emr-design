import { PDFDocument } from 'pdf-lib';

import type { components } from '@/generated/api/types';
import { renderFieldsOnPdfDoc } from './stamp-pdf-fields';

type FormFieldDto = components['schemas']['FormFieldDto'];

export async function createPdfTypeVectorOverlayPdfBlob(params: {
  pdfUrl: string;
  fields: FormFieldDto[];
  values: Record<string, unknown>;
  debug?: boolean;
}): Promise<Blob> {
  const { pdfUrl, fields, values, debug } = params;

  const res = await fetch(pdfUrl);
  if (!res.ok) {
    throw new Error('PDF 파일을 불러올 수 없습니다.');
  }
  const pdfBytes = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfBytes);

  await renderFieldsOnPdfDoc({ pdfDoc, fields, values, debug });

  const out = await pdfDoc.save();
  return new Blob([out], { type: 'application/pdf' });
}
