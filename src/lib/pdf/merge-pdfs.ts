import { PDFDocument } from "pdf-lib";

/**
 * 여러 PDF Blob을 하나의 PDF로 병합합니다.
 * 개별 PDF 로드 실패 시 해당 PDF를 건너뛰고 나머지를 병합합니다.
 * @param pdfs 병합할 PDF Blob 배열
 * @returns 병합된 PDF Blob
 */
export async function mergePdfs(pdfs: Blob[]): Promise<Blob> {
  if (pdfs.length === 0) {
    throw new Error("병합할 PDF가 없습니다.");
  }

  // PDF가 1개인 경우 그대로 반환
  if (pdfs.length === 1) {
    return pdfs[0]!;
  }

  const mergedPdf = await PDFDocument.create();
  let successCount = 0;

  for (let i = 0; i < pdfs.length; i++) {
    const pdfBlob = pdfs[i]!;

    try {
      const pdfBytes = await pdfBlob.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const pageIndices = pdf.getPageIndices();
      const pages = await mergedPdf.copyPages(pdf, pageIndices);

      pages.forEach((page) => mergedPdf.addPage(page));
      successCount++;
    } catch (error) {
      console.error(`[MergePdfs] PDF ${i + 1}/${pdfs.length} 로드 실패, 건너뜁니다:`, error);
    }
  }

  if (successCount === 0) {
    throw new Error("모든 PDF 로드에 실패했습니다.");
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: "application/pdf" });
}
