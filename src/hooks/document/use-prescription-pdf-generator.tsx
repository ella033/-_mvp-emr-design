import { useCallback, useState } from "react";
import type { PrescriptionData } from "@/lib/prescription/buildHtml";
import { DocumentsService } from "@/services/documents-service";
import { createPdfBlobFromHtml } from "@/lib/pdf/client-pdf-generator";

export function usePrescriptionPdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async (
    prescription: PrescriptionData,
    options?: { useFormPaper?: boolean; qrCodeImage?: string; showBackgroundImage?: boolean; debugMode?: boolean }
  ): Promise<Blob | string> => {
    setIsGenerating(true);
    try {
      // 1. Fetch HTML from server
      const html = await DocumentsService.getPrescriptionHtml(prescription, options);

      if (options?.debugMode) {
        return html;
      }

      return await createPdfBlobFromHtml({
        html,
        options: {
          pageSelector: ".A4",
          backgroundColor: "#ffffff",
          pixelRatio: 3,
          quality: 1.0,
        },
      });
    } catch (error) {
      console.error("Client-side PDF generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // HiddenRenderer is no-op since host is created on-demand in generatePdf
  const HiddenRenderer = () => null;

  return { generatePdf, isGenerating, HiddenRenderer };
}
