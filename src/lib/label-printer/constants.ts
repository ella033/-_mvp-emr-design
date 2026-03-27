/**
 * 검사 라벨 프린터 상수
 */

/** SDK 서버 설정 */
export const SDK_CONFIG = {
  /** SDK App 기본 주소 */
  LOCAL_ADDRESS: "//127.0.0.1:18080/WebPrintSDK/",
  /** 연결 모드 (http 또는 ws) */
  CONNECTION_MODE: "http:",
  /** 연결 타임아웃 (ms) */
  CONNECTION_TIMEOUT: 5000,
} as const;

/** 라벨 크기 설정 (40mm x 25mm) */
export const LABEL_SIZE = {
  /** 라벨 너비 (dots) - 40mm × 8dots/mm = 320dots */
  WIDTH_DOTS: 320,
  /** 라벨 높이 (dots) - 25mm × 8dots/mm = 200dots */
  HEIGHT_DOTS: 200,
  /** 라벨 간격 (dots) - 2mm × 8dots/mm = 16dots */
  GAP_DOTS: 16,
  /** 해상도 (dots/mm) - 203dpi 기준 약 8dots/mm */
  DPI: 8,
} as const;

/** 폰트 설정 */
export const FONT_CONFIG = {
  /** 장치 폰트 타입 */
  DEVICE_FONT: {
    /** 작은 폰트 */
    SMALL: "2",
    /** 중간 폰트 */
    MEDIUM: "3",
    /** 큰 폰트 */
    LARGE: "4",
  },
  /** 한글 문자셋 */
  KOREAN_CHARSET: {
    ICS: "K",
    CODE: "949",
  },
} as const;

/** 출력 수량 제한 */
export const PRINT_QUANTITY = {
  /** 최소 출력 매수 */
  MIN: 1,
  /** 최대 출력 매수 */
  MAX: 5,
  /** 기본 출력 매수 */
  DEFAULT: 1,
} as const;

/**
 * 라벨 레이아웃 좌표 (dots)
 * 라벨 크기: 320 x 200 dots (40mm x 25mm)
 *
 * 레이아웃 (4줄):
 * - 1줄: 차트번호 (bold)
 * - 2줄: 환자명(bold) + (나이/성별) 생년월일 - 길면 줄바꿈
 * - 3줄: 검체명
 * - 4줄: 출력날짜 출력시간
 */
export const LABEL_LAYOUT = {
  /** 상단 여백 */
  MARGIN_TOP: 10,
  /** 좌측 여백 */
  MARGIN_LEFT: 8,
  /** 라벨 너비 (출력 가능 영역) */
  PRINT_WIDTH: 304,
  /** 1줄: 차트번호 Y 좌표 */
  LINE_1_Y: 10,
  /** 2줄: 환자정보 Y 좌표 */
  LINE_2_Y: 45,
  /** 3줄: 검체명 Y 좌표 */
  LINE_3_Y: 95,
  /** 4줄: 출력일시 Y 좌표 */
  LINE_4_Y: 135,
  /** 줄 높이 (줄바꿈 시 사용) */
  LINE_HEIGHT: 36,
} as const;

/** 자동 축소 시 최소 폰트 사이즈 (px) - 한글 가독성을 위해 14px 이상 권장 */
export const AUTO_FIT_MIN_FONT_SIZE = 20;

/** 자동 축소 후 fitty 대기 시간 (ms) */
export const FITTY_SETTLE_DELAY_MS = 50;

/** 출력 결과 메시지 */
export const PRINT_MESSAGES = {
  SUCCESS: "success",
  NO_PRINTERS: "No printers",
  CANNOT_CONNECT: "Cannot connect to server",
  DUPLICATED: "duplicated",
} as const;

/**
 * 기준 폰트 사이즈에 비율을 적용하여 계산된 폰트 사이즈 반환
 * 소수점 첫째 자리까지 반올림
 * @param baseSize 기준 폰트 사이즈 (px)
 * @param ratio 비율 (예: 1.5 = 150%)
 */
export function calcFontSize(baseSize: number, ratio: number): number {
  return Math.round(baseSize * ratio * 10) / 10;
}
