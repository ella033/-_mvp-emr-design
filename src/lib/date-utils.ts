import { MinDate } from "@/constants/common/common-enum";

// ============================================================================
// 날짜 문자열 → Date 객체 변환 함수들
// ============================================================================

/**
 * YYYYMMDD 형식의 문자열을 Date 객체로 변환
 * @param date - YYYYMMDD 형식의 8자리 문자열 (예: "20240101")
 * @returns Date 객체 (잘못된 형식이면 1970-01-01 반환)
 * @description 기본 날짜 파싱 함수로, 실패 시 1970-01-01을 반환합니다.
 */
export function convertDate(date: string): Date {
  if (!date || date.length !== 8) {
    return new Date(0);
  }
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(4, 6)) - 1;
  const day = parseInt(date.substring(6, 8));

  return new Date(year, month, day);
}

/**
 * 날짜 문자열(YYYYMMDD)을 Date로 변환 (MinDate 반환)
 * @param dateStr - YYYYMMDD 형식의 문자열
 * @returns Date 객체 (실패 시 MinDate 반환)
 * @description nhic-form에서 사용하는 날짜 파싱 함수로, 실패 시 MinDate를 반환합니다.
 */
export function parseDateString(dateStr: string): Date {
  if (!dateStr || dateStr.length !== 8) return MinDate;
  try {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? MinDate : date;
  } catch {
    return MinDate;
  }
}

/**
 * 날짜 문자열(YYYYMMDD)을 Date로 변환 (null 허용)
 * @param dateStr - YYYYMMDD 형식의 문자열
 * @returns Date 객체 또는 null
 * @description nhic-form에서 사용하는 날짜 파싱 함수로, 실패 시 null을 반환합니다.
 */
export function parseDateStringOrNull(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 8) return null;
  try {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * 안전한 날짜 생성 함수 - 다양한 형식의 입력을 Date 객체로 변환
 * @param dateInput - 날짜 입력 (string, Date, undefined)
 * @returns Date 객체 (잘못된 입력이면 현재 날짜 반환)
 * @description
 * 지원 형식:
 * - YYYYMMDD (8자리): 19221111 -> 1922-11-11
 * - ISO 문자열: "2024-01-01T00:00:00.000Z"
 * - 기타 Date 생성자가 인식하는 형식
 */
export const createSafeDate = (dateInput?: string | Date): Date => {
  if (!dateInput) return new Date();

  // 이미 Date 객체인 경우
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  }

  // 문자열인 경우
  const dateString = String(dateInput);

  // 19221111과 같은 형식 (YYYYMMDD) 처리
  if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // 월은 0부터 시작
    const day = parseInt(dateString.substring(6, 8));

    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  // 기존 ISO 문자열 형식 처리
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

// ============================================================================
// Date 객체 → YYYY-MM-DD 형식 문자열 변환 함수들
// ============================================================================

/**
 * Date를 YYYY-MM-DD 형식의 문자열로 변환
 * @param date - Date 객체 (null, undefined 허용)
 * @returns YYYY-MM-DD 형식의 문자열 (실패 시 빈 문자열)
 * @description nhic-form에서 사용하는 날짜 포맷팅 함수로, MinDate나 1970년도는 빈 문자열을 반환합니다.
 */
export function formatDateToString(date: Date | null | undefined): string {
  if (!date) return "";
  // MinDate (1970-01-01)인지 확인
  if (date.getTime() === MinDate.getTime() || date.getFullYear() === 1970)
    return "";
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * 날짜 문자열(YYYYMMDD)을 YYYY-MM-DD 형식으로 변환
 * @param dateStr - YYYYMMDD 형식의 문자열
 * @returns YYYY-MM-DD 형식의 문자열 (실패 시 빈 문자열)
 * @description nhic-form에서 사용하는 날짜 문자열 포맷팅 함수입니다.
 */
export function formatDateString(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return "";
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

/**
 * UTC 문자열을 한국 표준시 날짜로 변환
 * @param utcString - UTC 날짜/시간 문자열
 * @returns YYYY-MM-DD 형식의 한국 표준시 날짜 문자열
 * @description UTC 시간을 한국 표준시로 변환하여 날짜만 반환합니다.
 */
export function formatUTCtoKSTDate(utcString: string): string {
  let iso = utcString.trim();
  if (iso.includes(" ") && !iso.includes("T")) {
    iso = iso.replace(" ", "T");
  }
  if (!iso.endsWith("Z")) {
    iso = iso + "Z";
  }
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * UTC dateTime을 한국 표준시(KST) dateTime으로 변환
 * @param utcDateTime - UTC 날짜/시간 문자열 또는 Date 객체
 * @param format - 출력 포맷 (기본값: "YYYY-MM-DD HH:mm:ss")
 * @returns 한국 표준시 dateTime 문자열
 * @description
 * UTC 시간을 한국 표준시(UTC+9)로 변환합니다.
 * UTC 메서드를 사용하여 정확하게 KST로 변환합니다.
 *
 * 지원하는 포맷:
 * - "YYYY-MM-DD HH:mm:ss" (기본값): "2024-01-01 14:30:45"
 * - "YYYY.MM.DD HH:mm:ss": "2024.01.01 14:30:45"
 * - "YYYY-MM-DD HH:mm": "2024-01-01 14:30"
 * - "YYYYMMDD HHmmss": "20240101 143045"
 * - 기타 formatDateByPattern에서 지원하는 포맷
 *
 * 예시:
 * - convertUTCtoKST("2024-01-01T05:30:45Z") → "2024-01-01 14:30:45"
 * - convertUTCtoKST("2024-01-01T05:30:45Z", "YYYY.MM.DD HH:mm:ss") → "2024.01.01 14:30:45"
 */
export function convertUTCtoKST(
  utcDateTime: string | Date,
  format: string = "YYYY-MM-DD HH:mm:ss"
): string {
  if (!utcDateTime) return "";

  let date: Date;

  if (utcDateTime instanceof Date) {
    date = utcDateTime;
  } else {
    // UTC 문자열을 Date 객체로 변환
    let iso = String(utcDateTime).trim();
    if (iso.includes(" ") && !iso.includes("T")) {
      iso = iso.replace(" ", "T");
    }
    if (!iso.endsWith("Z") && !iso.includes("+") && !iso.includes("-", 10)) {
      iso = iso + "Z";
    }
    date = new Date(iso);
  }

  // 유효하지 않은 날짜인지 확인
  if (isNaN(date.getTime())) {
    return "";
  }

  // UTC 시간에서 KST로 변환 (UTC+9)
  // UTC 메서드를 사용하여 UTC 시간을 가져온 후 9시간을 더함
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  const utcDay = date.getUTCDate();
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();

  // KST 시간 계산 (UTC+9)
  let kstHours = utcHours + 9;
  let kstDay = utcDay;
  let kstMonth = utcMonth;
  let kstYear = utcYear;

  // 시간이 24를 넘으면 다음 날로
  if (kstHours >= 24) {
    kstHours -= 24;
    kstDay += 1;
    // 월의 마지막 날 체크
    const daysInMonth = new Date(kstYear, kstMonth + 1, 0).getDate();
    if (kstDay > daysInMonth) {
      kstDay = 1;
      kstMonth += 1;
      if (kstMonth > 11) {
        kstMonth = 0;
        kstYear += 1;
      }
    }
  }

  // KST Date 객체 생성 (로컬 시간대로 해석)
  const kstDate = new Date(
    kstYear,
    kstMonth,
    kstDay,
    kstHours,
    utcMinutes,
    utcSeconds
  );

  // formatDateByPattern을 사용하여 포맷팅
  return formatDateByPattern(kstDate, format);
}

// KST 날짜를 UTC 범위로 변환하는 유틸리티 함수 (reception page에서 가져옴)
export const convertKSTDateToUTCRange = (
  kstDate: Date
): { beginUTC: string; endUTC: string } => {
  // KST 날짜의 시작 (00:00:00 KST)
  const beginKST = new Date(kstDate);
  beginKST.setHours(0, 0, 0, 0);
  // setHours()는 로컬 시간대 기준이므로, toISOString()으로 UTC 변환하면 자동으로 올바른 UTC 시간이 됨

  // KST 날짜의 끝 (23:59:59.999 KST)
  const endKST = new Date(kstDate);
  endKST.setHours(23, 59, 59, 999);
  // setHours()는 로컬 시간대 기준이므로, toISOString()으로 UTC 변환하면 자동으로 올바른 UTC 시간이 됨

  return {
    beginUTC: beginKST.toISOString(),
    endUTC: endKST.toISOString(),
  };
};

// ============================================================================
// Date 객체 → YYYY.MM.DD 형식 문자열 변환 함수들
// ============================================================================

/**
 * 다양한 형식의 날짜를 지정된 구분자로 포맷팅
 * @param date - 날짜 (string, Date, null, undefined)
 * @param split - 날짜 구분자 (기본값: ".")
 * @returns 포맷된 날짜 문자열 (예: "2024.01.01") 또는 빈 문자열
 * @description
 * 지원하는 입력 형식:
 * - ISO 형식: "2017-09-01T00:00:00.000Z"
 * - YYYYMMDD 형식: "20170901"
 * - YYYY-MM-DD 형식: "2017-09-01"
 * - YYYY.MM.DD 형식: "2017.09.01"
 * - Date 객체
 */
export function formatDate(
  date: string | Date | null | undefined,
  split: string = "."
): string {
  if (!date) return "";
  let dateObj: Date;

  if (typeof date === "string") {
    // 다양한 날짜 형태 파싱
    if (date.includes("T") || date.includes("Z")) {
      // ISO 형식: "2017-09-01T00:00:00.000Z" 또는 "2017-09-01T00:00:00.000"
      dateObj = new Date(date);
    } else if (date.length === 8) {
      // YYYYMMDD 형식: "20170901"
      dateObj = convertDate(date);
    } else if (date.includes("-")) {
      // YYYY-MM-DD 형식: "2017-09-01"
      const parts = date.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        if (year && month && day) {
          dateObj = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    } else if (date.includes(".")) {
      // YYYY.MM.DD 형식: "2017.09.01"
      const parts = date.split(".");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        if (year && month && day) {
          dateObj = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    } else {
      // 기타 형식은 기본 Date 생성자 사용
      dateObj = new Date(date);
    }
  } else {
    // Date 객체인 경우 그대로 사용
    dateObj = date;
  }

  // 유효하지 않은 날짜인지 확인
  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}${split}${month}${split}${day}`;
}

// ============================================================================
// Date 객체 → 기타 형식 문자열 변환 함수들
// ============================================================================

/**
 * 날짜를 요일과 함께 한국어 형식으로 포맷팅
 * @param dateObj - 날짜 (Date, string, null, undefined)
 * @returns 한국어 형식의 날짜 문자열 (예: "2024년 01월 01일 (월)") 또는 빈 문자열
 * @description 날짜를 한국어 형식으로 변환하고 요일을 함께 표시합니다.
 */
export function formatDateWithDay(
  dateObj: Date | string | null | undefined
): string {
  if (!dateObj) return "";
  if (typeof dateObj === "string") {
    dateObj = convertDate(dateObj);
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = daysOfWeek[dateObj.getDay()];

  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

/**
 * 날짜시간 문자열(YYYYMMDD-HHmmSS)을 YYYY-MM-DD HH:mm 형식으로 변환
 * @param dateTimeStr - YYYYMMDD-HHmmSS 형식의 문자열 (UTC 시간)
 * @returns YYYY-MM-DD HH:mm 형식의 문자열 (KST 시간, 실패 시 빈 문자열)
 * @description ※nhic-form에서만 사용하는 날짜시간 문자열 포맷팅 함수입니다.
 * UTC 시간을 KST로 변환하여 반환합니다.
 */
export function formatDateTimeString(dateTimeStr: string): string {
  if (!dateTimeStr || dateTimeStr.length < 8) return "";
  // YYYYMMDD-HHmmSS 형식
  if (dateTimeStr.includes("-")) {
    const [date, time] = dateTimeStr.split("-");
    if (date && date.length === 8) {
      const year = date.slice(0, 4);
      const month = date.slice(4, 6);
      const day = date.slice(6, 8);

      if (time && time.length >= 4) {
        const hours = time.slice(0, 2);
        const minutes = time.slice(2, 4);
        const seconds = time.length >= 6 ? time.slice(4, 6) : "00";

        // UTC ISO 형식으로 변환 (Z 추가하여 UTC로 명시)
        const utcISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;

        // UTC를 KST로 변환하고 YYYY-MM-DD HH:mm 형식으로 포맷팅
        return convertUTCtoKST(utcISOString, "YYYY-MM-DD HH:mm");
      }

      // 시간이 없는 경우 날짜만 반환
      return `${year}-${month}-${day}`;
    }
  }
  return formatDateString(dateTimeStr);
}

/**
 * UTC 날짜/시간을 한국어 형식으로 포맷팅
 * @param utcDate - UTC 날짜/시간 문자열 (null, undefined 가능)
 * @param includeSeconds - 초 포함 여부 (기본값: false)
 * @returns "YYYY.MM.DD HH:MM" 또는 "YYYY.MM.DD HH:MM:SS" 형식 문자열 (입력이 없으면 "-")
 * @description UTC 시간을 한국어 형식으로 변환합니다.
 */
export function formatDateTime(
  utcDate: string | undefined | null,
  includeSeconds: boolean = false
): string {
  if (!utcDate) return "-";
  const date = new Date(utcDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (includeSeconds) {
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  } else {
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }
}

/**
 * Date 객체를 한국어 시간 형식으로 포맷팅
 * @param dateObj - Date 객체
 * @returns 한국어 시간 문자열 (예: "14시 30분 45초")
 * @description Date 객체의 시간 부분만 한국어 형식으로 변환합니다.
 */
export function formatCurrentTime(dateObj: Date): string {
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  return `${hours}시 ${minutes}분 ${seconds}초`;
}

/**
 * UTC 문자열을 한국 표준시 시간으로 변환
 * @param utcString - UTC 날짜/시간 문자열
 * @param includeSeconds - 초 포함 여부 (기본값: false)
 * @returns HH:MM 또는 HH:MM:SS 형식의 한국 표준시 시간 문자열
 * @description UTC 시간을 한국 표준시로 변환하여 시간만 반환합니다.
 */
export function formatUTCtoKSTTime(
  utcString: string,
  includeSeconds: boolean = false
): string {
  let iso = utcString.trim();
  if (iso.includes(" ") && !iso.includes("T")) {
    iso = iso.replace(" ", "T");
  }
  if (!iso.endsWith("Z")) {
    iso = iso + "Z";
  }
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (includeSeconds) {
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  } else {
    return `${hh}:${mm}`;
  }
}

// ============================================================================
// 날짜 형식 변환 함수들
// ============================================================================

/**
 * 한국 표준시 날짜/시간을 UTC 문자열로 변환
 * @param kstDateString - 한국 표준시 날짜/시간 문자열
 * @returns ISO 8601 형식의 UTC 문자열 (예: "2024-01-01T15:00:00Z")
 * @description 한국 표준시를 UTC 시간으로 변환합니다.
 */
export function convertKSTtoUTCString(kstDateString: string): string {
  // KST 문자열을 Date 객체로 변환
  const kstDate = new Date(kstDateString);

  // UTC 시간으로 변환
  const utcYear = kstDate.getUTCFullYear();
  const utcMonth = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const utcDay = String(kstDate.getUTCDate()).padStart(2, "0");
  const utcHours = String(kstDate.getUTCHours()).padStart(2, "0");
  const utcMinutes = String(kstDate.getUTCMinutes()).padStart(2, "0");
  const utcSeconds = String(kstDate.getUTCSeconds()).padStart(2, "0");

  // ISO-like 포맷 문자열로 반환
  return `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}:${utcSeconds}Z`;
}

/**
 * KST 시간을 UTC Date 객체로 변환
 * @param kstDate - KST 시간을 나타내는 Date 객체 또는 문자열
 * @returns UTC 시간으로 변환된 Date 객체
 * @description KST 시간(UTC+9)을 UTC 시간으로 변환하여 Date 객체로 반환합니다.
 */
export function convertKSTtoUTCDate(kstDate: Date | string): Date {
  let date: Date;

  if (kstDate instanceof Date) {
    date = new Date(kstDate);
  } else {
    date = new Date(kstDate);
  }

  // KST는 UTC+9이므로, 9시간을 빼서 UTC로 변환
  const utcDate = new Date(date.getTime() - 9 * 60 * 60 * 1000);

  return utcDate;
}

// ============================================================================
// 날짜 유틸리티 함수들
// ============================================================================

/**
 * selectedDate의 날짜 부분 + 현재 시간으로 receptionDateTime을 생성하는 유틸리티 함수
 * @param date - 선택된 날짜 (Date | string | null | undefined)
 * @returns 선택된 날짜의 날짜 부분 + 현재 시간으로 조합된 Date 객체
 * @description 접수일시를 설정할 때 사용하며, 선택된 날짜의 년/월/일과 현재 시간의 시/분/초/밀리초를 조합합니다.
 *
 * 예시:
 * - 선택된 날짜: 2024-01-15 23:59:59
 * - 현재 시간: 14:30:45.123
 * - 결과: 2024-01-15 14:30:45.123
 */
export function createReceptionDateTime(date: Date | string | null | undefined): Date {
  let targetDate: Date;

  if (!date) {
    targetDate = new Date();
  } else if (typeof date === 'string') {
    targetDate = new Date(date);
  } else {
    targetDate = date;
  }

  const now = new Date();
  return new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}

/**
 * 연도, 월, 일 문자열이 유효한 날짜인지 검증
 * @param yy - 연도 문자열 (00~99)
 * @param mm - 월 문자열 (01~12)
 * @param dd - 일 문자열 (01~31)
 * @returns 유효한 날짜면 true, 아니면 false
 * @description
 * 연도 처리: 00~29는 2000년대, 30~99는 1900년대로 해석
 * 실제 달력 날짜를 검증합니다 (윤년 등 포함).
 */
export function isValidDate(yy: string, mm: string, dd: string) {
  // 연도는 00~99, 월 01~12, 일 01~31, 실제 달력 날짜 체크
  const year = parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // 윤년 등 실제 날짜 체크
  const fullYear = (parseInt(yy, 10) < 30 ? 2000 : 1900) + (year % 100);
  const date = new Date(fullYear, month - 1, day);
  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * UTC 날짜/시간으로부터 현재까지의 상대적 시간을 한국어로 표현
 * @param utcDate - UTC 날짜/시간 문자열 (null, undefined 가능)
 * @returns 상대적 시간 문자열 (예: "5분 전", "2시간 전", "3일 전", "1개월 전", "2년 전") 또는 "-"
 * @description UTC 시간을 현재 시간과 비교하여 상대적 시간을 한국어로 표현합니다.
 */
export function getRelativeTime(utcDate: string | undefined | null): string {
  if (!utcDate) return "-";
  const targetDate = new Date(utcDate);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();

  // 1시간 이내
  if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `${minutes}분 전`;
  }

  // 24시간 이내
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours}시간 전`;
  }

  // 한 달 이내
  if (diffMs < 30 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${days}일 전`;
  }

  // 1년 이내
  if (diffMs < 365 * 24 * 60 * 60 * 1000) {
    const months = Math.floor(diffMs / (30 * 24 * 60 * 60 * 1000));
    return `${months}개월 전`;
  }

  // 1년 이상
  const years = Math.floor(diffMs / (365 * 24 * 60 * 60 * 1000));
  const remainingMonths = Math.floor(
    (diffMs % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000)
  );

  if (remainingMonths === 0) {
    return `${years}년 전`;
  } else {
    return `${years}년 ${remainingMonths}개월 전`;
  }
}

/**
 * 두 UTC 날짜/시간 사이의 시간 차이를 계산
 * @param startUtcDate - 시작 UTC 날짜/시간 문자열 (null, undefined 가능)
 * @param endUtcDate - 종료 UTC 날짜/시간 문자열 (기본값: 현재 시간)
 * @param includeSeconds - 초 포함 여부 (기본값: false)
 * @returns 시간 차이 문자열 (예: "2시간 30분", "45분 30초") 또는 "-"
 * @description 두 UTC 시간 사이의 차이를 한국어 형식으로 계산합니다.
 */
export function getGapTime(
  startUtcDate: string | undefined | null,
  endUtcDate: string | undefined = new Date().toISOString(),
  includeSeconds: boolean = false
): string {
  if (!startUtcDate) return "-";
  const startDate = new Date(startUtcDate);
  const endDate = new Date(endUtcDate);
  const diff = (endDate.getTime() - startDate.getTime()) / 1000;
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.floor(diff % 60);

  if (diff < 60) {
    return includeSeconds ? `${seconds}초` : `1분미만`;
  } else if (diff < 3600) {
    return includeSeconds ? `${minutes}분 ${seconds}초` : `${minutes}분`;
  } else {
    return includeSeconds
      ? `${hours}시간 ${minutes}분 ${seconds}초`
      : `${hours}시간 ${minutes}분`;
  }
}

/**
 * yyyy-MM-dd 또는 yyyy.MM.dd 형태의 날짜를 yyyymmdd 형태로 변환
 * @param dateString - yyyy-MM-dd 또는 yyyy.MM.dd 형태의 날짜 문자열 (null, undefined 가능)
 * @returns yyyymmdd 형태의 날짜 문자열 (예: "20240101") 또는 빈 문자열
 */
export function convertToYYYYMMDD(
  dateString: string | null | undefined
): string {
  if (!dateString || dateString == "") return "";

  // 이미 yyyymmdd 형태인지 확인 (8자리 숫자)
  if (/^\d{8}$/.test(dateString)) {
    return dateString;
  }

  // yyyy-MM-dd 또는 yyyy.MM.dd 형태인지 확인
  const dateRegex = /^\d{4}[-.]\d{2}[-.]\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn(
      `Invalid date format: ${dateString}. Expected format: yyyy-MM-dd or yyyy.MM.dd`
    );
    return "";
  }

  // 구분자 제거 (-, .)
  return dateString.replace(/[-.]/g, "");
}

/**
 * yyyy-MM-dd 또는 yyyy.MM.dd 형태의 날짜를 ISO 8601 형태로 변환
 * @param dateString - yyyy-MM-dd 또는 yyyy.MM.dd 형태의 날짜 문자열 (null, undefined 가능)
 * @returns ISO 8601 형태의 날짜 문자열 (예: "2024-01-01T00:00:00.000Z") 또는 빈 문자열
 */
export function convertToISO8601(
  dateString: string | null | undefined
): string {
  if (!dateString) return "";

  // 이미 ISO 8601 형태인지 확인
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (iso8601Regex.test(dateString)) {
    return dateString;
  }

  // yyyy-MM-dd 또는 yyyy.MM.dd 형태인지 확인
  const dateRegex = /^\d{4}[-.]\d{2}[-.]\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn(
      `Invalid date format: ${dateString}. Expected format: yyyy-MM-dd, yyyy.MM.dd or ISO 8601`
    );
    return "";
  }

  try {
    // 점(.)을 하이픈(-)으로 변환하여 yyyy-MM-dd 형태로 만들기
    const normalizedDate = dateString.replace(/\./g, "-");

    // yyyy-MM-dd를 Date 객체로 변환
    const date = new Date(normalizedDate + "T00:00:00");

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return "";
    }

    // ISO 8601 형태로 변환
    return date.toISOString();
  } catch (error) {
    console.error(`Error converting date ${dateString} to ISO 8601:`, error);
    return "";
  }
}

/**
 * 날짜를 지정된 포맷 패턴으로 변환
 * @param date - 날짜 (string, Date, null, undefined)
 * @param format - 포맷 패턴 (예: "YYYY-MM-DD", "YYYY.MM.DD HH:mm:ss", "YYYYMMDD")
 * @returns 포맷된 날짜 문자열 또는 빈 문자열
 *
 * 지원하는 포맷 토큰:
 * - YYYY: 4자리 연도 (예: 2024)
 * - YY: 2자리 연도 (예: 24)
 * - MM: 2자리 월 (예: 01, 12)
 * - M: 1-2자리 월 (예: 1, 12)
 * - DD: 2자리 일 (예: 01, 31)
 * - D: 1-2자리 일 (예: 1, 31)
 * - HH: 2자리 시간 24시간 형식 (예: 00, 23)
 * - H: 1-2자리 시간 24시간 형식 (예: 0, 23)
 * - hh: 2자리 시간 12시간 형식 (예: 01, 12)
 * - h: 1-2자리 시간 12시간 형식 (예: 1, 12)
 * - mm: 2자리 분 (예: 00, 59)
 * - m: 1-2자리 분 (예: 0, 59)
 * - ss: 2자리 초 (예: 00, 59)
 * - s: 1-2자리 초 (예: 0, 59)
 * - A: AM/PM (대문자)
 * - a: am/pm (소문자)
 *
 * 예시:
 * - formatDateByPattern(new Date(), "YYYY-MM-DD") → "2024-01-01"
 * - formatDateByPattern(new Date(), "YYYY.MM.DD HH:mm:ss") → "2024.01.01 14:30:45"
 * - formatDateByPattern(new Date(), "YYYYMMDD") → "20240101"
 * - formatDateByPattern(new Date(), "YYYY년 MM월 DD일 (요일)") → "2024년 01월 01일 (월)"
 */
export function formatDateByPattern(
  date: string | Date | null | undefined,
  format: string
): string {
  if (!date || !format) return "";

  let dateObj: Date;

  // 날짜를 Date 객체로 변환
  if (typeof date === "string") {
    // 다양한 날짜 형태 파싱
    if (date.includes("T") || date.includes("Z")) {
      // ISO 형식: "2017-09-01T00:00:00.000Z" 또는 "2017-09-01T00:00:00.000"
      dateObj = new Date(date);
    } else if (date.length === 8) {
      // YYYYMMDD 형식: "20170901"
      dateObj = convertDate(date);
    } else if (date.includes("-")) {
      // YYYY-MM-DD 형식: "2017-09-01"
      const parts = date.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        if (year && month && day) {
          dateObj = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    } else if (date.includes(".")) {
      // YYYY.MM.DD 형식: "2017.09.01"
      const parts = date.split(".");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        if (year && month && day) {
          dateObj = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    } else {
      // 기타 형식은 기본 Date 생성자 사용
      dateObj = new Date(date);
    }
  } else {
    // Date 객체인 경우 그대로 사용
    dateObj = date;
  }

  // 유효하지 않은 날짜인지 확인
  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const hours24 = dateObj.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = dateObj.getMinutes();
  const seconds = dateObj.getSeconds();
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const ampmLower = hours24 >= 12 ? "pm" : "am";
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek: string = daysOfWeek[dateObj.getDay()] || "";

  // 포맷 문자열을 토큰별로 치환
  let result = format;

  // 연도
  result = result.replace(/YYYY/g, String(year).padStart(4, "0"));
  result = result.replace(/YY/g, String(year % 100).padStart(2, "0"));

  // 월
  result = result.replace(/MM/g, String(month).padStart(2, "0"));
  result = result.replace(/\bM\b/g, String(month));

  // 일
  result = result.replace(/DD/g, String(day).padStart(2, "0"));
  result = result.replace(/\bD\b/g, String(day));

  // 시간 (24시간)
  result = result.replace(/HH/g, String(hours24).padStart(2, "0"));
  result = result.replace(/\bH\b/g, String(hours24));

  // 시간 (12시간)
  result = result.replace(/hh/g, String(hours12).padStart(2, "0"));
  result = result.replace(/\bh\b/g, String(hours12));

  // 분
  result = result.replace(/mm/g, String(minutes).padStart(2, "0"));
  result = result.replace(/\bm\b/g, String(minutes));

  // 초
  result = result.replace(/ss/g, String(seconds).padStart(2, "0"));
  result = result.replace(/\bs\b/g, String(seconds));

  // AM/PM
  result = result.replace(/A/g, ampm);
  result = result.replace(/a/g, ampmLower);

  // 요일
  if (dayOfWeek) {
    result = result.replace(/요일/g, dayOfWeek);
  }

  return result;
}

/**
 * 생년월일을 YY-MM-DD 형식으로 변환 (라벨 출력용)
 * @param birthDate - 생년월일 (YYYY-MM-DD, YYYYMMDD 등)
 * @returns YY-MM-DD 형식의 문자열 (실패 시 원본 반환)
 */
export function formatBirthDateShort(birthDate: string): string {
  const formatted = formatDateByPattern(birthDate, "YY-MM-DD");
  return formatted || birthDate;
}

// ============================================================================
// UTC ISO 8601 변환 함수들
// ============================================================================

/**
 * 날짜 문자열(YYYY-MM-DD)을 KST 기준 하루의 시작 시간의 UTC ISO 8601 형식으로 변환
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @returns UTC ISO 8601 형식의 날짜 문자열 (예: "2024-01-14T15:00:00.000Z")
 * @description 입력된 날짜의 KST 00:00:00.000을 UTC로 변환합니다. (KST = UTC+9)
 */
export function convertToUTCISOStart(dateString: string): string {
  const parts = dateString.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  // KST 00:00:00.000 → UTC로 변환 (9시간 차감)
  const date = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
  return date.toISOString();
}

/**
 * 날짜 문자열(YYYY-MM-DD)을 KST 기준 하루의 끝 시간의 UTC ISO 8601 형식으로 변환
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @returns UTC ISO 8601 형식의 날짜 문자열 (예: "2024-01-15T14:59:59.999Z")
 * @description 입력된 날짜의 KST 23:59:59.999를 UTC로 변환합니다. (KST = UTC+9)
 */
export function convertToUTCISOEnd(dateString: string): string {
  const parts = dateString.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  // KST 23:59:59.999 → UTC로 변환 (9시간 차감)
  const date = new Date(Date.UTC(year, month - 1, day, 23 - 9, 59, 59, 999));
  return date.toISOString();
}

/**
 * 지정한 날짜가 속한 "월"을 기준으로 조회용 UTC ISO 범위를 생성합니다.
 * @param date - 기준 날짜
 * @param paddingDays - 월 범위의 시작/끝에 추가로 확장할 일수 (기본 0일)
 * @returns beginUTC/endUTC (ISO 8601, Z 포함)
 *
 * @example
 * getMonthUTCRangeWithPadding(new Date("2026-01-15"), 7)
 * // -> (1월 1일 00:00:00Z - 2월 7일 23:59:59.999Z) 형태
 */
export function getMonthUTCRangeWithPadding(
  date: Date,
  paddingDays: number = 0
): { beginUTC: string; endUTC: string } {
  const year = date.getFullYear();
  const month = date.getMonth();

  const startLocal = new Date(year, month, 1, 0, 0, 0, 0);
  startLocal.setDate(startLocal.getDate() - paddingDays);

  const endLocal = new Date(year, month + 1, 0, 23, 59, 59, 999);
  endLocal.setDate(endLocal.getDate() + paddingDays);

  return {
    beginUTC: startLocal.toISOString(),
    endUTC: endLocal.toISOString(),
  };
}

export const parseBirthDate = (birthDateStr: string): Date => {
  let birthDate = new Date();
  if (birthDateStr) {
    if (
      typeof birthDateStr === "string" &&
      birthDateStr.length === 8 &&
      /^\d{8}$/.test(birthDateStr)
    ) {
      const year = birthDateStr.substring(0, 4);
      const month = birthDateStr.substring(4, 6);
      const day = birthDateStr.substring(6, 8);
      birthDate = new Date(`${year}-${month}-${day}`);
    } else {
      birthDate = new Date(birthDateStr);
    }
    if (isNaN(birthDate.getTime())) {
      birthDate = new Date();
    }
  }
  return birthDate;
};


// UTC 날짜를 KST 기준 날짜 문자열로 변환하는 유틸리티 함수
export function formatUTCDateToKSTString(utcDate: string | Date): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

  // Intl.DateTimeFormat을 사용해서 정확한 KST 변환
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";

  const result = `${year}-${month}-${day}`;

  return result;
};

/**
 * 두 날짜가 같은 캘린더 날(년·월·일)인지 비교
 * @param a - 첫 번째 Date
 * @param b - 두 번째 Date
 * @returns 같은 날이면 true
 */
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
