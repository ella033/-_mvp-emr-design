/**
 * 검사 라벨 프린터 서비스
 *
 * 라벨 렌더링 및 출력 비즈니스 로직을 담당합니다.
 */

import {
  clearBuffer,
  setWidth,
  setLength,
  setKoreanCharset,
  drawVectorFont,
  drawBitmap,
  printBuffer,
  requestPrint,
  setLabelId,
  initializeLabelPrinter,
} from "./bixolon-sdk";
import { LABEL_SIZE, LABEL_LAYOUT } from "./constants";
import { renderLabelToDataUrlForPrintHtml } from "./label-html-renderer";
import type { LabelData, PrintResult, SpecimenPrintItem, PatientInfo } from "./types";
import { formatBirthDateShort } from "@/lib/date-utils";
import { getAgeOrMonth } from "@/lib/patient-utils";

/**
 * bitmap 이미지 출력 보정 스케일
 *
 * XD5-40d 환경에서 `drawBitmap` 출력이 전체적으로 축소되어 나오는 케이스가 있어,
 * 이미지 방식 출력 경로에서만 dots 기준을 2배로 잡아 실물 라벨 크기(40x25mm)에 맞춥니다.
 */
const BITMAP_PRINT_SCALE = 2 as const;

/**
 * 라벨 발행 ID 카운터
 * SDK에서 각 출력 요청을 구분하기 위해 매번 고유한 ID가 필요합니다.
 */
let labelIssueId = 1;

/**
 * 다음 라벨 ID 반환 및 증가
 */
function getNextLabelId(): number {
  return labelIssueId++;
}

/**
 * 라벨 출력 설정 초기화
 */
export function initializeLabelSettings(): void {
  setLabelId(getNextLabelId());
  clearBuffer();
  setKoreanCharset();
  setWidth(LABEL_SIZE.WIDTH_DOTS);
  setLength(LABEL_SIZE.HEIGHT_DOTS, LABEL_SIZE.GAP_DOTS, "G", 0);
}

/**
 * 벡터 폰트 타입
 * - 'U': ASCII (영문, 숫자만)
 * - 'K': KS5601 (한글 지원)
 */
const FONT_TYPE_KOREAN = "K";

/**
 * 폰트 설정
 * 라벨 크기 40mm x 25mm (320 x 200 dots) 기준
 *
 * 레이아웃 (4줄):
 * - 1줄: 차트번호 (bold)
 * - 2줄: 환자명(bold) + (나이/성별) 생년월일 - 길면 줄바꿈
 * - 3줄: 검체명
 * - 4줄: 출력일시
 */
const FONT = {
  /** 1줄: 차트번호 */
  CHART_NUMBER: { width: 40, height: 40, bold: 1 },
  /** 2줄: 환자명 */
  PATIENT_NAME: { width: 40, height: 40, bold: 1 },
  /** 2줄: (나이/성별) 생년월일 */
  PATIENT_DETAIL: { width: 26, height: 26, bold: 0 },
  /** 3줄: 검체명 */
  SPECIMEN: { width: 32, height: 32, bold: 0 },
  /** 4줄: 출력일시 */
  DATETIME: { width: 24, height: 24, bold: 0 },
} as const;

/**
 * 텍스트 세그먼트 타입
 */
type SegmentType = "name" | "detail" | "specimen" | "datetime";

/**
 * 스타일이 적용된 문자 정보
 */
interface StyledChar {
  char: string;
  type: SegmentType;
}

/**
 * 세그먼트 타입별 폰트 설정 반환
 */
function getFontForType(type: SegmentType) {
  switch (type) {
    case "name":
      return FONT.PATIENT_NAME;
    case "detail":
      return FONT.PATIENT_DETAIL;
    case "specimen":
      return FONT.SPECIMEN;
    case "datetime":
      return FONT.DATETIME;
  }
}

/**
 * 문자의 너비 계산
 */
function getCharWidth(char: string, type: SegmentType): number {
  const font = getFontForType(type);
  const isKorean = /[가-힣]/.test(char);
  return isKorean ? font.width : font.width * 0.6;
}

/**
 * 텍스트를 break-all 방식으로 렌더링하고 사용한 줄 수 반환
 * @returns 사용한 물리적 줄 수
 */
function renderTextWithBreakAll(
  styledChars: StyledChar[],
  startY: number,
  marginLeft: number,
  printWidth: number,
  lineHeight: number
): number {
  // 줄 단위로 그룹화
  type LineSegment = { text: string; type: SegmentType; x: number };
  const lines: LineSegment[][] = [];
  let currentLine: LineSegment[] = [];
  let currentX = 0;
  let currentSegment: LineSegment | null = null;

  for (const { char, type } of styledChars) {
    const charWidth = getCharWidth(char, type);

    // 줄바꿈 필요 체크
    if (currentX + charWidth > printWidth && currentX > 0) {
      if (currentSegment && currentSegment.text.length > 0) {
        currentLine.push(currentSegment);
      }
      lines.push(currentLine);
      currentLine = [];
      currentX = 0;
      currentSegment = null;
    }

    // 새 세그먼트 시작 또는 기존 세그먼트에 추가
    if (!currentSegment || currentSegment.type !== type) {
      if (currentSegment && currentSegment.text.length > 0) {
        currentLine.push(currentSegment);
      }
      currentSegment = { text: char, type, x: currentX };
    } else {
      currentSegment.text += char;
    }

    currentX += charWidth;
  }

  // 마지막 세그먼트와 줄 저장
  if (currentSegment && currentSegment.text.length > 0) {
    currentLine.push(currentSegment);
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // 배열 내 사용된 타입들의 최대 폰트 높이 계산
  const usedTypes = new Set<SegmentType>();
  for (const { type } of styledChars) {
    usedTypes.add(type);
  }
  let maxFontHeight = 0;
  for (const type of usedTypes) {
    const font = getFontForType(type);
    if (font.height > maxFontHeight) {
      maxFontHeight = font.height;
    }
  }

  // 각 줄 출력
  let y = startY;

  for (const line of lines) {
    for (const segment of line) {
      const font = getFontForType(segment.type);
      // 하단 정렬: 해당 줄의 최대 폰트 높이 기준
      const yOffset = maxFontHeight - font.height;

      drawVectorFont(
        segment.text,
        marginLeft + segment.x,
        y + yOffset,
        FONT_TYPE_KOREAN,
        font.width,
        font.height,
        0,
        font.bold
      );
    }
    y += lineHeight;
  }

  return lines.length;
}

/**
 * 텍스트 너비 계산
 */
function calculateTextWidth(styledChars: StyledChar[]): number {
  let width = 0;
  for (const { char, type } of styledChars) {
    width += getCharWidth(char, type);
  }
  return width;
}

/**
 * 문자열을 StyledChar 배열로 변환
 */
function toStyledChars(text: string, type: SegmentType): StyledChar[] {
  const chars: StyledChar[] = [];
  for (const char of text) {
    chars.push({ char, type });
  }
  return chars;
}

/**
 * 검사 라벨 렌더링
 * 라벨 버퍼에 환자 정보와 검체 정보를 그립니다.
 *
 * 레이아웃 (4줄):
 * - 1줄: 차트번호 (bold) - LINE_1_Y
 * - 2줄: 이름(나이/성별) 생년월일 - LINE_2_Y
 * - 3줄: 검체명 - LINE_3_Y
 * - 4줄: 출력일시 - LINE_4_Y
 *
 * 동작:
 * - 각 줄이 너비에 맞으면 고정 위치에 출력
 * - 2줄이 넘치면: 2줄+3줄+4줄이 break-all로 연속 출력
 * - 3줄이 넘치면: 3줄+4줄이 break-all로 연속 출력
 */
export function renderExaminationLabel(data: LabelData): void {
  // 라벨 설정 초기화
  initializeLabelSettings();

  const { MARGIN_LEFT, PRINT_WIDTH, LINE_1_Y, LINE_2_Y, LINE_3_Y, LINE_4_Y, LINE_HEIGHT } = LABEL_LAYOUT;

  // 1줄: 차트번호 (bold)
  drawVectorFont(
    data.chartNumber,
    MARGIN_LEFT,
    LINE_1_Y,
    FONT_TYPE_KOREAN,
    FONT.CHART_NUMBER.width,
    FONT.CHART_NUMBER.height,
    0,
    FONT.CHART_NUMBER.bold
  );

  // 각 줄의 스타일 문자 배열 생성
  const genderText = data.gender === "M" ? "남" : "여";
  const birthDateShort = formatBirthDateShort(data.birthDate);
  const ageText = getAgeOrMonth(data.birthDate, "en");
  const patientDetail = ` (${ageText}/${genderText}) ${birthDateShort}`;

  const patientChars: StyledChar[] = [
    ...toStyledChars(data.patientName, "name"),
    ...toStyledChars(patientDetail, "detail"),
  ];
  const specimenChars = toStyledChars(data.specimenName ?? "", "specimen");
  const datetimeChars = toStyledChars(data.printDateTime, "datetime");

  // 너비 계산
  const patientWidth = calculateTextWidth(patientChars);
  const specimenWidth = calculateTextWidth(specimenChars);

  const patientFitsOneLine = patientWidth <= PRINT_WIDTH;
  const specimenFitsOneLine = specimenWidth <= PRINT_WIDTH;

  if (patientFitsOneLine) {
    // 2줄: 환자정보가 1줄에 들어감 → 고정 위치 출력
    renderTextWithBreakAll(patientChars, LINE_2_Y, MARGIN_LEFT, PRINT_WIDTH, LINE_HEIGHT);

    if (specimenFitsOneLine) {
      // 3줄: 검체명도 1줄에 들어감 → 고정 위치 출력
      renderTextWithBreakAll(specimenChars, LINE_3_Y, MARGIN_LEFT, PRINT_WIDTH, LINE_HEIGHT);

      // 4줄: 출력일시 → 고정 위치 출력
      renderTextWithBreakAll(datetimeChars, LINE_4_Y, MARGIN_LEFT, PRINT_WIDTH, LINE_HEIGHT);
    } else {
      // 3줄이 넘침 → 검체명 + 출력일시를 break-all로 연속 출력
      const combinedChars: StyledChar[] = [
        ...specimenChars,
        { char: " ", type: "datetime" },
        ...datetimeChars,
      ];
      renderTextWithBreakAll(combinedChars, LINE_3_Y, MARGIN_LEFT, PRINT_WIDTH, LINE_HEIGHT);
    }
  } else {
    // 2줄이 넘침 → 환자정보 + 검체명 + 출력일시를 break-all로 연속 출력
    const combinedChars: StyledChar[] = [
      ...patientChars,
      { char: " ", type: "specimen" },
      ...specimenChars,
      { char: " ", type: "datetime" },
      ...datetimeChars,
    ];
    renderTextWithBreakAll(combinedChars, LINE_2_Y, MARGIN_LEFT, PRINT_WIDTH, LINE_HEIGHT);
  }

  // 출력 버퍼 완료
  printBuffer();
}

/**
 * 현재 날짜/시간을 라벨 출력용 포맷으로 반환
 * 형식: YY-MM-DD HH:mm (예: 25-05-05 09:25)
 */
export function getCurrentPrintDateTime(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 환자 정보와 검체 정보로 라벨 데이터 생성
 */
export function createLabelData(patient: PatientInfo, specimenName: string): LabelData {
  return {
    chartNumber: patient.chartNumber,
    patientName: patient.patientName,
    age: patient.age,
    gender: patient.gender,
    birthDate: patient.birthDate,
    specimenName,
    printDateTime: getCurrentPrintDateTime(),
  };
}

/**
 * 검체 목록에 대해 라벨 출력 실행
 * @param printerName 프린터 이름
 * @param patient 환자 정보
 * @param specimens 출력할 검체 목록
 * @returns 출력 결과
 */
export async function printExaminationLabels(
  printerName: string,
  patient: PatientInfo,
  specimens: SpecimenPrintItem[]
): Promise<PrintResult> {
  // SDK 초기화
  await initializeLabelPrinter();

  let totalPrinted = 0;

  for (const specimen of specimens) {
    for (let i = 0; i < specimen.quantity; i++) {
      // 라벨 데이터 생성 및 이미지 렌더링 (프린터용 - HTML 방식)
      const labelData = createLabelData(patient, specimen.specimenName);
      const imageDataUrl = await renderLabelToDataUrlForPrintHtml(labelData);

      // Bixolon SDK 버퍼 초기화
      setLabelId(getNextLabelId());
      clearBuffer();

      const widthDots = LABEL_SIZE.WIDTH_DOTS * BITMAP_PRINT_SCALE;
      const heightDots = LABEL_SIZE.HEIGHT_DOTS * BITMAP_PRINT_SCALE;
      const gapDots = LABEL_SIZE.GAP_DOTS * BITMAP_PRINT_SCALE;

      setWidth(widthDots);
      setLength(heightDots, gapDots, "G", 0);

      // 이미지 그리기 (좌표 0,0에서 시작)
      // dither=0: 글자(고대비) 선명도 개선 목적
      drawBitmap(imageDataUrl, 0, 0, widthDots, 0);

      // 출력 버퍼 완료
      printBuffer();

      // 프린터로 출력 요청
      const result = await requestPrint(printerName);

      if (result.success) {
        totalPrinted++;
      } else {
        // 출력 실패 시 중단
        return {
          success: false,
          message: `출력 실패 (${totalPrinted}/${getTotalQuantity(specimens)}): ${result.message}`,
        };
      }
    }
  }

  return {
    success: true,
    message: `총 ${totalPrinted}장 출력 완료`,
  };
}

/**
 * 검체 목록의 총 출력 수량 계산
 */
export function getTotalQuantity(specimens: SpecimenPrintItem[]): number {
  return specimens.reduce((total, item) => total + item.quantity, 0);
}

/**
 * 테스트 라벨 출력 (연결 테스트용)
 */
export async function printTestLabel(printerName: string): Promise<PrintResult> {
  const testPatient: PatientInfo = {
    chartNumber: "TEST-001",
    patientName: "테스트환자",
    age: 30,
    gender: "M",
    birthDate: "1995-01-01",
  };

  const testSpecimen: SpecimenPrintItem = {
    specimenCode: "TEST",
    specimenName: "Test Specimen",
    quantity: 1,
  };

  return printExaminationLabels(printerName, testPatient, [testSpecimen]);
}

/**
 * 라벨 미리보기용 레이아웃 정보 생성
 * Canvas나 HTML로 미리보기를 렌더링할 때 사용
 */
export interface PreviewTextItem {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
}

export interface LabelPreviewData {
  width: number;
  height: number;
  items: PreviewTextItem[];
}

/**
 * 라벨 미리보기 데이터 생성
 */
export function generateLabelPreview(data: LabelData): LabelPreviewData {
  const { MARGIN_LEFT, PRINT_WIDTH, LINE_1_Y, LINE_2_Y, LINE_3_Y, LINE_4_Y, LINE_HEIGHT } = LABEL_LAYOUT;
  const items: PreviewTextItem[] = [];

  // 1줄: 차트번호
  items.push({
    text: data.chartNumber,
    x: MARGIN_LEFT,
    y: LINE_1_Y,
    fontSize: FONT.CHART_NUMBER.height,
    fontWeight: FONT.CHART_NUMBER.bold ? "bold" : "normal",
  });

  // 각 줄의 스타일 문자 배열 생성
  const genderText = data.gender === "M" ? "남" : "여";
  const birthDateShort = formatBirthDateShort(data.birthDate);
  const previewAgeText = getAgeOrMonth(data.birthDate, "en");
  const patientDetail = ` (${previewAgeText}/${genderText}) ${birthDateShort}`;

  const patientChars: StyledChar[] = [
    ...toStyledChars(data.patientName, "name"),
    ...toStyledChars(patientDetail, "detail"),
  ];
  const specimenChars = toStyledChars(data.specimenName ?? "", "specimen");
  const datetimeChars = toStyledChars(data.printDateTime, "datetime");

  const patientWidth = calculateTextWidth(patientChars);
  const specimenWidth = calculateTextWidth(specimenChars);

  const patientFitsOneLine = patientWidth <= PRINT_WIDTH;
  const specimenFitsOneLine = specimenWidth <= PRINT_WIDTH;

  if (patientFitsOneLine) {
    // 환자정보 1줄
    items.push({
      text: data.patientName + patientDetail,
      x: MARGIN_LEFT,
      y: LINE_2_Y,
      fontSize: FONT.PATIENT_NAME.height,
      fontWeight: "bold",
    });

    if (specimenFitsOneLine) {
      // 검체명, 출력일시 각각 고정 위치
      items.push({
        text: data.specimenName ?? "",
        x: MARGIN_LEFT,
        y: LINE_3_Y,
        fontSize: FONT.SPECIMEN.height,
        fontWeight: "normal",
      });
      items.push({
        text: data.printDateTime,
        x: MARGIN_LEFT,
        y: LINE_4_Y,
        fontSize: FONT.DATETIME.height,
        fontWeight: "normal",
      });
    } else {
      // 검체명 + 출력일시 연속
      items.push({
        text: (data.specimenName ?? "") + " " + data.printDateTime,
        x: MARGIN_LEFT,
        y: LINE_3_Y,
        fontSize: FONT.SPECIMEN.height,
        fontWeight: "normal",
      });
    }
  } else {
    // 모든 내용 연속 (break-all 표시)
    const combinedText = data.patientName + patientDetail + " " + (data.specimenName ?? "") + " " + data.printDateTime;
    
    // 간단히 줄바꿈 시뮬레이션
    const avgCharWidth = 20; // 대략적인 평균 문자 너비
    const charsPerLine = Math.floor(PRINT_WIDTH / avgCharWidth);
    let y = LINE_2_Y;
    
    for (let i = 0; i < combinedText.length; i += charsPerLine) {
      const lineText = combinedText.slice(i, i + charsPerLine);
      items.push({
        text: lineText,
        x: MARGIN_LEFT,
        y: y,
        fontSize: 24,
        fontWeight: "normal",
      });
      y += LINE_HEIGHT;
    }
  }

  return {
    width: 320,
    height: 200,
    items,
  };
}
