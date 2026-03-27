const BOOLEAN_FALSE_VALUES = new Set(["N", "0", "FALSE", "F", "NO"]);
const DATE_YYYYMMDD_REGEX = /^\d{8}$/;

export const EXTRA_QUALIFICATION_FLAG_KEYS = {
  PREGNANT: "임신부",
  INFERTILITY_TREATMENT: "난임치료",
} as const;

export type ExtraQualificationFlagKey = (typeof EXTRA_QUALIFICATION_FLAG_KEYS)[keyof typeof EXTRA_QUALIFICATION_FLAG_KEYS];

function normalizeExtraQualificationValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim().toUpperCase();
}

function getStringFromMaybeStringDataField(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const anyValue = value as any;
    if ("data" in anyValue) {
      const data = anyValue.data;
      return typeof data === "string" ? data.trim() : "";
    }
  }
  return "";
}

function resolveEncounterDateTime(encounterDateTime?: Date | string | null): Date {
  if (!encounterDateTime) return new Date();
  if (encounterDateTime instanceof Date) {
    return isNaN(encounterDateTime.getTime()) ? new Date() : encounterDateTime;
  }
  const parsed = new Date(encounterDateTime);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isValidYyyyMmDd(dateStr: string): boolean {
  return !!dateStr && DATE_YYYYMMDD_REGEX.test(dateStr);
}

function isEncounterInDateRange(encounter: Date, startYmd: string, endYmd: string): boolean {
  // date-utils의 parseDateString은 실패 시 MinDate를 반환하므로, 형식 검증을 선행
  if (!isValidYyyyMmDd(startYmd) || !isValidYyyyMmDd(endYmd)) return false;

  // 로컬 Date로 파싱 (YYYYMMDD)
  const startYear = parseInt(startYmd.slice(0, 4), 10);
  const startMonth = parseInt(startYmd.slice(4, 6), 10) - 1;
  const startDay = parseInt(startYmd.slice(6, 8), 10);
  const endYear = parseInt(endYmd.slice(0, 4), 10);
  const endMonth = parseInt(endYmd.slice(4, 6), 10) - 1;
  const endDay = parseInt(endYmd.slice(6, 8), 10);

  const start = new Date(startYear, startMonth, startDay);
  const end = new Date(endYear, endMonth, endDay);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return start <= encounter && encounter <= end;
}

/**
 * DiseaseRegistrationPersonBase(유사) 형태의 산정특례/중증 항목이 '진료일시' 기준 유효한지 검사합니다.
 * - 지원 형태: 필드값이 문자열이거나, { data: string } 형태이거나, 혼합된 DTO 형태
 * - 요구 조건: 특정기호, 등록번호, 등록일(또는 시작유효일)이 존재 + 진료일시가 (등록일~종료일) 범위 내
 */
function isDiseaseRegistrationActive(
  extraQualification: Record<string, any> | undefined,
  key: string,
  encounterDateTime?: Date | string | null
): boolean {
  const field = extraQualification?.[key];
  if (!field || typeof field !== "object") return false;

  const anyField = field as any;

  // 빈 객체면 데이터 없음
  if (Object.keys(anyField).length === 0) return false;

  const specificCode =
    getStringFromMaybeStringDataField(anyField["특정기호"]) ||
    getStringFromMaybeStringDataField(anyField["specificCode"]);
  const registeredCode =
    getStringFromMaybeStringDataField(anyField["등록번호"]) ||
    getStringFromMaybeStringDataField(anyField["registeredCode"]);

  // 일부 항목은 시작/종료 필드명이 다를 수 있어 fallback 지원
  const startYmd =
    getStringFromMaybeStringDataField(anyField["등록일"]) ||
    getStringFromMaybeStringDataField(anyField["시작유효일"]) ||
    getStringFromMaybeStringDataField(anyField["시작유효일자"]) ||
    getStringFromMaybeStringDataField(anyField["지원시작일"]) ||
    getStringFromMaybeStringDataField(anyField["치료시작일자"]) ||
    getStringFromMaybeStringDataField(anyField["approvedDate"]);

  const endCandidate =
    getStringFromMaybeStringDataField(anyField["종료일"]) ||
    getStringFromMaybeStringDataField(anyField["상실유효일"]) ||
    getStringFromMaybeStringDataField(anyField["종료유효일자"]) ||
    getStringFromMaybeStringDataField(anyField["지원종료일"]) ||
    getStringFromMaybeStringDataField(anyField["치료종료일자"]) ||
    getStringFromMaybeStringDataField(anyField["validity"]);

  if (!specificCode || !registeredCode || !startYmd) return false;

  const endYmd = endCandidate ? endCandidate : "99991231";
  if (!isValidYyyyMmDd(startYmd)) return false;
  if (endCandidate && !isValidYyyyMmDd(endCandidate)) return false;

  const encounter = resolveEncounterDateTime(encounterDateTime);
  return isEncounterInDateRange(encounter, startYmd, endYmd);
}

function isStringDataFieldTruthy(
  extraQualification: Record<string, any> | undefined,
  key: string
): boolean {
  const field = extraQualification?.[key];
  if (!field || typeof field !== "object") return false;
  const data = getStringFromMaybeStringDataField((field as any).data ?? (field as any));
  const normalized = normalizeExtraQualificationValue(data);
  return !!normalized && !BOOLEAN_FALSE_VALUES.has(normalized);
}

/**
 * extraQualification에서 추가적인  StringDataField 값을 읽어옵니다. (임신부, 난임치료)
 */
export function getAdditionalExtraQualificationFlag(
  extraQualification: Record<string, any> | undefined,
  key: string,
  fallbackValue = false
): boolean {
  const field = extraQualification?.[key];
  if (!field || typeof field !== "object" || !("data" in field)) {
    return fallbackValue;
  }

  const normalizedValue = normalizeExtraQualificationValue(field.data);

  if (!normalizedValue || BOOLEAN_FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  return true;
}

export function is임신부(
  extraQualification: Record<string, any> | undefined,
  fallbackValue = false
): boolean {
  return getAdditionalExtraQualificationFlag(
    extraQualification,
    EXTRA_QUALIFICATION_FLAG_KEYS.PREGNANT,
    fallbackValue,
  );
}

export function is난임치료(
  extraQualification: Record<string, any> | undefined,
  fallbackValue = false
): boolean {
  return getAdditionalExtraQualificationFlag(
    extraQualification,
    EXTRA_QUALIFICATION_FLAG_KEYS.INFERTILITY_TREATMENT,
    fallbackValue,
  );
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다. (임신부 upsertDate 저장용)
 */
export function getCurrentYyyyMmDdHyphen(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * YYYY-MM-DD 또는 YYYYMMDD 문자열을 Date로 파싱합니다. 실패 시 null.
 */
function parseUpsertDateToDate(value: string): Date | null {
  const s = String(value).trim();
  if (!s) return null;
  let y: number, m: number, d: number;
  if (s.includes("-")) {
    const [yy, mm, dd] = s.split("-").map(Number);
    if (!yy || !mm || !dd) return null;
    y = yy;
    m = mm - 1;
    d = dd;
  } else if (DATE_YYYYMMDD_REGEX.test(s)) {
    y = parseInt(s.slice(0, 4), 10);
    m = parseInt(s.slice(4, 6), 10) - 1;
    d = parseInt(s.slice(6, 8), 10);
  } else {
    return null;
  }
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Date를 YYYY-MM-DD 문자열로 반환합니다.
 */
export function formatDateToYyyyMmDdHyphen(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * extraQualification 객체에 boolean 값을 StringDataField 형태로 병합합니다.
 */
export function mergeAdditionalExtraQualificationFlag(
  extraQualification: Record<string, any> | undefined,
  key: string,
  checked: boolean
): Record<string, any> {
  const newExtraQualification = { ...(extraQualification || {}) };
  newExtraQualification[key] = { data: checked ? "Y" : "N" };
  return newExtraQualification;
}

/** 임신부 merge 시 추가 옵션: upsertDate(기준일), week(주), day(일) */
export interface Merge임신부Options {
  /** 기준일 (YYYY-MM-DD). 미지정 시 체크 시점 날짜 사용 */
  upsertDate?: string;
  /** 주 (1~43) */
  week?: number;
  /** 일 (0~31) */
  day?: number;
}

/**
 * 임신부 여부만 별도 처리: 체크 시 data "Y" + upsertDate(기준일) + week/day, 해제 시 data "N" + upsertDate "".
 * input 수정 시 해당 날짜를 기준일(upsertDate)로, 입력한 주·일을 저장합니다.
 *
 * 호출 규칙: 체크박스 토글이나 주/일 input 직접 수정 시에만 호출할 것.
 * 접수일(selectedDate) 변경으로 week/day 표시만 바뀌는 경우에는 호출하지 말고,
 * 기존 extraQualification(upsertDate, week, day)을 그대로 유지해야 함.
 */
export function merge임신부ExtraQualificationFlag(
  extraQualification: Record<string, any> | undefined,
  checked: boolean,
  options?: Merge임신부Options
): Record<string, any> {
  const newExtraQualification = { ...(extraQualification || {}) };
  if (!checked) {
    newExtraQualification[EXTRA_QUALIFICATION_FLAG_KEYS.PREGNANT] = {
      data: "N",
      upsertDate: "",
    };
    return newExtraQualification;
  }
  const upsertDate =
    options?.upsertDate ?? getCurrentYyyyMmDdHyphen();
  const week = Math.min(43, Math.max(0, options?.week ?? 0));
  const day = Math.min(31, Math.max(0, options?.day ?? 0));
  newExtraQualification[EXTRA_QUALIFICATION_FLAG_KEYS.PREGNANT] = {
    data: "Y",
    upsertDate,
    week,
    day,
  };
  return newExtraQualification;
}

/** 임신부 주·일 계산 결과. overLimit 시 43주 6일 초과로 임신부 체크 해제 필요 */
export interface 임신부WeekAndDay {
  week: number;
  day: number;
  overLimit?: boolean;
}

const PREGNANCY_MAX_TOTAL_DAYS = 43 * 7 + 6; // 43주 6일

/**
 * 저장된 upsertDate + (week, day) 기준으로, selectedDate 당일 기준 임신 주차·일수를 계산합니다.
 * LMP = upsertDate - (week*7 + day) 일, selectedDate 기준 gestationalDays = selectedDate - LMP.
 * 표시 전용이며, 이 반환값으로 extraQualification을 갱신하지 말 것. (접수일 변경 시 표시만 갱신)
 */
export function get임신부WeekAndDay(
  extraQualification: Record<string, any> | undefined,
  selectedDate?: Date | string | null
): 임신부WeekAndDay | null {
  const field = extraQualification?.[EXTRA_QUALIFICATION_FLAG_KEYS.PREGNANT];
  if (!field || typeof field !== "object") return null;
  const data = getStringFromMaybeStringDataField(field.data);
  if (!data || BOOLEAN_FALSE_VALUES.has(normalizeExtraQualificationValue(data)))
    return null;

  const upsertDateStr =
    (typeof (field as any).upsertDate === "string"
      ? (field as any).upsertDate.trim()
      : "") ||
    getStringFromMaybeStringDataField((field as any).upsertDate);
  if (!upsertDateStr) return null;

  const upsertDate = parseUpsertDateToDate(upsertDateStr);
  if (!upsertDate) return null;

  const storedWeek = Math.max(0, Number((field as any).week) || 0);
  const storedDay = Math.max(0, Number((field as any).day) || 0);
  // 저장된 주가 43 초과면 임신부 체크 해제 (실제 입력값 기준)
  if (storedWeek > 43) {
    return { week: 43, day: 6, overLimit: true };
  }
  const totalDaysAtUpsert = storedWeek * 7 + storedDay;

  const ref = resolveEncounterDateTime(selectedDate);
  ref.setHours(0, 0, 0, 0);
  upsertDate.setHours(0, 0, 0, 0);
  const diffMs = ref.getTime() - upsertDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const totalDays = totalDaysAtUpsert + diffDays;
  if (totalDays < 0) return { week: 0, day: 0 };

  if (totalDays > PREGNANCY_MAX_TOTAL_DAYS) {
    return { week: 43, day: 6, overLimit: true };
  }

  return {
    week: Math.floor(totalDays / 7),
    day: totalDays % 7,
  };
}

/**
 * selectedDate 기준 임신 주수가 43주 0일 이상이면 insuranceInfo에서 임신부를 해제합니다.
 * 빠른접수/예약접수전환/추가접수/검색바 조회 등 비즈니스 로직에서 호출.
 */
export function clear임신부IfOverLimit(
  insuranceInfo: { is임신부?: boolean; extraQualification?: Record<string, any> },
  selectedDate?: Date | string | null
): void {
  if (!insuranceInfo?.is임신부) return;
  const weekDay = get임신부WeekAndDay(insuranceInfo.extraQualification, selectedDate);
  if (weekDay && weekDay.week >= 43) {
    insuranceInfo.is임신부 = false;
    insuranceInfo.extraQualification = merge임신부ExtraQualificationFlag(
      insuranceInfo.extraQualification,
      false
    );
  }
}

/**
 * selectedDate 기준 임신 주차만 반환합니다. (1~43, 없으면 0)
 */
export function get임신부WeekNum(
  extraQualification: Record<string, any> | undefined,
  selectedDate?: Date | string | null
): number {
  const result = get임신부WeekAndDay(extraQualification, selectedDate);
  return result?.week ?? 0;
}

/**
 * extraQualification에서 임신부 기준일(upsertDate) 문자열을 반환합니다. (YYYY-MM-DD 형식, 없으면 "")
 * 툴팁 등 표시용.
 */
export function get임신부UpsertDate(
  extraQualification: Record<string, any> | undefined
): string {
  const field = extraQualification?.[EXTRA_QUALIFICATION_FLAG_KEYS.PREGNANT];
  if (!field || typeof field !== "object") return "";
  const data = getStringFromMaybeStringDataField(field.data);
  if (!data || BOOLEAN_FALSE_VALUES.has(normalizeExtraQualificationValue(data)))
    return "";
  const upsertDateStr =
    (typeof (field as any).upsertDate === "string"
      ? (field as any).upsertDate.trim()
      : "") ||
    getStringFromMaybeStringDataField((field as any).upsertDate);
  return upsertDateStr || "";
}

// ============================================================================
// 추가자격 판정 유틸 (산정특례/중증/결핵/조산아/자립준비청년 등)
// - 백엔드 CalcApiIntegrationsService 참고
// ============================================================================

export function is산정특례(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return (
    is산정특례희귀질환등록대상자(extraQualification, encounterDateTime) ||
    is산정특례극희귀등록대상자(extraQualification, encounterDateTime) ||
    is산정특례상세불명희귀등록대상자(extraQualification, encounterDateTime) ||
    is산정특례중증난치질환등록대상자(extraQualification, encounterDateTime) ||
    is산정특례기타염색체이상질환등록대상자(extraQualification, encounterDateTime)
  );
}

export function is산정특례희귀질환등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례희귀질환등록대상자", encounterDateTime);
}

export function is산정특례극희귀등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례극희귀등록대상자", encounterDateTime);
}

export function is산정특례상세불명희귀등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례상세불명희귀등록대상자", encounterDateTime);
}

export function is산정특례중증난치질환등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례중증난치질환등록대상자", encounterDateTime);
}

export function is산정특례기타염색체이상질환등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례기타염색체이상질환등록대상자", encounterDateTime);
}

export function is중증(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return (
    is산정특례암등록대상자1(extraQualification, encounterDateTime) ||
    is산정특례화상등록대상자(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자2(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자3(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자4(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자5(extraQualification, encounterDateTime)
  );
}

export function is중증암(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return (
    is산정특례암등록대상자1(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자2(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자3(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자4(extraQualification, encounterDateTime) ||
    is산정특례중복암등록대상자5(extraQualification, encounterDateTime)
  );
}

export function is산정특례암등록대상자1(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례암등록대상자1", encounterDateTime);
}

export function is산정특례화상등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례화상등록대상자", encounterDateTime);
}

export function is산정특례중복암등록대상자2(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례중복암등록대상자2", encounterDateTime);
}

export function is산정특례중복암등록대상자3(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례중복암등록대상자3", encounterDateTime);
}

export function is산정특례중복암등록대상자4(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례중복암등록대상자4", encounterDateTime);
}

export function is산정특례중복암등록대상자5(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례중복암등록대상자5", encounterDateTime);
}

export function is출국자(
  extraQualification: Record<string, any> | undefined
): boolean {
  // 키: "출국자여부" (StringDataField)
  return isStringDataFieldTruthy(extraQualification, "출국자여부");
}

export function is급여제한(
  extraQualification: Record<string, any> | undefined
): boolean {
  // 키: "급여제한여부" (StringDataField)
  // NOTE: "00"은 '해당없음'으로 취급 (nhic-form-utils의 계산 로직과 정합)
  const field = extraQualification?.["급여제한여부"];
  if (!field || typeof field !== "object") return false;
  const raw = getStringFromMaybeStringDataField((field as any).data ?? field);
  const normalized = normalizeExtraQualificationValue(raw);
  if (!normalized || BOOLEAN_FALSE_VALUES.has(normalized)) return false;
  if (normalized === "00") return false;
  return true;
}

export function is당뇨병요양비대상자유형(
  extraQualification: Record<string, any> | undefined
): boolean {
  // "01" / "02" 등 값이 존재하면 true
  return isStringDataFieldTruthy(extraQualification, "당뇨병요양비대상자유형");
}

export function is요양병원입원여부(
  extraQualification: Record<string, any> | undefined
): boolean {
  return isStringDataFieldTruthy(extraQualification, "요양병원입원여부");
}

export function is본인부담차등(
  extraQualification: Record<string, any> | undefined
): boolean {
  return isStringDataFieldTruthy(extraQualification, "본인부담차등여부");
}

export function is조산아및저체중아(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  // 키: "조산아및저체중출생아등록대상자"
  // 서버 응답은 PreInfantInfo(등록번호/시작유효일자/종료유효일자)일 수 있고,
  // 프론트 저장 형태는 { data: "Y" } 등으로 단순화되어 있을 수도 있어 둘 다 지원.
  const field = extraQualification?.["조산아및저체중출생아등록대상자"];
  if (!field) return false;

  // { data: "Y" } 형태 지원
  if (typeof field === "object" && "data" in (field as any)) {
    return isStringDataFieldTruthy(extraQualification, "조산아및저체중출생아등록대상자");
  }

  if (typeof field !== "object") return false;
  const anyField = field as any;
  const 등록번호 = getStringFromMaybeStringDataField(anyField["등록번호"]);
  const 시작유효일자 = getStringFromMaybeStringDataField(anyField["시작유효일자"]);
  const 종료유효일자 = getStringFromMaybeStringDataField(anyField["종료유효일자"]);

  if (!등록번호) return false;
  if (!isValidYyyyMmDd(시작유효일자)) return false;
  const endYmd = isValidYyyyMmDd(종료유효일자) ? 종료유효일자 : "99991231";

  const encounter = resolveEncounterDateTime(encounterDateTime);
  return isEncounterInDateRange(encounter, 시작유효일자, endYmd);
}

export function is결핵(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return (
    is산정특례결핵등록대상자(extraQualification, encounterDateTime) ||
    is요양기관별산정특례결핵등록대상자(extraQualification, encounterDateTime)
  );
}

export function is산정특례결핵등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  return isDiseaseRegistrationActive(extraQualification, "산정특례결핵등록대상자", encounterDateTime);
}

export function is요양기관별산정특례결핵등록대상자(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  // 프론트의 기본 옵션에는 포함되지 않지만, 서버/타 시스템에서 내려올 수 있어 지원
  // 예상 키: "요양기관별산정특례결핵등록대상자"
  return isDiseaseRegistrationActive(extraQualification, "요양기관별산정특례결핵등록대상자", encounterDateTime);
}

export function is중증치매(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  // 시스템에 따라 (등록일/종료일) 또는 (시작유효일/상실유효일) 형태가 섞일 수 있어 fallback 허용.
  return isDiseaseRegistrationActive(extraQualification, "산정특례중증치매등록대상자", encounterDateTime);
}

export function is자립준비청년(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  // 키: "자립준비청년대상자"
  const field = extraQualification?.["자립준비청년대상자"];
  if (!field) return false;

  // 단순 StringDataField 형태 지원 ({ data: "Y" } 등)
  if (typeof field === "object" && "data" in (field as any)) {
    return isStringDataFieldTruthy(extraQualification, "자립준비청년대상자");
  }

  // SelfPreparationPersonInfo 형태 지원 (특정기호/지원시작일/지원종료일)
  return isDiseaseRegistrationActive(extraQualification, "자립준비청년대상자", encounterDateTime);
}

export function is비대면(
  extraQualification: Record<string, any> | undefined,
  encounterDateTime?: Date | string | null
): boolean {
  void encounterDateTime;

  const field = extraQualification?.["비대면진료대상정보"];
  if (!field || typeof field !== "object") return false;
  return Object.keys(field).length > 0;
}

