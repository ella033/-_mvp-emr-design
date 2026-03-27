export enum FieldType {
  TEXT = 1, // 일반 텍스트
  NUMBER = 2, // 숫자
  DATE = 3, // 날짜
  DATETIME = 4, // 날짜 시간
  TEXTAREA = 5, // 텍스트 영역
  CHECKBOX = 6, // 체크박스
  SELECT = 7, // 선택(드롭다운)
  SIGNATURE = 8, // 서명
  IMAGE = 9, // 이미지
  STAMP = 10, // 직인/도장
  // FIXME: 새로운 타입 추가? (지금은 임시 타입)
  DIAGNOSIS_TABLE = 11, // 진단 테이블 (상병명, 청구코드)
}

export type FieldFontWeight = 'normal' | 'bold';
export type FieldTextAlign = 'left' | 'center' | 'right';

export enum CheckboxLabelFormat {
  TEXT = 'text',
  HTML = 'html',
}

/**
 * 필드 값 변환에 사용되는 컨버터 enum
 * - BIRTH_DATE_TO_AGE: 생년월일 → 나이
 * - RRN_TO_MASKED: 주민등록번호 → 마스킹된 형태
 * - GENDER_TO_TEXT: 성별코드(1,2) → 남/여
 * - PHONE_TO_FORMATTED: 전화번호 → 포맷팅된 형태 (예: 010-1234-5678)
 * - RRN_TO_FORMATTED: 주민등록번호 → 하이픈 포맷팅 (예: 900101-1234567)
 */
export enum FieldConverter {
  BIRTH_DATE_TO_AGE = 'birthDateToAge',
  RRN_TO_MASKED = 'rrnToMasked',
  RRN_TO_FORMATTED = 'rrnToFormatted',
  GENDER_TO_TEXT = 'genderToText',
  PHONE_TO_FORMATTED = 'phoneToFormatted',
}

/**
 * 필드 기본값으로 사용할 수 있는 서버 치환 값
 * - '{{today}}': 오늘 날짜
 * - '{{now}}': 현재 날짜시간
 */
export type FieldDefaultValue = '{{today}}' | '{{now}}';

export interface FieldOptions {
  placeholder?: string;
  converter?: FieldConverter;
  resolver?: string; // 값 해결기 키 (클라이언트에서 동적으로 값을 생성할 때 사용)
  dateFormat?: string; // 날짜 포맷 (moment.js 포맷 문자열, 예: 'YYYY-MM-DD', 'YYYY년 MM월 DD일')
  dateSplit?: {
    groupId: string;
    part: 'year' | 'month' | 'day';
    ui?: 'select' | 'combo';
    yearRange?: { start: number; end: number };
  };
  radioGroup?: string; // 체크박스 필드가 라디오처럼 하나만 선택 가능하게 할 때 사용하는 그룹 이름 (같은 radioGroup을 가진 체크박스 중 하나만 선택 가능)
  score?: number; // 체크박스가 체크되었을 때 부여할 점수
  scoreGroup?: string; // 점수 계산 그룹 이름 (같은 그룹의 체크박스 점수를 합산)
  checkboxLabelFormat?: CheckboxLabelFormat; // 체크박스 라벨 표시 형식
  checkboxLabelText?: string; // 체크박스 라벨 (plain text)
  checkboxLabelHtml?: string; // 체크박스 라벨 (sanitized html)
  checkboxHitPaddingPx?: number; // 체크박스 클릭 영역 여유(px). 설정 시 기본값(라벨 유무별)을 덮어씁니다. (hitArea 미설정 시 사용)
  // 체크박스 클릭 영역(히트 영역) 설정 - 드래그/리사이즈로 조절 가능
  // 설정되면 checkboxHitPaddingPx보다 우선 적용됨
  checkboxHitAreaX?: number; // 클릭 영역 X 좌표 (체크박스 기준 상대 위치)
  checkboxHitAreaY?: number; // 클릭 영역 Y 좌표 (체크박스 기준 상대 위치)
  checkboxHitAreaWidth?: number; // 클릭 영역 너비
  checkboxHitAreaHeight?: number; // 클릭 영역 높이
  diagnosisTable?: {
    nameColumnRatio: number; // 상병명 컬럼 비율 (0-1, 예: 0.5 = 50%)
    codeColumnStartRatio?: number; // 분류기호 컬럼 시작 비율 (0-1). 미설정 시 nameColumnRatio 사용 (gap 없음)
    rowHeight: number; // row 높이
    rows: Array<{ name: string; code: string }>; // 테이블 데이터
  };
  dateRange?: {
    startResolver?: string; // 시작일 값 해결기 키
    endResolver?: string; // 종료일 값 해결기 키
    separator?: string; // 구분자 (기본값: '~')
    startDate?: string; // 시작일 값 (YYYY-MM-DD)
    endDate?: string; // 종료일 값 (YYYY-MM-DD)
  };
  [key: string]: unknown;
}

/**
 * 좌측 사이드바에서 "추가"할 때 사용할 프리셋 정의
 * - keyPrefix: 서버 등록용 key 생성에 사용 (예: `${keyPrefix}_001`)
 */
export interface DataItem {
  keyPrefix: string;
  name: string;
  type: FieldType;
  dataSource: string;
  options?: FieldOptions;
}

/**
 * 서버 등록용 필드 스키마에 맞춘 모델
 */
export interface AddedField {
  key: string;
  name: string;
  type: FieldType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: FieldFontWeight;
  textAlign: FieldTextAlign;
  order: number;
  dataSource: string;
  options?: FieldOptions;
  defaultValue?: FieldDefaultValue; // DATE/DATETIME 타입일 때 사용 가능한 서버 치환 값
}

