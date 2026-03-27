import { PDFDocument } from 'pdf-lib';

export async function createPdfFromImageUrl(imageUrl: string): Promise<Uint8Array> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch template image: ${response.status} ${response.statusText}`);
  }

  const imageBytes = new Uint8Array(await response.arrayBuffer());

  const pdfDoc = await PDFDocument.create();

  const isPng = isLikelyPng(imageBytes);
  const embeddedImage = isPng
    ? await pdfDoc.embedPng(imageBytes)
    : await pdfDoc.embedJpg(imageBytes);

  const pageWidth = embeddedImage.width;
  const pageHeight = embeddedImage.height;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  return await pdfDoc.save();
}

function isLikelyPng(bytes: Uint8Array): boolean {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
  const hasEnoughBytes = bytes.length >= PNG_SIGNATURE.length;
  if (!hasEnoughBytes) return false;

  return PNG_SIGNATURE.every((value, idx) => bytes[idx] === value);
}


