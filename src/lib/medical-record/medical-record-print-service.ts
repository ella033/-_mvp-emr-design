import { PrintersService } from "@/services/printers-service";
import { OutputTypeCode } from "@/types/printer-types";
import { requestPrintWithData, setPosId, getPosData, printPosBitmap, cutPosPaper } from "@/lib/label-printer";
import type { PrintResult } from "@/lib/label-printer";
import { MEDICAL_RECORD_LAYOUT, POS_PRINT_CONFIG, PosAlignment } from "./constants";
import { renderMedicalRecordToDataUrlForPrintHtml, renderMedicalRecordToBase64Html } from "./medical-record-html-renderer";
import { splitMedicalRecordByItemType } from "./types";
import type { MedicalRecordData } from "./types";

export interface MedicalRecordApiPrintOptions {
  agentId?: string;
  copies?: number;
}

const DEFAULT_COPIES = 1;
let posIssueId = 5000;

export interface MedicalRecordLocalPrintOptions {
  copies?: number;
}

export async function printMedicalRecordLocal(
  printerName: string,
  data: MedicalRecordData,
  copiesOrOptions: number | MedicalRecordLocalPrintOptions = DEFAULT_COPIES
): Promise<PrintResult> {
  // 하위 호환성: 숫자면 copies로, 객체면 옵션으로 처리
  const options: MedicalRecordLocalPrintOptions =
    typeof copiesOrOptions === "number"
      ? { copies: copiesOrOptions }
      : copiesOrOptions;

  const copies = options.copies ?? DEFAULT_COPIES;

  const hasPrinterName = Boolean(printerName);
  if (!hasPrinterName) {
    return { success: false, message: "프린터 이름이 필요합니다." };
  }

  const hasValidCopies = copies > 0;
  if (!hasValidCopies) {
    return { success: false, message: "출력 매수를 확인해주세요." };
  }

  // 항목구분별 분리
  const pages = splitMedicalRecordByItemType(data);
  if (pages.length === 0) {
    return { success: true, message: "출력할 처방이 없습니다." };
  }

  const widthDots = MEDICAL_RECORD_LAYOUT.PRINT_WIDTH_DOTS;
  let printed = 0;

  for (const pageData of pages) {
    const imageDataUrl = await renderMedicalRecordToDataUrlForPrintHtml(pageData);

    for (let i = 0; i < copies; i++) {
      setPosId(posIssueId++);
      printPosBitmap(imageDataUrl, widthDots, PosAlignment.Left, POS_PRINT_CONFIG.DITHER);
      cutPosPaper(1);
      const posData = getPosData();
      const result = await requestPrintWithData(printerName, posData);
      if (!result.success) {
        return {
          success: false,
          message: `출력 실패 (${printed}장 출력 후): ${result.message}`,
        };
      }
      printed++;
    }
  }

  return {
    success: true,
    message: `총 ${printed}장 출력 완료`,
  };
}

export async function printMedicalRecordImageViaApi(
  data: MedicalRecordData,
  options: MedicalRecordApiPrintOptions
): Promise<PrintResult> {
  try {
    const copies = options.copies ?? DEFAULT_COPIES;

    // 항목구분별 분리
    const pages = splitMedicalRecordByItemType(data);
    if (pages.length === 0) {
      return { success: true, message: "출력할 처방이 없습니다." };
    }

    for (const pageData of pages) {
      const imageBase64 = await renderMedicalRecordToBase64Html(pageData);

      await PrintersService.print({
        outputTypeCode: OutputTypeCode.CHART_RECORD, // FIXME: 진료기록부 enum 타입으로 변경 필요
        contentType: "image/png",
        fileName: `medical-record-${Date.now()}.png`,
        contentBase64: imageBase64,
        copies,
      });
    }

    return {
      success: true,
      message: "진료기록부 출력 요청 완료",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "진료기록부 출력 요청 실패",
    };
  }
}
