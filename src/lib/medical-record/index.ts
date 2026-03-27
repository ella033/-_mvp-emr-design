// Constants
export { MEDICAL_RECORD_LAYOUT, MEDICAL_RECORD_FONT, MEDICAL_RECORD_TABLE, MEDICAL_RECORD_COLORS, POS_PRINT_CONFIG, PosAlignment } from "./constants";

// Types (한글)
export type {
  진료기록부데이터,
  진료기록부헤더,
  진료기록부환자,
  진료기록부처방,
  MedicalRecordRenderResult,
  MedicalRecordRenderOptions,
} from "./types";

// 유틸리티
export { splitMedicalRecordByItemType } from "./types";

// Types (하위 호환성)
export type {
  MedicalRecordData,
  MedicalRecordHeader,
  MedicalRecordPatient,
  MedicalRecordOrder,
} from "./types";

// HTML 렌더러 - 직접 사용 시
export {
  renderMedicalRecordToDataUrlHtml,
  renderMedicalRecordToDataUrlForPrintHtml,
  renderMedicalRecordToBase64Html,
  getMedicalRecordImageInfoHtml,
} from "./medical-record-html-renderer";

// 렌더러 팩토리 - 전환 가능한 통합 API
export {
  getMedicalRecordRenderer,
  getCurrentRendererType,
  renderMedicalRecord,
  renderMedicalRecordForPrint,
  renderMedicalRecordBase64,
  getMedicalRecordInfo,
  renderMedicalRecordWith,
  renderMedicalRecordForPrintWith,
  renderMedicalRecordPages,
} from "./medical-record-renderer-factory";
export type { MedicalRecordRenderer } from "./medical-record-renderer-factory";

// HTML 템플릿 컴포넌트
export { MedicalRecordTemplate } from "./medical-record-template";
export type { MedicalRecordTemplateProps } from "./medical-record-template";

// Print Service
export {
  printMedicalRecordLocal,
  printMedicalRecordImageViaApi,
} from "./medical-record-print-service";
export type { MedicalRecordApiPrintOptions, MedicalRecordLocalPrintOptions } from "./medical-record-print-service";

// API Mapper
export { mapMedicalRecordApiResponseToData } from "./medical-record-api-mapper";
