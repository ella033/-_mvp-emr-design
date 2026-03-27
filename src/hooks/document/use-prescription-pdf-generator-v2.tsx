import { useCallback, useState } from "react";
import type { KoreanPrescriptionData, PrescriptionPurposeLabel } from "@/lib/prescription/build-prescription-html-client";
import { buildPrescriptionHtml } from "@/lib/prescription/build-prescription-html-client";

export function usePrescriptionPdfGeneratorV2() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async (
    prescription: KoreanPrescriptionData,
    options?: { useFormPaper?: boolean; qrCodeImage?: string; showBackgroundImage?: boolean; debugMode?: boolean; purposeLabel?: PrescriptionPurposeLabel }
  ): Promise<string> => {
    setIsGenerating(true);
    try {
      // Generate HTML directly on the client
      const html = buildPrescriptionHtml(prescription, {
        useFormPaper: options?.useFormPaper,
        qrCodeImage: options?.qrCodeImage,
        showBackgroundImage: options?.showBackgroundImage,
        purposeLabel: options?.purposeLabel,
      });

      return html;
    } catch (error) {
      console.error("Client-side HTML generation failed (V2):", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const HiddenRenderer = () => null;

  return { generatePdf, isGenerating, HiddenRenderer };
}
