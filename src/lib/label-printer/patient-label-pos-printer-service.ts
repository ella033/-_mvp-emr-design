/**
 * 환자 라벨 라벨 프린터 로컬 출력 서비스
 *
 * Web Print SDK App(localhost:18080)이 실행 중이어야 합니다.
 * - bxlcommon.js + bxllabel.js 기반 drawBitmap() 출력
 */

import {
  clearBuffer,
  drawBitmap,
  initializeLabelPrinter,
  printBuffer,
  requestPrint,
  setLabelId,
  setLength,
  setWidth,
} from "./bixolon-sdk";
import { LABEL_SIZE } from "./constants";
import { renderLabelToDataUrlForPrintHtml } from "./label-html-renderer";
import type { LabelData, PrintResult } from "./types";

let labelIssueId = 2000;

const BITMAP_PRINT_CONFIG = {
  SCALE: 2,
  DITHER: 0,
} as const;

const DRAW_ORIGIN = {
  X: 0,
  Y: 0,
} as const;

export async function printPatientLabelLocal(
  printerName: string,
  labelData: LabelData,
  copies: number
): Promise<PrintResult> {
  const hasPrinterName = Boolean(printerName);
  if (!hasPrinterName) {
    return { success: false, message: "프린터 이름이 필요합니다." };
  }

  const hasValidCopies = copies > 0;
  if (!hasValidCopies) {
    return { success: false, message: "출력 매수를 확인해주세요." };
  }

  await initializeLabelPrinter();

  const imageDataUrl = await renderLabelToDataUrlForPrintHtml(labelData);
  const widthDots = LABEL_SIZE.WIDTH_DOTS * BITMAP_PRINT_CONFIG.SCALE;
  const heightDots = LABEL_SIZE.HEIGHT_DOTS * BITMAP_PRINT_CONFIG.SCALE;
  const gapDots = LABEL_SIZE.GAP_DOTS * BITMAP_PRINT_CONFIG.SCALE;

  let printed = 0;

  for (let i = 0; i < copies; i++) {
    setLabelId(labelIssueId++);
    clearBuffer();
    setWidth(widthDots);
    setLength(heightDots, gapDots, "G", 0);
    drawBitmap(imageDataUrl, DRAW_ORIGIN.X, DRAW_ORIGIN.Y, widthDots, BITMAP_PRINT_CONFIG.DITHER);
    printBuffer();

    const result = await requestPrint(printerName);
    if (!result.success) {
      return {
        success: false,
        message: `출력 실패 (${printed}/${copies}): ${result.message}`,
      };
    }

    printed++;
  }

  return {
    success: true,
    message: `총 ${printed}장 출력 완료`,
  };
}

