/**
 * 환자 라벨 API 출력 서비스
 *
 * NOTE:
 * - 백엔드에 환자 라벨 전용 outputTypeCode가 추가되기 전까지는 `LABEL`로 임시 처리합니다.
 */

import { PrintersService } from "@/services/printers-service";
import { OutputTypeCode } from "@/types/printer-types";
import { LabelContentType } from "./label-api-service";
import { renderLabelToBase64Html } from "./label-html-renderer";
import type { PrintResult, LabelData } from "./types";

export interface PatientLabelApiPrintOptions {
  /** 에이전트 ID (선택) */
  agentId?: string;
  /** 출력 매수 */
  copies: number;
}

export async function printPatientLabelImageViaApi(
  labelData: LabelData,
  options: PatientLabelApiPrintOptions
): Promise<PrintResult> {
  try {
    const imageBase64 = await renderLabelToBase64Html(labelData);

    await PrintersService.print({
      outputTypeCode: OutputTypeCode.LABEL,
      contentType: LabelContentType.IMAGE_PNG,
      fileName: `patient-label-${Date.now()}.png`,
      contentBase64: imageBase64,
      copies: options.copies,
    });

    return {
      success: true,
      message: "환자 라벨 출력 요청 완료",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "환자 라벨 출력 요청 실패",
    };
  }
}

