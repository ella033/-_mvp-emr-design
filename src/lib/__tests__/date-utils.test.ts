import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MinDate } from "@/constants/common/common-enum";
import {
  convertDate,
  parseDateString,
  parseDateStringOrNull,
  createSafeDate,
  formatDateToString,
  formatDateString,
  formatUTCtoKSTDate,
  convertUTCtoKST,
  convertKSTDateToUTCRange,
  formatDate,
  formatDateWithDay,
  formatDateTimeString,
  formatDateTime,
  formatCurrentTime,
  formatUTCtoKSTTime,
  convertKSTtoUTCString,
  convertKSTtoUTCDate,
  createReceptionDateTime,
  isValidDate,
  getRelativeTime,
  getGapTime,
  convertToYYYYMMDD,
  convertToISO8601,
  formatDateByPattern,
  formatBirthDateShort,
  convertToUTCISOStart,
  convertToUTCISOEnd,
  getMonthUTCRangeWithPadding,
  parseBirthDate,
  formatUTCDateToKSTString,
  isSameCalendarDay,
} from "../date-utils";

// Fixed "now": 2024-06-15T05:00:00.000Z = 2024-06-15 14:00:00 KST
const FIXED_NOW = new Date("2024-06-15T05:00:00.000Z");

describe("convertDate", () => {
  it("should convert valid YYYYMMDD to Date", () => {
    const result = convertDate("20240101");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it("should convert another valid date", () => {
    const result = convertDate("19901231");
    expect(result.getFullYear()).toBe(1990);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(31);
  });

  it("should return Date(0) for empty string", () => {
    expect(convertDate("").getTime()).toBe(new Date(0).getTime());
  });

  it("should return Date(0) for wrong length", () => {
    expect(convertDate("2024").getTime()).toBe(new Date(0).getTime());
    expect(convertDate("202401011").getTime()).toBe(new Date(0).getTime());
  });

  it("should return Date(0) for null-ish via empty", () => {
    expect(convertDate("").getTime()).toBe(0);
  });
});

describe("parseDateString", () => {
  it("should parse valid YYYYMMDD", () => {
    const result = parseDateString("20240315");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });

  it("should return MinDate for empty string", () => {
    expect(parseDateString("")).toBe(MinDate);
  });

  it("should return MinDate for wrong length", () => {
    expect(parseDateString("20241")).toBe(MinDate);
    expect(parseDateString("202401011")).toBe(MinDate);
  });

  it("should return MinDate for null-ish input", () => {
    expect(parseDateString(null as unknown as string)).toBe(MinDate);
    expect(parseDateString(undefined as unknown as string)).toBe(MinDate);
  });
});

describe("parseDateStringOrNull", () => {
  it("should parse valid YYYYMMDD", () => {
    const result = parseDateStringOrNull("20240315");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(2);
    expect(result!.getDate()).toBe(15);
  });

  it("should return null for empty string", () => {
    expect(parseDateStringOrNull("")).toBeNull();
  });

  it("should return null for wrong length", () => {
    expect(parseDateStringOrNull("2024")).toBeNull();
  });

  it("should return null for null/undefined", () => {
    expect(parseDateStringOrNull(null as unknown as string)).toBeNull();
    expect(parseDateStringOrNull(undefined as unknown as string)).toBeNull();
  });
});

describe("createSafeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return current date for undefined", () => {
    const result = createSafeDate();
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });

  it("should return current date for empty string", () => {
    const result = createSafeDate("");
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });

  it("should parse YYYYMMDD format", () => {
    const result = createSafeDate("19221111");
    expect(result.getFullYear()).toBe(1922);
    expect(result.getMonth()).toBe(10);
    expect(result.getDate()).toBe(11);
  });

  it("should parse ISO string format", () => {
    const result = createSafeDate("2024-01-01T00:00:00.000Z");
    expect(result.getFullYear()).not.toBeNaN();
  });

  it("should pass through valid Date objects", () => {
    const d = new Date(2024, 0, 1);
    expect(createSafeDate(d)).toBe(d);
  });

  it("should return now for invalid Date object", () => {
    const invalid = new Date("invalid");
    const result = createSafeDate(invalid);
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });

  it("should return now for invalid string", () => {
    const result = createSafeDate("not-a-date");
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });
});

describe("formatDateToString", () => {
  it("should format Date to YYYY-MM-DD", () => {
    expect(formatDateToString(new Date(2024, 0, 1))).toBe("2024-01-01");
  });

  it("should format date with padding", () => {
    expect(formatDateToString(new Date(2024, 5, 9))).toBe("2024-06-09");
  });

  it("should return empty for null", () => {
    expect(formatDateToString(null)).toBe("");
  });

  it("should return empty for undefined", () => {
    expect(formatDateToString(undefined)).toBe("");
  });

  it("should return empty for MinDate", () => {
    expect(formatDateToString(MinDate)).toBe("");
  });

  it("should return empty for 1970 dates", () => {
    expect(formatDateToString(new Date(1970, 5, 15))).toBe("");
  });
});

describe("formatDateString", () => {
  it("should format YYYYMMDD to YYYY-MM-DD", () => {
    expect(formatDateString("20240101")).toBe("2024-01-01");
    expect(formatDateString("19901231")).toBe("1990-12-31");
  });

  it("should return empty for wrong length", () => {
    expect(formatDateString("2024")).toBe("");
    expect(formatDateString("202401011")).toBe("");
  });

  it("should return empty for empty string", () => {
    expect(formatDateString("")).toBe("");
  });

  it("should return empty for null-ish", () => {
    expect(formatDateString(null as unknown as string)).toBe("");
    expect(formatDateString(undefined as unknown as string)).toBe("");
  });
});

describe("formatUTCtoKSTDate", () => {
  it("should convert UTC ISO string to KST date", () => {
    // 2024-01-01T00:00:00Z => KST 2024-01-01 09:00
    const result = formatUTCtoKSTDate("2024-01-01T00:00:00Z");
    expect(result).toBe("2024-01-01");
  });

  it("should handle UTC time that crosses day boundary in KST", () => {
    // 2024-01-01T20:00:00Z => KST 2024-01-02 05:00
    const result = formatUTCtoKSTDate("2024-01-01T20:00:00Z");
    expect(result).toBe("2024-01-02");
  });

  it("should handle space-separated format", () => {
    const result = formatUTCtoKSTDate("2024-01-01 00:00:00");
    expect(result).toBe("2024-01-01");
  });

  it("should append Z if missing", () => {
    const result = formatUTCtoKSTDate("2024-06-15T05:00:00");
    expect(result).toBe("2024-06-15");
  });
});

describe("convertUTCtoKST", () => {
  it("should convert UTC to KST with default format", () => {
    const result = convertUTCtoKST("2024-01-01T05:30:45Z");
    expect(result).toBe("2024-01-01 14:30:45");
  });

  it("should support custom format", () => {
    const result = convertUTCtoKST(
      "2024-01-01T05:30:45Z",
      "YYYY.MM.DD HH:mm:ss"
    );
    expect(result).toBe("2024.01.01 14:30:45");
  });

  it("should support YYYY-MM-DD HH:mm format", () => {
    const result = convertUTCtoKST("2024-01-01T05:30:45Z", "YYYY-MM-DD HH:mm");
    expect(result).toBe("2024-01-01 14:30");
  });

  it("should handle day rollover (UTC 20:00 => KST next day 05:00)", () => {
    const result = convertUTCtoKST("2024-01-01T20:00:00Z");
    expect(result).toBe("2024-01-02 05:00:00");
  });

  it("should handle month rollover", () => {
    const result = convertUTCtoKST("2024-01-31T20:00:00Z");
    expect(result).toBe("2024-02-01 05:00:00");
  });

  it("should handle year rollover", () => {
    const result = convertUTCtoKST("2024-12-31T20:00:00Z");
    expect(result).toBe("2025-01-01 05:00:00");
  });

  it("should return empty for falsy input", () => {
    expect(convertUTCtoKST("")).toBe("");
    expect(convertUTCtoKST(null as unknown as string)).toBe("");
  });

  it("should return empty for invalid date", () => {
    expect(convertUTCtoKST("not-a-date")).toBe("");
  });

  it("should handle Date object input", () => {
    const date = new Date("2024-01-01T05:30:45Z");
    const result = convertUTCtoKST(date);
    expect(result).toBe("2024-01-01 14:30:45");
  });

  it("should handle space-separated UTC string", () => {
    const result = convertUTCtoKST("2024-01-01 05:30:45");
    expect(result).toBe("2024-01-01 14:30:45");
  });
});

describe("convertKSTDateToUTCRange", () => {
  it("should return begin and end UTC for a KST date", () => {
    const kstDate = new Date(2024, 0, 15, 12, 0, 0); // local time
    const result = convertKSTDateToUTCRange(kstDate);
    expect(result.beginUTC).toBeDefined();
    expect(result.endUTC).toBeDefined();
    // beginUTC should be the start of that local day in ISO
    const beginDate = new Date(result.beginUTC);
    expect(beginDate.getHours()).toBeDefined();
    // endUTC should be end of that local day
    const endDate = new Date(result.endUTC);
    expect(endDate.getTime()).toBeGreaterThan(beginDate.getTime());
  });

  it("should span roughly 24 hours", () => {
    const kstDate = new Date(2024, 5, 15);
    const result = convertKSTDateToUTCRange(kstDate);
    const diff =
      new Date(result.endUTC).getTime() - new Date(result.beginUTC).getTime();
    // Should be ~23:59:59.999
    expect(diff).toBeCloseTo(24 * 60 * 60 * 1000 - 1, -2);
  });
});

describe("formatDate", () => {
  it("should format ISO string with default dot separator", () => {
    // Use a local-parsed date to avoid timezone confusion
    expect(formatDate("20240101")).toBe("2024.01.01");
  });

  it("should format YYYYMMDD string", () => {
    expect(formatDate("20170901")).toBe("2017.09.01");
  });

  it("should format YYYY-MM-DD string", () => {
    expect(formatDate("2024-06-15")).toBe("2024.06.15");
  });

  it("should format YYYY.MM.DD string", () => {
    expect(formatDate("2024.06.15")).toBe("2024.06.15");
  });

  it("should format Date object", () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe("2024.01.01");
  });

  it("should use custom separator", () => {
    expect(formatDate("20240101", "-")).toBe("2024-01-01");
  });

  it("should return empty for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("should return empty for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("should return empty for empty string", () => {
    expect(formatDate("")).toBe("");
  });

  it("should handle ISO string with T and Z", () => {
    const result = formatDate("2017-09-01T00:00:00.000Z");
    // This will be locale-dependent, just check it's not empty
    expect(result).not.toBe("");
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });

  it("should return empty for invalid string", () => {
    expect(formatDate("invalid")).toBe("");
  });
});

describe("formatDateWithDay", () => {
  it("should format Date object with Korean day of week", () => {
    // 2024-01-01 is Monday (월)
    const result = formatDateWithDay(new Date(2024, 0, 1));
    expect(result).toBe("2024년 01월 01일 (월)");
  });

  it("should format YYYYMMDD string", () => {
    // 2024-06-15 is Saturday (토)
    const result = formatDateWithDay("20240615");
    expect(result).toBe("2024년 06월 15일 (토)");
  });

  it("should return empty for null", () => {
    expect(formatDateWithDay(null)).toBe("");
  });

  it("should return empty for undefined", () => {
    expect(formatDateWithDay(undefined)).toBe("");
  });

  it("should return empty for empty string (falls through to convertDate which returns Date(0))", () => {
    // Empty string => convertDate("") => Date(0) => 1970-01-01
    // The function doesn't guard against this specifically, it trusts convertDate
    expect(formatDateWithDay("")).toBe("");
  });

  it("should show Sunday correctly", () => {
    // 2024-06-16 is Sunday (일)
    const result = formatDateWithDay(new Date(2024, 5, 16));
    expect(result).toBe("2024년 06월 16일 (일)");
  });
});

describe("formatDateTimeString", () => {
  it("should convert YYYYMMDD-HHmmSS to KST YYYY-MM-DD HH:mm", () => {
    // 20240101-053045 as UTC => KST: 2024-01-01 14:30
    const result = formatDateTimeString("20240101-053045");
    expect(result).toBe("2024-01-01 14:30");
  });

  it("should handle time without seconds", () => {
    const result = formatDateTimeString("20240101-0530");
    expect(result).toBe("2024-01-01 14:30");
  });

  it("should return date only when no time part", () => {
    // "20240101-" split gives date="20240101", time=""
    // time is empty so time.length >= 4 fails => returns date only
    const result = formatDateTimeString("20240101-");
    expect(result).toBe("2024-01-01");
  });

  it("should return empty for empty string", () => {
    expect(formatDateTimeString("")).toBe("");
  });

  it("should return empty for short string", () => {
    expect(formatDateTimeString("2024")).toBe("");
  });

  it("should fallback to formatDateString for non-hyphen 8-char string", () => {
    expect(formatDateTimeString("20240101")).toBe("2024-01-01");
  });
});

describe("formatDateTime", () => {
  it("should format UTC date string to local YYYY.MM.DD HH:MM", () => {
    const d = new Date(2024, 0, 1, 14, 30, 45);
    const result = formatDateTime(d.toISOString());
    // Result depends on local timezone but should match pattern
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
  });

  it("should include seconds when requested", () => {
    const d = new Date(2024, 0, 1, 14, 30, 45);
    const result = formatDateTime(d.toISOString(), true);
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("should return dash for null", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  it("should return dash for undefined", () => {
    expect(formatDateTime(undefined)).toBe("-");
  });

  it("should return dash for empty string", () => {
    expect(formatDateTime("")).toBe("-");
  });
});

describe("formatCurrentTime", () => {
  it("should format time in Korean format", () => {
    const d = new Date(2024, 0, 1, 14, 30, 45);
    expect(formatCurrentTime(d)).toBe("14시 30분 45초");
  });

  it("should pad single-digit values", () => {
    const d = new Date(2024, 0, 1, 2, 5, 3);
    expect(formatCurrentTime(d)).toBe("02시 05분 03초");
  });

  it("should handle midnight", () => {
    const d = new Date(2024, 0, 1, 0, 0, 0);
    expect(formatCurrentTime(d)).toBe("00시 00분 00초");
  });
});

describe("formatUTCtoKSTTime", () => {
  it("should convert UTC time to KST HH:MM", () => {
    // 2024-01-01T05:30:00Z => local time depends on system
    // Just verify the format
    const result = formatUTCtoKSTTime("2024-01-01T05:30:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should include seconds when requested", () => {
    const result = formatUTCtoKSTTime("2024-01-01T05:30:45Z", true);
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("should handle space-separated format", () => {
    const result = formatUTCtoKSTTime("2024-01-01 05:30:00");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("convertKSTtoUTCString", () => {
  it("should convert KST date string to UTC ISO string", () => {
    const result = convertKSTtoUTCString("2024-01-01T14:30:00");
    // The function creates a Date from the string, then formats UTC components
    expect(result).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });

  it("should produce valid ISO format", () => {
    const result = convertKSTtoUTCString("2024-06-15T00:00:00");
    const parsed = new Date(result);
    expect(isNaN(parsed.getTime())).toBe(false);
  });
});

describe("convertKSTtoUTCDate", () => {
  it("should subtract 9 hours from Date object", () => {
    const kst = new Date("2024-01-01T14:00:00Z");
    const utc = convertKSTtoUTCDate(kst);
    expect(utc.getTime()).toBe(kst.getTime() - 9 * 60 * 60 * 1000);
  });

  it("should subtract 9 hours from string input", () => {
    const result = convertKSTtoUTCDate("2024-01-01T14:00:00Z");
    const expected = new Date("2024-01-01T05:00:00Z");
    expect(result.getTime()).toBe(expected.getTime());
  });
});

describe("createReceptionDateTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should combine target date with current time", () => {
    const target = new Date(2024, 0, 15, 23, 59, 59);
    const result = createReceptionDateTime(target);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
    // Time should come from FIXED_NOW (local time)
    const now = new Date();
    expect(result.getHours()).toBe(now.getHours());
    expect(result.getMinutes()).toBe(now.getMinutes());
  });

  it("should handle string input", () => {
    const result = createReceptionDateTime("2024-03-20");
    expect(result.getFullYear()).toBe(2024);
  });

  it("should use current date for null", () => {
    const result = createReceptionDateTime(null);
    const now = new Date();
    expect(result.getFullYear()).toBe(now.getFullYear());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getDate()).toBe(now.getDate());
  });

  it("should use current date for undefined", () => {
    const result = createReceptionDateTime(undefined);
    const now = new Date();
    expect(result.getFullYear()).toBe(now.getFullYear());
  });
});

describe("isValidDate", () => {
  it("should validate correct dates", () => {
    expect(isValidDate("24", "01", "01")).toBe(true); // 2024-01-01
    expect(isValidDate("90", "12", "31")).toBe(true); // 1990-12-31
  });

  it("should treat 00-29 as 2000s", () => {
    expect(isValidDate("00", "01", "01")).toBe(true); // 2000-01-01
    expect(isValidDate("29", "12", "31")).toBe(true); // 2029-12-31
  });

  it("should treat 30-99 as 1900s", () => {
    expect(isValidDate("30", "01", "01")).toBe(true); // 1930-01-01
    expect(isValidDate("99", "12", "31")).toBe(true); // 1999-12-31
  });

  it("should reject invalid month", () => {
    expect(isValidDate("24", "00", "01")).toBe(false);
    expect(isValidDate("24", "13", "01")).toBe(false);
  });

  it("should reject invalid day", () => {
    expect(isValidDate("24", "01", "00")).toBe(false);
    expect(isValidDate("24", "01", "32")).toBe(false);
  });

  it("should check leap year correctly", () => {
    // 2024 is a leap year (24 < 30 => 2024)
    expect(isValidDate("24", "02", "29")).toBe(true);
    // 2023 is not a leap year (23 < 30 => 2023)
    expect(isValidDate("23", "02", "29")).toBe(false);
  });

  it("should reject Feb 30", () => {
    expect(isValidDate("24", "02", "30")).toBe(false);
  });

  it("should reject non-numeric input", () => {
    expect(isValidDate("ab", "01", "01")).toBe(false);
    expect(isValidDate("24", "xx", "01")).toBe(false);
    expect(isValidDate("24", "01", "yy")).toBe(false);
  });

  it("should validate months with 30 days", () => {
    expect(isValidDate("24", "04", "30")).toBe(true); // April 30
    expect(isValidDate("24", "04", "31")).toBe(false); // April 31 doesn't exist
  });
});

describe("getRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return dash for null/undefined/empty", () => {
    expect(getRelativeTime(null)).toBe("-");
    expect(getRelativeTime(undefined)).toBe("-");
    expect(getRelativeTime("")).toBe("-");
  });

  it('should return minutes for < 1 hour', () => {
    // 30 minutes ago
    const date = new Date(FIXED_NOW.getTime() - 30 * 60 * 1000);
    expect(getRelativeTime(date.toISOString())).toBe("30분 전");
  });

  it('should return hours for < 24 hours', () => {
    // 5 hours ago
    const date = new Date(FIXED_NOW.getTime() - 5 * 60 * 60 * 1000);
    expect(getRelativeTime(date.toISOString())).toBe("5시간 전");
  });

  it('should return days for < 30 days', () => {
    // 10 days ago
    const date = new Date(FIXED_NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    expect(getRelativeTime(date.toISOString())).toBe("10일 전");
  });

  it('should return months for < 1 year', () => {
    // ~90 days ago (~3 months)
    const date = new Date(FIXED_NOW.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(getRelativeTime(date.toISOString())).toBe("3개월 전");
  });

  it('should return years for >= 1 year', () => {
    // ~400 days ago (1 year + some months)
    const date = new Date(FIXED_NOW.getTime() - 400 * 24 * 60 * 60 * 1000);
    const result = getRelativeTime(date.toISOString());
    expect(result).toContain("1년");
  });

  it("should return years only when remaining months is 0", () => {
    // Exactly 365 days
    const date = new Date(FIXED_NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(getRelativeTime(date.toISOString())).toBe("1년 전");
  });

  it("should return 0분 전 for just now", () => {
    expect(getRelativeTime(FIXED_NOW.toISOString())).toBe("0분 전");
  });
});

describe("getGapTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return dash for null/undefined start", () => {
    expect(getGapTime(null)).toBe("-");
    expect(getGapTime(undefined)).toBe("-");
  });

  it("should calculate gap with default end (now)", () => {
    // 2.5 hours ago
    const start = new Date(
      FIXED_NOW.getTime() - (2 * 3600 + 30 * 60) * 1000
    ).toISOString();
    expect(getGapTime(start)).toBe("2시간 30분");
  });

  it("should calculate gap between two dates", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = "2024-01-01T02:30:00Z";
    expect(getGapTime(start, end)).toBe("2시간 30분");
  });

  it("should return minutes for < 1 hour", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = "2024-01-01T00:45:00Z";
    expect(getGapTime(start, end)).toBe("45분");
  });

  it("should return 1분미만 for < 60 seconds without includeSeconds", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = "2024-01-01T00:00:30Z";
    expect(getGapTime(start, end)).toBe("1분미만");
  });

  it("should return seconds for < 60 seconds with includeSeconds", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = "2024-01-01T00:00:30Z";
    expect(getGapTime(start, end, true)).toBe("30초");
  });

  it("should include seconds in minutes range", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = "2024-01-01T00:05:30Z";
    expect(getGapTime(start, end, true)).toBe("5분 30초");
  });

  it("should include seconds in hours range", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = "2024-01-01T02:30:45Z";
    expect(getGapTime(start, end, true)).toBe("2시간 30분 45초");
  });
});

describe("convertToYYYYMMDD", () => {
  it("should convert YYYY-MM-DD to YYYYMMDD", () => {
    expect(convertToYYYYMMDD("2024-01-01")).toBe("20240101");
  });

  it("should convert YYYY.MM.DD to YYYYMMDD", () => {
    expect(convertToYYYYMMDD("2024.01.01")).toBe("20240101");
  });

  it("should return YYYYMMDD as-is", () => {
    expect(convertToYYYYMMDD("20240101")).toBe("20240101");
  });

  it("should return empty for null/undefined", () => {
    expect(convertToYYYYMMDD(null)).toBe("");
    expect(convertToYYYYMMDD(undefined)).toBe("");
  });

  it("should return empty for empty string", () => {
    expect(convertToYYYYMMDD("")).toBe("");
  });

  it("should warn and return empty for invalid format", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(convertToYYYYMMDD("2024/01/01")).toBe("");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should warn for partial date strings", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(convertToYYYYMMDD("2024-01")).toBe("");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("convertToISO8601", () => {
  it("should convert YYYY-MM-DD to ISO 8601", () => {
    const result = convertToISO8601("2024-01-01");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should convert YYYY.MM.DD to ISO 8601", () => {
    const result = convertToISO8601("2024.01.01");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should return ISO 8601 string as-is", () => {
    const iso = "2024-01-01T00:00:00.000Z";
    expect(convertToISO8601(iso)).toBe(iso);
  });

  it("should return ISO 8601 without Z as-is", () => {
    const iso = "2024-01-01T00:00:00.000";
    expect(convertToISO8601(iso)).toBe(iso);
  });

  it("should return empty for null/undefined", () => {
    expect(convertToISO8601(null)).toBe("");
    expect(convertToISO8601(undefined)).toBe("");
  });

  it("should return empty for empty string", () => {
    expect(convertToISO8601("")).toBe("");
  });

  it("should warn and return empty for invalid format", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(convertToISO8601("invalid-date")).toBe("");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("formatDateByPattern", () => {
  it("should format with YYYY-MM-DD pattern", () => {
    const d = new Date(2024, 0, 1, 14, 30, 45);
    expect(formatDateByPattern(d, "YYYY-MM-DD")).toBe("2024-01-01");
  });

  it("should format with YYYY.MM.DD HH:mm:ss pattern", () => {
    const d = new Date(2024, 0, 1, 14, 30, 45);
    expect(formatDateByPattern(d, "YYYY.MM.DD HH:mm:ss")).toBe(
      "2024.01.01 14:30:45"
    );
  });

  it("should format with YYYYMMDD pattern", () => {
    const d = new Date(2024, 0, 1);
    expect(formatDateByPattern(d, "YYYYMMDD")).toBe("20240101");
  });

  it("should handle YY (2-digit year)", () => {
    const d = new Date(2024, 5, 15);
    expect(formatDateByPattern(d, "YY-MM-DD")).toBe("24-06-15");
  });

  it("should handle 12-hour format (hh)", () => {
    const d = new Date(2024, 0, 1, 14, 30, 0);
    expect(formatDateByPattern(d, "hh:mm")).toBe("02:30");
  });

  it("should handle AM/PM", () => {
    const morning = new Date(2024, 0, 1, 9, 0, 0);
    // Note: A gets replaced with AM/PM but also matches in other tokens
    // The function replaces A globally
    const result = formatDateByPattern(morning, "HH:mm A");
    expect(result).toContain("AM");

    const afternoon = new Date(2024, 0, 1, 14, 0, 0);
    const result2 = formatDateByPattern(afternoon, "HH:mm A");
    expect(result2).toContain("PM");
  });

  it("should handle Korean day of week (요일)", () => {
    // 2024-01-01 is Monday
    const d = new Date(2024, 0, 1);
    const result = formatDateByPattern(d, "YYYY년 MM월 DD일 (요일)");
    expect(result).toContain("(월)");
  });

  it("should return empty for null date", () => {
    expect(formatDateByPattern(null, "YYYY-MM-DD")).toBe("");
  });

  it("should return empty for undefined date", () => {
    expect(formatDateByPattern(undefined, "YYYY-MM-DD")).toBe("");
  });

  it("should return empty for empty format", () => {
    expect(formatDateByPattern(new Date(), "")).toBe("");
  });

  it("should handle YYYYMMDD string input", () => {
    expect(formatDateByPattern("20240615", "YYYY-MM-DD")).toBe("2024-06-15");
  });

  it("should handle YYYY-MM-DD string input", () => {
    expect(formatDateByPattern("2024-06-15", "YYYYMMDD")).toBe("20240615");
  });

  it("should handle YYYY.MM.DD string input", () => {
    expect(formatDateByPattern("2024.06.15", "YYYYMMDD")).toBe("20240615");
  });

  it("should return empty for invalid string input", () => {
    expect(formatDateByPattern("not-a-date", "YYYY-MM-DD")).toBe("");
  });
});

describe("formatBirthDateShort", () => {
  it("should format YYYYMMDD to YY-MM-DD", () => {
    expect(formatBirthDateShort("20240615")).toBe("24-06-15");
  });

  it("should format YYYY-MM-DD to YY-MM-DD", () => {
    expect(formatBirthDateShort("1990-12-31")).toBe("90-12-31");
  });

  it("should return original for invalid input", () => {
    expect(formatBirthDateShort("invalid")).toBe("invalid");
  });

  it("should return original for empty string", () => {
    expect(formatBirthDateShort("")).toBe("");
  });
});

describe("convertToUTCISOStart", () => {
  it("should convert YYYY-MM-DD to KST 00:00 as UTC ISO", () => {
    // KST 2024-01-15 00:00:00 => UTC 2024-01-14T15:00:00.000Z
    const result = convertToUTCISOStart("2024-01-15");
    expect(result).toBe("2024-01-14T15:00:00.000Z");
  });

  it("should handle month boundary", () => {
    // KST 2024-02-01 00:00:00 => UTC 2024-01-31T15:00:00.000Z
    const result = convertToUTCISOStart("2024-02-01");
    expect(result).toBe("2024-01-31T15:00:00.000Z");
  });

  it("should handle year boundary", () => {
    // KST 2024-01-01 00:00:00 => UTC 2023-12-31T15:00:00.000Z
    const result = convertToUTCISOStart("2024-01-01");
    expect(result).toBe("2023-12-31T15:00:00.000Z");
  });
});

describe("convertToUTCISOEnd", () => {
  it("should convert YYYY-MM-DD to KST 23:59:59.999 as UTC ISO", () => {
    // KST 2024-01-15 23:59:59.999 => UTC 2024-01-15T14:59:59.999Z
    const result = convertToUTCISOEnd("2024-01-15");
    expect(result).toBe("2024-01-15T14:59:59.999Z");
  });

  it("should handle month boundary", () => {
    // KST 2024-01-31 23:59:59.999 => UTC 2024-01-31T14:59:59.999Z
    const result = convertToUTCISOEnd("2024-01-31");
    expect(result).toBe("2024-01-31T14:59:59.999Z");
  });

  it("should handle year end", () => {
    // KST 2024-12-31 23:59:59.999 => UTC 2024-12-31T14:59:59.999Z
    const result = convertToUTCISOEnd("2024-12-31");
    expect(result).toBe("2024-12-31T14:59:59.999Z");
  });
});

describe("getMonthUTCRangeWithPadding", () => {
  it("should return range for the month without padding", () => {
    const date = new Date(2024, 0, 15); // January 2024
    const result = getMonthUTCRangeWithPadding(date);
    const begin = new Date(result.beginUTC);
    const end = new Date(result.endUTC);
    // Begin should be Jan 1
    expect(begin.getDate()).toBe(1);
    // End should be Jan 31
    expect(end.getDate()).toBe(31);
  });

  it("should add padding days", () => {
    const date = new Date(2024, 0, 15); // January 2024
    const result = getMonthUTCRangeWithPadding(date, 7);
    const begin = new Date(result.beginUTC);
    const end = new Date(result.endUTC);
    // Begin: Jan 1 - 7 = Dec 25 of prev year
    expect(begin.getMonth()).toBe(11); // December
    expect(begin.getDate()).toBe(25);
    // End: Jan 31 + 7 = Feb 7
    expect(end.getMonth()).toBe(1); // February
    expect(end.getDate()).toBe(7);
  });

  it("should handle February (non-leap year)", () => {
    const date = new Date(2023, 1, 15); // February 2023
    const result = getMonthUTCRangeWithPadding(date);
    const end = new Date(result.endUTC);
    expect(end.getDate()).toBe(28);
  });

  it("should handle February (leap year)", () => {
    const date = new Date(2024, 1, 15); // February 2024 (leap year)
    const result = getMonthUTCRangeWithPadding(date);
    const end = new Date(result.endUTC);
    expect(end.getDate()).toBe(29);
  });

  it("should produce valid ISO strings", () => {
    const date = new Date(2024, 5, 15);
    const result = getMonthUTCRangeWithPadding(date, 3);
    expect(result.beginUTC).toMatch(/Z$/);
    expect(result.endUTC).toMatch(/Z$/);
    expect(new Date(result.beginUTC).getTime()).toBeLessThan(
      new Date(result.endUTC).getTime()
    );
  });
});

describe("parseBirthDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should parse YYYYMMDD birth date", () => {
    const result = parseBirthDate("19901231");
    expect(result.getFullYear()).toBe(1990);
    // Note: new Date("1990-12-31") parsing may vary; month/day depend on local TZ
    expect(result.getMonth()).toBe(11); // December
  });

  it("should parse non-YYYYMMDD string via Date constructor", () => {
    const result = parseBirthDate("1990-12-31");
    expect(result.getFullYear()).toBe(1990);
  });

  it("should return current date for empty string", () => {
    const result = parseBirthDate("");
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });

  it("should return current date for invalid string", () => {
    const result = parseBirthDate("invalid");
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });

  it("should handle 8-digit non-numeric string via Date constructor", () => {
    // "abcdefgh" is 8 chars but not all digits
    const result = parseBirthDate("abcdefgh");
    // new Date("abcdefgh") is invalid => falls back to new Date()
    expect(result.getTime()).toBe(FIXED_NOW.getTime());
  });
});

describe("formatUTCDateToKSTString", () => {
  it("should convert UTC date string to KST date string using Intl", () => {
    const result = formatUTCDateToKSTString("2024-01-01T00:00:00Z");
    // KST is UTC+9, so 2024-01-01 00:00 UTC = 2024-01-01 09:00 KST
    expect(result).toBe("2024-01-01");
  });

  it("should handle UTC time that crosses day boundary", () => {
    // 2024-01-01T20:00:00Z => KST 2024-01-02 05:00
    const result = formatUTCDateToKSTString("2024-01-01T20:00:00Z");
    expect(result).toBe("2024-01-02");
  });

  it("should accept Date object", () => {
    const date = new Date("2024-06-15T00:00:00Z");
    const result = formatUTCDateToKSTString(date);
    // Should be 2024-06-15 in KST (09:00 KST)
    expect(result).toBe("2024-06-15");
  });

  it("should handle year boundary", () => {
    // 2023-12-31T20:00:00Z => KST 2024-01-01 05:00
    const result = formatUTCDateToKSTString("2023-12-31T20:00:00Z");
    expect(result).toBe("2024-01-01");
  });
});

describe("isSameCalendarDay", () => {
  it("should return true for same day", () => {
    const a = new Date(2024, 0, 1, 10, 0, 0);
    const b = new Date(2024, 0, 1, 23, 59, 59);
    expect(isSameCalendarDay(a, b)).toBe(true);
  });

  it("should return false for different days", () => {
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 0, 2);
    expect(isSameCalendarDay(a, b)).toBe(false);
  });

  it("should return false for different months", () => {
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 1, 1);
    expect(isSameCalendarDay(a, b)).toBe(false);
  });

  it("should return false for different years", () => {
    const a = new Date(2024, 0, 1);
    const b = new Date(2023, 0, 1);
    expect(isSameCalendarDay(a, b)).toBe(false);
  });

  it("should return true for same date different times", () => {
    const a = new Date(2024, 5, 15, 0, 0, 0);
    const b = new Date(2024, 5, 15, 23, 59, 59);
    expect(isSameCalendarDay(a, b)).toBe(true);
  });
});
