/**
 * 진료기록부 레이아웃: 우측 잘림 방지를 위해 출력 폭을 520 dots로 제한하고,
 * 콘텐츠가 520 안에 들어가도록 가로 스케일 적용.
 */
const BASE_WIDTH = 576;
/** 실제 출력/이미지 폭. 520 이하로 하면 프린터에서 우측 잘림 방지 */
const OUTPUT_WIDTH_DOTS = 520;
/** 가로 합계(기준): MARGIN_X(0) + NAME + GAP*4 + DOSE+TIMES+DAYS+USAGE + MARGIN_RIGHT */
const BASE_HORIZONTAL_SUM =
  0 +
  Math.round(230 * (BASE_WIDTH / 504)) +
  Math.round(6 * (BASE_WIDTH / 504)) * 4 +
  Math.round(50 * (BASE_WIDTH / 504)) * 3 +
  Math.round(60 * (BASE_WIDTH / 504)) +
  Math.round(24 * (BASE_WIDTH / 504));
const WIDTH_SCALE = OUTPUT_WIDTH_DOTS / BASE_HORIZONTAL_SUM;

function scaleW(v: number): number {
  return Math.round(v * WIDTH_SCALE);
}

export const MEDICAL_RECORD_LAYOUT = {
  PAPER_WIDTH_DOTS: OUTPUT_WIDTH_DOTS,
  PRINT_WIDTH_DOTS: OUTPUT_WIDTH_DOTS,
  PREVIEW_SCALE: 2,
  PRINT_SCALE: 1,
  MARGIN_X: 0,
  MARGIN_RIGHT: scaleW(Math.round(24 * (BASE_WIDTH / 504))),
  MARGIN_TOP: Math.round(18 * (BASE_WIDTH / 504)),
  SECTION_GAP: Math.round(12 * (BASE_WIDTH / 504)),
  LINE_GAP: Math.round(6 * (BASE_WIDTH / 504)),
  DIVIDER_GAP: Math.round(10 * (BASE_WIDTH / 504)),
  DIVIDER_THICKNESS: 1,
  ROW_GAP: Math.round(4 * (BASE_WIDTH / 504)),
  TABLE_HEADER_GAP: Math.round(6 * (BASE_WIDTH / 504)),
  FOOTER_GAP: Math.round(12 * (BASE_WIDTH / 504)),
  MAX_NAME_LINES: 2,
} as const;

export const MEDICAL_RECORD_FONT = {
  FAMILY: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  TITLE: { size: Math.round(32 * (BASE_WIDTH / 504)), weight: "bold" as const },
  PATIENT_NAME: { size: Math.round(24 * (BASE_WIDTH / 504)), weight: "bold" as const },
  HEADER: { size: Math.round(18 * (BASE_WIDTH / 504)), weight: "bold" as const },
  BODY: { size: Math.round(18 * (BASE_WIDTH / 504)), weight: "normal" as const },
  BODY_BOLD: { size: Math.round(18 * (BASE_WIDTH / 504)), weight: "bold" as const },
  SMALL: { size: Math.round(16 * (BASE_WIDTH / 504)), weight: "normal" as const },
  SMALL_BOLD: { size: Math.round(16 * (BASE_WIDTH / 504)), weight: "bold" as const },
} as const;

export const MEDICAL_RECORD_TABLE = {
  COLUMN_GAP: scaleW(Math.round(6 * (BASE_WIDTH / 504))),
  NAME_WIDTH: scaleW(Math.round(230 * (BASE_WIDTH / 504))),
  DOSE_WIDTH: scaleW(Math.round(50 * (BASE_WIDTH / 504))),
  TIMES_WIDTH: scaleW(Math.round(50 * (BASE_WIDTH / 504))),
  DAYS_WIDTH: scaleW(Math.round(50 * (BASE_WIDTH / 504))),
  USAGE_WIDTH: scaleW(Math.round(60 * (BASE_WIDTH / 504))),
} as const;

export const MEDICAL_RECORD_COLORS = {
  BACKGROUND: "#FFFFFF",
  TEXT: "#000000",
  DIVIDER: "#000000",
} as const;

export enum PosAlignment {
  Left = 0,
  Center = 1,
  Right = 2,
}

export const POS_PRINT_CONFIG = {
  DITHER: 0,
  THRESHOLD: 190,
} as const;
