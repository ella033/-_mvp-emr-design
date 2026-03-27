/**
 * 검사 라벨 프린터 모듈
 *
 * BIXOLON Web Print SDK를 래핑한 라벨 프린터 기능을 제공합니다.
 *
 * @example
 * ```typescript
 * import { printExaminationLabels, initializeLabelPrinter } from "@/lib/label-printer";
 *
 * // SDK 초기화 (로컬 출력 시)
 * await initializeLabelPrinter();
 *
 * // 로컬 라벨 출력
 * const result = await printExaminationLabels(printerName, patient, specimens);
 *
 * // API를 통한 원격 라벨 출력 (이미지 방식)
 * import { printExaminationLabelsViaApi, LabelContentType } from "@/lib/label-printer";
 *
 * const result = await printExaminationLabelsViaApi(patient, specimens, {
 *   printerId: "printer-123",
 *   contentType: LabelContentType.IMAGE_PNG,
 * });
 * ```
 */

// 타입 exports
export type {
  Gender,
  PrintResult,
  LabelData,
  Specimen,
  SpecimenPrintItem,
  PatientInfo,
  SpecimenResponse,
  ConnectionStatus,
  PrinterStatus,
} from "./types";

// 상수 exports
export {
  SDK_CONFIG,
  LABEL_SIZE,
  FONT_CONFIG,
  PRINT_QUANTITY,
  LABEL_LAYOUT,
  PRINT_MESSAGES,
} from "./constants";

// SDK 래퍼 함수 exports
export {
  initializeLabelPrinter,
  initializePosPrinter,
  setLabelId,
  clearBuffer,
  printBuffer,
  getLabelData,
  setKoreanCharset,
  setWidth,
  setLength,
  setSpeed,
  setDensity,
  drawDeviceFont,
  drawVectorFont,
  drawTrueTypeFont,
  draw1DBarcode,
  drawQRCode,
  drawBlock,
  drawBitmap,
  requestPrint,
  requestPrintWithData,
  setPosId,
  getPosData,
  checkPosPrinterStatus,
  printPosBitmap,
  cutPosPaper,
  setConnectionMode,
} from "./bixolon-sdk";

// 로컬 출력 서비스 함수 exports
export {
  initializeLabelSettings,
  renderExaminationLabel,
  getCurrentPrintDateTime,
  createLabelData,
  printExaminationLabels,
  getTotalQuantity,
  printTestLabel,
  generateLabelPreview,
} from "./label-printer-service";

// 미리보기 타입 exports
export type { PreviewTextItem, LabelPreviewData } from "./label-printer-service";

// 라벨 HTML 렌더러 exports
export {
  renderLabelToDataUrlHtml,
  renderLabelToDataUrlForPrintHtml,
  renderLabelToBase64Html,
  getLabelImageInfoHtml,
  renderLabelsToBase64ArrayHtml,
} from "./label-html-renderer";

// 라벨 HTML 템플릿 exports (환자 라벨 / 검사 라벨 공용)
export {
  LabelTemplate,
  HTML_LABEL_LAYOUT,
  HTML_LABEL_FONT,
  HTML_LABEL_COLORS,
} from "./label-template";

export type { LabelTemplateProps } from "./label-template";

// API 출력 서비스 exports
export {
  LabelContentType,
  printLabelImageViaApi,
  printLabelImagesViaApi,
  printLabelsBixolonViaApi,
  printExaminationLabelsViaApi,
  printTestLabelViaApi,
} from "./label-api-service";

// API 출력 옵션 타입 export
export type { LabelApiPrintOptions } from "./label-api-service";

// 환자 라벨 API 출력 exports
export {
  printPatientLabelImageViaApi,
} from "./patient-label-api-service";

export type {
  PatientLabelApiPrintOptions,
} from "./patient-label-api-service";

// 환자 라벨 로컬(라벨 프린터) 출력
export { printPatientLabelLocal } from "./patient-label-pos-printer-service";

// 검사 라벨 사일런트(자동) 출력
export {
  hasExaminationOrders,
  printExaminationLabelsSilent,
} from "./examination-label-silent-print";

export type { SilentExaminationLabelPrintParams } from "./examination-label-silent-print";
