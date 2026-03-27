/**
 * BIXOLON Web Print SDK TypeScript 래퍼
 *
 * SDK 파일들은 전역 함수로 동작하므로 브라우저 환경에서만 사용 가능합니다.
 * 이 래퍼는 타입 안전성과 Promise 기반 API를 제공합니다.
 */

import { FONT_CONFIG, PRINT_MESSAGES } from "./constants";
import type { PrintResult } from "./types";

/** SDK 초기화 여부 */
let isLabelInitialized = false;
let isPosInitialized = false;

// 일부 전역 함수는 bxllabel/bxlpos가 이름 충돌을 일으킵니다. (예: setCharacterset)
// 따라서 로드 시점의 구현을 캡처해두고, 래퍼에서는 캡처된 참조를 사용합니다.
let labelSetCharacterset:
  | ((ics: string, charset: string) => void)
  | undefined;
let posSetCharacterset: ((charset: string) => void) | undefined;

/**
 * 브라우저 환경 체크
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * SDK 스크립트 동적 로드
 * public 폴더의 스크립트를 script 태그로 로드합니다.
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("Cannot load script in non-browser environment"));
      return;
    }

    // 이미 로드된 스크립트인지 확인
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false; // 순서대로 로드되도록 설정
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * SDK 초기화
 * public/vendor 폴더의 SDK 스크립트를 동적으로 로드합니다.
 */
export async function initializeLabelPrinter(): Promise<void> {
  if (!isBrowser()) {
    console.warn("Label printer SDK can only be initialized in browser environment");
    return;
  }

  if (isLabelInitialized) {
    return;
  }

  // 이미 전역 함수가 존재하는지 확인 (다른 방식으로 로드된 경우)
  if (window.requestPrint && window.getLabelData) {
    // bxllabel이 이미 로드된 경우에도, setCharacterset 캡처는 필요합니다.
    if (!labelSetCharacterset && typeof window.setCharacterset === "function") {
      const setCharacterset = window.setCharacterset;
      labelSetCharacterset = (ics: string, charset: string) => {
        setCharacterset(ics, charset);
      };
    }
    isLabelInitialized = true;
    console.log("BIXOLON Label Printer SDK already loaded");
    return;
  }

  try {
    // public/vendor 폴더에서 스크립트 로드 (순서 중요)
    await loadScript("/vendor/bxlcommon.js");
    await loadScript("/vendor/bxllabel.js");

    isLabelInitialized = true;

    // bxllabel.js가 정의한 setCharacterset(ics, charset)을 캡처
    if (typeof window.setCharacterset === "function") {
      const setCharacterset = window.setCharacterset;
      labelSetCharacterset = (ics: string, charset: string) => {
        setCharacterset(ics, charset);
      };
    }

    console.log("BIXOLON Label Printer SDK initialized");
  } catch (error) {
    console.error("Failed to initialize Label Printer SDK:", error);
    throw error;
  }
}

/**
 * POS 프린터 SDK 초기화 (SRP-350III 등)
 * public/vendor 폴더의 bxlcommon + bxlpos 스크립트를 동적으로 로드합니다.
 */
export async function initializePosPrinter(): Promise<void> {
  if (!isBrowser()) {
    console.warn("POS printer SDK can only be initialized in browser environment");
    return;
  }

  if (isPosInitialized) {
    return;
  }

  // 이미 전역 함수가 존재하는지 확인
  if (window.requestPrint && window.getPosData) {
    // bxlpos가 이미 로드된 경우에도 setCharacterset 캡처
    if (!posSetCharacterset && typeof window.setCharacterset === "function") {
      const setCharacterset = window.setCharacterset;
      posSetCharacterset = (charset: string) => {
        setCharacterset(charset);
      };
    }
    isPosInitialized = true;
    console.log("BIXOLON POS Printer SDK already loaded");
    return;
  }

  try {
    await loadScript("/vendor/bxlcommon.js");
    await loadScript("/vendor/bxlpos.js");

    isPosInitialized = true;

    // bxlpos.js가 정의한 setCharacterset(charset)을 캡처
    if (typeof window.setCharacterset === "function") {
      const setCharacterset = window.setCharacterset;
      posSetCharacterset = (charset: string) => {
        setCharacterset(charset);
      };
    }

    console.log("BIXOLON POS Printer SDK initialized");
  } catch (error) {
    console.error("Failed to initialize POS Printer SDK:", error);
    throw error;
  }
}

/**
 * 라벨 ID 설정
 */
export function setLabelId(id: number): void {
  if (!isBrowser() || !window.setLabelId) return;
  window.setLabelId(id);
}

/**
 * 버퍼 초기화
 */
export function clearBuffer(): void {
  if (!isBrowser() || !window.clearBuffer) return;
  window.clearBuffer();
}

/**
 * 출력 버퍼 실행
 */
export function printBuffer(copies?: number): void {
  if (!isBrowser() || !window.printBuffer) return;
  if (copies !== undefined) {
    window.printBuffer(copies);
  } else {
    window.printBuffer();
  }
}

/**
 * 라벨 데이터 가져오기 (JSON 문자열)
 */
export function getLabelData(): string {
  if (!isBrowser() || !window.getLabelData) return "";
  return window.getLabelData();
}

/**
 * 한글 문자셋 설정
 */
export function setKoreanCharset(): void {
  if (!isBrowser()) return;
  if (!labelSetCharacterset) return;
  labelSetCharacterset(FONT_CONFIG.KOREAN_CHARSET.ICS, FONT_CONFIG.KOREAN_CHARSET.CODE);
}

/**
 * 라벨 너비 설정 (dots)
 */
export function setWidth(width: number): void {
  if (!isBrowser() || !window.setWidth) return;
  window.setWidth(width);
}

/**
 * 라벨 길이 설정 (dots)
 * @param labelLength 라벨 길이
 * @param gapLength 간격 길이
 * @param media 미디어 타입 ('G': Gap, 'C': Continuous, 'B': Black mark)
 * @param offset 오프셋
 */
export function setLength(
  labelLength: number,
  gapLength: number,
  media: string = "G",
  offset: number = 0
): void {
  if (!isBrowser() || !window.setLength) return;
  window.setLength(labelLength, gapLength, media, offset);
}

/**
 * 인쇄 속도 설정
 */
export function setSpeed(speed: number): void {
  if (!isBrowser() || !window.setSpeed) return;
  window.setSpeed(speed);
}

/**
 * 인쇄 농도 설정
 */
export function setDensity(density: number): void {
  if (!isBrowser() || !window.setDensity) return;
  window.setDensity(density);
}

/**
 * 장치 폰트로 텍스트 그리기
 */
export function drawDeviceFont(
  text: string,
  x: number,
  y: number,
  fontType: string = FONT_CONFIG.DEVICE_FONT.MEDIUM,
  widthEnlarge: number = 1,
  heightEnlarge: number = 1,
  rotation: number = 0,
  invert: number = 0,
  bold: number = 0,
  alignment: number = 0
): void {
  if (!isBrowser() || !window.drawDeviceFont) return;
  window.drawDeviceFont(text, x, y, fontType, widthEnlarge, heightEnlarge, rotation, invert, bold, alignment);
}

/**
 * 벡터 폰트로 텍스트 그리기
 */
export function drawVectorFont(
  text: string,
  x: number,
  y: number,
  fontType: string = "U",
  fontWidth: number = 24,
  fontHeight: number = 24,
  rightSpacing: number = 0,
  bold: number = 0,
  invert: number = 0,
  italic: number = 0,
  rotation: number = 0,
  alignment: number = 0,
  rtol: number = 0
): void {
  if (!isBrowser() || !window.drawVectorFont) return;
  window.drawVectorFont(
    text,
    x,
    y,
    fontType,
    fontWidth,
    fontHeight,
    rightSpacing,
    bold,
    invert,
    italic,
    rotation,
    alignment,
    rtol
  );
}

/**
 * TrueType 폰트로 텍스트 그리기
 */
export function drawTrueTypeFont(
  text: string,
  x: number,
  y: number,
  fontname: string = "굴림",
  fontsize: number = 12,
  rotation: number = 0,
  italic: number = 0,
  bold: number = 0,
  underline: number = 0,
  compression: number = 0
): void {
  if (!isBrowser() || !window.drawTrueTypeFont) return;
  window.drawTrueTypeFont(text, x, y, fontname, fontsize, rotation, italic, bold, underline, compression);
}

/**
 * 1D 바코드 그리기
 */
export function draw1DBarcode(
  data: string,
  x: number,
  y: number,
  symbol: string = "3",
  narrowbar: number = 2,
  widebar: number = 6,
  height: number = 50,
  rotation: number = 0,
  hri: number = 2
): void {
  if (!isBrowser() || !window.draw1DBarcode) return;
  window.draw1DBarcode(data, x, y, symbol, narrowbar, widebar, height, rotation, hri);
}

/**
 * QR 코드 그리기
 */
export function drawQRCode(
  data: string,
  x: number,
  y: number,
  model: number = 2,
  eccLevel: number = 0,
  size: number = 4,
  rotation: number = 0
): void {
  if (!isBrowser() || !window.drawQRCode) return;
  window.drawQRCode(data, x, y, model, eccLevel, size, rotation);
}

/**
 * 사각형 그리기
 */
export function drawBlock(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  option: string = "O",
  thickness: number = 1
): void {
  if (!isBrowser() || !window.drawBlock) return;
  window.drawBlock(startX, startY, endX, endY, option, thickness);
}

/**
 * 비트맵 이미지 그리기
 * @param data Base64 인코딩된 이미지 데이터
 * @param x X 좌표 (dots)
 * @param y Y 좌표 (dots)
 * @param width 이미지 너비 (dots)
 * @param dither 디더링 옵션 (0: 없음, 1: 있음)
 */
export function drawBitmap(
  data: string,
  x: number,
  y: number,
  width: number,
  dither: number = 0
): void {
  if (!isBrowser() || !window.drawBitmap) return;
  console.log("drawBitmap", data, x, y, width, dither);
  window.drawBitmap(data, x, y, width, dither);
}

/**
 * 프린터로 출력 요청
 *
 * SDK 콜백은 두 번 호출될 수 있습니다:
 * 1. 즉시: 빈 문자열 (출력 요청 접수)
 * 2. 나중에: "ResponseID:result" (실제 결과)
 *
 * 첫 번째 콜백에서 Promise를 resolve합니다.
 */
export function requestPrint(printerName: string): Promise<PrintResult> {
  if (!isBrowser() || !window.getLabelData) {
    return Promise.resolve({
      success: false,
      message: "SDK not initialized or not in browser environment",
    });
  }

  const labelData = window.getLabelData();
  return requestPrintWithData(printerName, labelData);
}

/**
 * (POS/Label 공용) 데이터(JSON)로 출력 요청
 */
export function requestPrintWithData(printerName: string, data: string): Promise<PrintResult> {
  return new Promise((resolve) => {
    if (!isBrowser() || !window.requestPrint) {
      resolve({
        success: false,
        message: "SDK not initialized or not in browser environment",
      });
      return;
    }

    window.requestPrint(printerName, data, (result: string) => {
      const resultStr = String(result ?? "");

      const isSuccess =
        resultStr === "" ||
        resultStr.toLowerCase().includes(PRINT_MESSAGES.SUCCESS);

      const hasError =
        resultStr.toLowerCase().includes("error") ||
        resultStr.includes(PRINT_MESSAGES.NO_PRINTERS);

      const parts = resultStr.split(":");
      const responseId = parts.length > 1 ? parts[0] : undefined;

      resolve({
        success: isSuccess && !hasError,
        message: resultStr || "출력 요청 완료",
        responseId,
      });
    });
  });
}

/**
 * POS ID 설정
 */
export function setPosId(id: number): void {
  if (!isBrowser() || !window.setPosId) return;
  window.setPosId(id);
}

/**
 * POS 데이터 가져오기 (JSON 문자열)
 */
export function getPosData(): string {
  if (!isBrowser() || !window.getPosData) return "";
  return window.getPosData();
}

/**
 * POS 프린터 상태 체크
 */
export function checkPosPrinterStatus(): void {
  if (!isBrowser() || !window.checkPrinterStatus) return;
  window.checkPrinterStatus();
}

/**
 * POS 비트맵 출력 (Canvas DataURL)
 */
export function printPosBitmap(
  imageDataUrl: string,
  width: number,
  alignment: number,
  dither: number
): void {
  if (!isBrowser() || !window.printBitmap) return;
  window.printBitmap(imageDataUrl, width, alignment, dither);
}

/**
 * POS 용지 컷
 */
export function cutPosPaper(bFeedCut: number = 1): void {
  if (!isBrowser() || !window.cutPaper) return;
  window.cutPaper(bFeedCut);
}

/**
 * 연결 모드 설정
 */
export function setConnectionMode(mode: "http:" | "https:" | "ws:" | "wss:"): void {
  if (!isBrowser() || !window.setConnectionMode) return;
  window.setConnectionMode(mode);
}
