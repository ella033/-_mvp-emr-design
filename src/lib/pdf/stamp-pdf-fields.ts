import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import type { components } from '@/generated/api/types';
import { FIELD_EDITOR_SCALE } from '@/constants/pdf-scale';

type FormFieldDto = components['schemas']['FormFieldDto'];

type FontBundle = {
  regular: any;
  bold: any;
  extraBold: any;
};

let fontBundlePromise: Promise<{ regular: Uint8Array; bold: Uint8Array; extraBold: Uint8Array }> | null = null;

async function loadFontBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`폰트 로드 실패: ${url}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function getFontBundle(doc: PDFDocument): Promise<FontBundle> {
  if (!fontBundlePromise) {
    fontBundlePromise = (async () => {
      const [regularBytes, boldBytes, extraBoldBytes] = await Promise.all([
        loadFontBytes('/fonts/NanumGothic-Regular.ttf'),
        loadFontBytes('/fonts/NanumGothic-Bold.ttf'),
        loadFontBytes('/fonts/NanumGothic-ExtraBold.ttf'),
      ]);

      return {
        regular: regularBytes,
        bold: boldBytes,
        extraBold: extraBoldBytes,
      };
    })();
  }

  const raw = await fontBundlePromise;
  const [regular, bold, extraBold] = await Promise.all([
    doc.embedFont(raw.regular, { subset: true }),
    doc.embedFont(raw.bold, { subset: true }),
    doc.embedFont(raw.extraBold, { subset: true }),
  ]);

  return { regular, bold, extraBold };
}

export function pxToPt(px: number): number {
  return px / FIELD_EDITOR_SCALE;
}

export function resolveFont(fonts: FontBundle, fontWeight: FormFieldDto['fontWeight']) {
  if (fontWeight === 'extra-bold') return fonts.extraBold;
  if (fontWeight === 'bold') return fonts.bold;
  return fonts.regular;
}

export function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function safeTextWidth(font: any, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return 0;
  }
}

export function resolveAlignedX(params: {
  boxX: number;
  boxW: number;
  padX: number;
  textWidth: number;
  align: FormFieldDto['textAlign'];
}): number {
  const { boxX, boxW, padX, textWidth, align } = params;
  if (align === 'center') {
    return boxX + Math.max(0, (boxW - textWidth) / 2);
  }
  if (align === 'right') {
    return boxX + Math.max(0, boxW - padX - textWidth);
  }
  return boxX + padX;
}

export function wrapTextToLines(params: {
  text: string;
  font: any;
  fontSizePt: number;
  maxWidth: number;
}): string[] {
  const { text, font, fontSizePt, maxWidth } = params;
  const rawLines = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const raw of rawLines) {
    const trimmed = raw ?? '';
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const parts = trimmed.split(' ');
    let current = '';

    for (const part of parts) {
      const next = current ? `${current} ${part}` : part;
      if (safeTextWidth(font, next, fontSizePt) <= maxWidth) {
        current = next;
        continue;
      }

      if (current) {
        lines.push(current);
        current = '';
      }

      let buf = '';
      for (const ch of part) {
        const nextBuf = buf + ch;
        if (safeTextWidth(font, nextBuf, fontSizePt) <= maxWidth) {
          buf = nextBuf;
          continue;
        }
        if (buf) lines.push(buf);
        buf = ch;
      }
      if (buf) {
        current = buf;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

/**
 * PDFDocument의 각 페이지에 필드 텍스트를 렌더링한다.
 * pdf-type-vector-print.ts와 stampFieldsOnPdf 모두 이 함수를 공유한다.
 */
export async function renderFieldsOnPdfDoc(params: {
  pdfDoc: PDFDocument;
  fields: FormFieldDto[];
  values: Record<string, unknown>;
  debug?: boolean;
}): Promise<void> {
  const { pdfDoc, fields, values, debug } = params;

  pdfDoc.registerFontkit(fontkit as any);
  const fonts = await getFontBundle(pdfDoc);
  const pages = pdfDoc.getPages();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    if (!page) continue;

    const { height: pageHeightPt } = page.getSize();
    const pageNumber = pageIndex + 1;
    const pageFields = fields.filter((f) => f.pageNumber === pageNumber);

    for (const field of pageFields) {
      const rawValue = values[field.key];
      const text = toDisplayString(rawValue);
      if (!text) continue;

      const font = resolveFont(fonts, field.fontWeight);
      const fontSizePt = pxToPt(field.fontSize);

      const boxX = pxToPt(field.x);
      const boxW = pxToPt(field.width);
      const boxH = pxToPt(field.height);
      const boxTopY = pageHeightPt - pxToPt(field.y);
      const boxBottomY = boxTopY - boxH;

      const paddingXPx = 4;
      const paddingYPx = 2;
      const padX = pxToPt(paddingXPx);
      const padY = pxToPt(paddingYPx);

      const maxTextWidth = Math.max(0, boxW - padX * 2);
      const isTextarea = field.type === 5; // TEXTAREA

      const lines = isTextarea
        ? wrapTextToLines({ text, font, fontSizePt, maxWidth: maxTextWidth })
        : [text.replace(/\r?\n/g, ' ')].slice(0, 1);

      const color = rgb(17 / 255, 24 / 255, 39 / 255); // #111827

      const fieldOptions = field.options as Record<string, unknown> | null | undefined;
      const verticalCenter = isTextarea && fieldOptions?.verticalCenter === true;

      if (!isTextarea) {
        const line = lines[0] ?? '';
        const textWidth = safeTextWidth(font, line, fontSizePt);
        const x = resolveAlignedX({
          boxX,
          boxW,
          padX,
          textWidth,
          align: field.textAlign,
        });

        const y =
          boxBottomY +
          Math.max(0, (boxH - fontSizePt) / 2) +
          fontSizePt * 0.2;

        if (debug) {
          // eslint-disable-next-line no-console
          console.info('[PdfVectorOverlay] drawText', {
            pageNumber,
            key: field.key,
            x,
            y,
            fontSizePt,
            pageHeightPt,
          });
        }

        page.drawText(line, { x, y, size: fontSizePt, font, color });
      } else {
        const lineHeight = fontSizePt * 1.25;
        const totalTextHeight = lines.length * lineHeight;
        let y: number;

        if (verticalCenter) {
          // 수직 중앙 정렬: 텍스트 블록을 박스 중앙에 배치
          const centerOffset = (boxH - totalTextHeight) / 2;
          y = boxTopY - Math.max(padY, centerOffset) - fontSizePt;
        } else {
          y = boxTopY - padY - fontSizePt;
        }

        for (const line of lines) {
          if (y < boxBottomY) break;
          const textWidth = safeTextWidth(font, line, fontSizePt);
          const x = resolveAlignedX({
            boxX,
            boxW,
            padX,
            textWidth,
            align: field.textAlign,
          });
          page.drawText(line, { x, y, size: fontSizePt, font, color });
          y -= lineHeight;
        }
      }
    }
  }
}

/**
 * 기존 PDF blob에 필드 텍스트를 stamp한다.
 * 2차 PDF 생성 없이 발급번호 등을 빠르게 추가할 때 사용.
 */
export async function stampFieldsOnPdf(params: {
  pdfBytes: ArrayBuffer;
  fields: FormFieldDto[];
  values: Record<string, unknown>;
}): Promise<Blob> {
  const { pdfBytes, fields, values } = params;

  const pdfDoc = await PDFDocument.load(pdfBytes);

  if (fields.length > 0) {
    await renderFieldsOnPdfDoc({ pdfDoc, fields, values });
  }

  const out = await pdfDoc.save();
  return new Blob([out], { type: 'application/pdf' });
}
