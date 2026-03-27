/**
 * 검사 라벨 프린터 관련 타입 정의
 */

/** 성별 타입 */
export type Gender = "M" | "F";

/** 출력 결과 */
export interface PrintResult {
  success: boolean;
  message: string;
  responseId?: string;
}

/** 라벨에 출력할 데이터 (환자 라벨 / 검사 라벨 공용) */
export interface LabelData {
  /** 차트번호 (예: "12345-12") */
  chartNumber: string;
  /** 환자명 */
  patientName: string;
  /** 나이 */
  age: number;
  /** 성별 */
  gender: Gender;
  /** 생년월일 (YYYY-MM-DD) */
  birthDate: string;
  /** 검체명 (예: "Urine(random)") — 검사 라벨에서만 사용, 없으면 환자 라벨 */
  specimenName?: string;
  /** 출력 일시 (YYYY.MM.DD HH:mm) */
  printDateTime: string;
}

/** 검체 정보 */
export interface Specimen {
  /** 검체 코드 */
  specimenCode: string;
  /** 검체명 */
  specimenName: string;
}

/** 출력할 검체 항목 (수량 포함) */
export interface SpecimenPrintItem extends Specimen {
  /** 출력 매수 (1-5) */
  quantity: number;
}

/** 환자 정보 */
export interface PatientInfo {
  /** 차트번호 */
  chartNumber: string;
  /** 환자명 */
  patientName: string;
  /** 나이 */
  age: number;
  /** 성별 */
  gender: Gender;
  /** 생년월일 */
  birthDate: string;
}


/** 검체 조회 응답 */
export interface SpecimenResponse {
  /** 환자 정보 */
  patient: PatientInfo;
  /** 처방된 검체 목록 */
  specimens: SpecimenPrintItem[];
}

/** SDK 연결 상태 */
export type ConnectionStatus = "connected" | "disconnected" | "checking";

/** 프린터 상태 */
export interface PrinterStatus {
  /** 연결 상태 */
  connectionStatus: ConnectionStatus;
  /** 마지막 오류 메시지 */
  lastError?: string;
}

// Window 전역 타입 확장 (SDK 함수들)
declare global {
  interface Window {
    // bxlcommon.js
    requestPrint?: (
      printerName: string,
      data: string,
      callback: (result: string) => void
    ) => void;
    setConnectionMode?: (mode: string) => void;
    getServerURL?: () => { url: string };

    // bxllabel.js
    getLabelData?: () => string;
    setLabelId?: (id: number) => void;
    checkLabelStatus?: () => void;
    clearBuffer?: () => void;
    printBuffer?: (copies?: number) => void;
    // NOTE: bxllabel.js는 (ics, charset), bxlpos.js는 (charset) 시그니처를 사용함.
    // 둘 다 로드될 수 있으므로 optional 파라미터로 정의.
    setCharacterset?: (icsOrCharset: string, charsetMaybe?: string) => void;
    drawDeviceFont?: (
      text: string,
      x: number,
      y: number,
      fontType: string,
      widthEnlarge: number,
      heightEnlarge: number,
      rotation: number,
      invert: number,
      bold: number,
      alignment: number
    ) => void;
    drawVectorFont?: (
      text: string,
      x: number,
      y: number,
      fontType: string,
      fontWidth: number,
      fontHeight: number,
      rightSpacing: number,
      bold: number,
      invert: number,
      italic: number,
      rotation: number,
      alignment: number,
      rtol: number
    ) => void;
    drawTrueTypeFont?: (
      text: string,
      x: number,
      y: number,
      fontname: string,
      fontsize: number,
      rotation: number,
      italic: number,
      bold: number,
      underline: number,
      compression: number
    ) => void;
    draw1DBarcode?: (
      data: string,
      x: number,
      y: number,
      symbol: string,
      narrowbar: number,
      widebar: number,
      height: number,
      rotation: number,
      hri: number
    ) => void;
    drawQRCode?: (
      data: string,
      x: number,
      y: number,
      model: number,
      eccLevel: number,
      size: number,
      rotation: number
    ) => void;
    setLength?: (
      labelLength: number,
      gapLength: number,
      media: string,
      offset: number
    ) => void;
    setWidth?: (width: number) => void;
    setSpeed?: (speed: number) => void;
    setDensity?: (density: number) => void;
    setOrientation?: (orientation: string) => void;
    setMargin?: (horizontal: number, vertical: number) => void;
    drawBlock?: (
      startHorizontal: number,
      startVertical: number,
      endHorizontal: number,
      endVertical: number,
      option: string,
      thickness: number
    ) => void;
    drawBitmap?: (
      data: string,
      x: number,
      y: number,
      width: number,
      dither: number
    ) => void;

    // bxlpos.js (POS)
    getPosData?: () => string;
    setPosId?: (id: number) => void;
    checkPrinterStatus?: () => void;
    printBitmap?: (
      imageData: string,
      width: number,
      alignment: number,
      dither: number
    ) => void;
    cutPaper?: (bFeedCut?: number) => void;
    setInternationalCharset?: (ics: number) => void;
  }
}

export {};
