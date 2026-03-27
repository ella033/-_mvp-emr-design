// 더 이상 사용 안 하는게 확실해지면 제거 예정
import { ApiClient } from "@/lib/api/api-client";
import { documentsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type { PrescriptionData } from "@/lib/prescription/buildHtml";
import type {
  DetailedStatementResponse,
  MedicalRecordApiResponse,
} from "@/types/document";
import type { MedicalBillReceiptResponseDto } from "@/types/receipt/medical-bill-receipt-types";

const DEFAULT_EXCLUDE_INPATIENT_INJECTIONS = true;

export class DocumentsService {
  static async getExternalPrescriptionData(encounterId: string): Promise<any> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    return await ApiClient.get<any>(
      documentsApi.externalPrescription(validatedEncounterId, {
        // FIXME: 나중에 처방전 옵션 구현되면 옵션 적용 필요
        isInpatientInjectionsExcluded: DEFAULT_EXCLUDE_INPATIENT_INJECTIONS,
      })
    );
  }

  static async getDetailedStatement(
    encounterId: string
  ): Promise<DetailedStatementResponse> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    return await ApiClient.get<DetailedStatementResponse>(
      documentsApi.detailedStatement(validatedEncounterId)
    );
  }

  /**
   * 진료비 계산서/영수증 데이터를 조회합니다.
   * @param encounterId - 진료(Encounter) ID
   * @returns 진료비 영수증 데이터
   */
  static async getMedicalBillReceipt(
    encounterId: string
  ): Promise<MedicalBillReceiptResponseDto> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    return await ApiClient.get<MedicalBillReceiptResponseDto>(
      documentsApi.medicalBillReceipt(validatedEncounterId)
    );
  }

  /**
   * 진료기록부 데이터를 조회합니다.
   * @param encounterId - 진료(Encounter) ID
   * @returns 진료기록부 API 응답 (없으면 null)
   */
  static async getMedicalRecord(
    encounterId: string
  ): Promise<MedicalRecordApiResponse | null> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    return await ApiClient.get<MedicalRecordApiResponse | null>(
      documentsApi.medicalRecord(validatedEncounterId)
    );
  }

  static async getPrescriptionHtml(
    prescription: PrescriptionData,
    options?: { useFormPaper?: boolean; qrCodeImage?: string; showBackgroundImage?: boolean }
  ): Promise<string> {
    try {
      const response = await fetch("/api/prescription/out/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescription,
          useFormPaper: options?.useFormPaper ?? true,
          qrCodeImage: options?.qrCodeImage,
          showBackgroundImage: options?.showBackgroundImage,
          responseType: "html",
        }),
      });

      if (!response.ok) {
        const message =
          (await response.text()) ||
          "처방전 HTML을 생성하지 못했습니다. 다시 시도해주세요.";
        throw new Error(message);
      }

      return await response.text();
    } catch (error: any) {
      const message =
        error?.message || "처방전 HTML을 생성하지 못했습니다. 다시 시도해주세요.";
      throw new Error(message);
    }
  }

  static async getPrescriptionPdf(
    prescription: PrescriptionData,
    options?: { useFormPaper?: boolean; qrCodeImage?: string }
  ): Promise<Blob> {
    try {
      const response = await fetch("/api/prescription/out/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescription,
          useFormPaper: options?.useFormPaper ?? true,
          qrCodeImage: options?.qrCodeImage,
        }),
      });

      if (!response.ok) {
        const message =
          (await response.text()) ||
          "처방전 PDF를 생성하지 못했습니다. 다시 시도해주세요.";
        throw new Error(message);
      }

      return await response.blob();
    } catch (error: any) {
      const message =
        error?.message || "처방전 PDF를 생성하지 못했습니다. 다시 시도해주세요.";
      throw new Error(message);
    }
  }
}

