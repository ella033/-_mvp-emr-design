import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getHolidayQueryRange,
  getHolidayQueryRangeForYear,
  getHolidayQueryRangeRelativeToYear,
  getKstParts,
  toKstYmd,
  isKstYmdInRange,
  isMasterHolidayOnDate,
  isRegularHolidayOnDate,
  isTempHolidayOnDate,
  findHospitalHolidayInfoFromDate,
  isHospitalHolidayDate,
} from "../holiday-utils";
import { HolidayRecurrenceType, HolidayRecurrenceWeek, DayOfWeek } from "@/constants/common/common-enum";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import type { HospitalHolidayTypes } from "@/types/calendar-types";

// ---------------------------------------------------------------------------
// Helpers to build mock data
// ---------------------------------------------------------------------------

function makeMasterHoliday(
  overrides: Partial<HolidayApplicationTypes> & { holidayInstances?: { actualDate: string | Date }[] } = {}
): HolidayApplicationTypes {
  const { holidayInstances, ...rest } = overrides;
  return {
    id: 1,
    hospitalId: 1,
    appointmentRoomId: null,
    holidayMasterId: 100,
    startDate: null,
    endDate: null,
    holidayName: "Master Holiday",
    isActive: true,
    periods: [],
    holidayMaster: {
      holidayInstances: holidayInstances ?? [],
    } as any,
    ...rest,
  } as HolidayApplicationTypes;
}

function makeRegularHoliday(
  overrides: Partial<HolidayApplicationTypes> = {}
): HolidayApplicationTypes {
  return {
    id: 2,
    hospitalId: 1,
    appointmentRoomId: null,
    holidayMasterId: null,
    startDate: null,
    endDate: null,
    holidayName: "Regular Holiday",
    isActive: true,
    recurrenceType: HolidayRecurrenceType.매월,
    recurrenceDayOfWeek: DayOfWeek.MONDAY,
    recurrenceWeek: HolidayRecurrenceWeek.첫째주,
    periods: [],
    holidayMaster: null as any,
    ...overrides,
  } as HolidayApplicationTypes;
}

function makeTempHoliday(
  startDate: string,
  endDate: string,
  overrides: Partial<HolidayApplicationTypes> = {}
): HolidayApplicationTypes {
  return {
    id: 3,
    hospitalId: 1,
    appointmentRoomId: null,
    holidayMasterId: null,
    startDate: new Date(startDate) as any,
    endDate: new Date(endDate) as any,
    holidayName: "Temp Holiday",
    isActive: true,
    recurrenceType: HolidayRecurrenceType.없음,
    periods: [],
    holidayMaster: null as any,
    ...overrides,
  } as HolidayApplicationTypes;
}

function makeHospitalHoliday(
  startDate: string,
  endDate: string,
  overrides: Partial<HospitalHolidayTypes> = {}
): HospitalHolidayTypes {
  return {
    id: 1,
    holidayName: "Hospital Holiday",
    startDate: new Date(startDate) as any,
    endDate: new Date(endDate) as any,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("holiday-utils", () => {
  // ========================================================================
  // getHolidayQueryRange
  // ========================================================================
  describe("getHolidayQueryRange", () => {
    it("returns range from Jan 1 of startYear to Dec 31 of endYear", () => {
      const result = getHolidayQueryRange(2024, 2026);
      expect(result).toEqual({
        startDate: "2024-01-01",
        endDate: "2026-12-31",
      });
    });

    it("handles same start and end year", () => {
      const result = getHolidayQueryRange(2025, 2025);
      expect(result).toEqual({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
    });

    it("pads single-digit years", () => {
      const result = getHolidayQueryRange(5, 5);
      expect(result).toEqual({
        startDate: "0005-01-01",
        endDate: "0005-12-31",
      });
    });
  });

  // ========================================================================
  // getHolidayQueryRangeForYear
  // ========================================================================
  describe("getHolidayQueryRangeForYear", () => {
    it("returns Jan 1 to Dec 31 for a single year", () => {
      expect(getHolidayQueryRangeForYear(2025)).toEqual({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
    });
  });

  // ========================================================================
  // getHolidayQueryRangeRelativeToYear
  // ========================================================================
  describe("getHolidayQueryRangeRelativeToYear", () => {
    it("applies offsets to base year", () => {
      const result = getHolidayQueryRangeRelativeToYear(2025, -1, 1);
      expect(result).toEqual({
        startDate: "2024-01-01",
        endDate: "2026-12-31",
      });
    });

    it("works with zero offsets", () => {
      const result = getHolidayQueryRangeRelativeToYear(2025, 0, 0);
      expect(result).toEqual({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
    });

    it("works with negative-only offsets", () => {
      const result = getHolidayQueryRangeRelativeToYear(2025, -3, -1);
      expect(result).toEqual({
        startDate: "2022-01-01",
        endDate: "2024-12-31",
      });
    });
  });

  // ========================================================================
  // getKstParts
  // ========================================================================
  describe("getKstParts", () => {
    it("converts a UTC midnight date to KST (same day when UTC+9 still same date)", () => {
      // 2025-06-15 00:00 UTC  =>  KST 2025-06-15 09:00
      const date = new Date("2025-06-15T00:00:00.000Z");
      const parts = getKstParts(date);
      expect(parts.year).toBe(2025);
      expect(parts.monthIndex).toBe(5); // June = index 5
      expect(parts.day).toBe(15);
      expect(parts.dayOfWeek).toBe(DayOfWeek.SUNDAY);
    });

    it("rolls date forward when UTC time + 9h crosses midnight", () => {
      // 2025-03-31 23:00 UTC  =>  KST 2025-04-01 08:00
      const date = new Date("2025-03-31T23:00:00.000Z");
      const parts = getKstParts(date);
      expect(parts.year).toBe(2025);
      expect(parts.monthIndex).toBe(3); // April = index 3
      expect(parts.day).toBe(1);
      expect(parts.dayOfWeek).toBe(DayOfWeek.TUESDAY);
    });

    it("rolls year forward at year boundary in KST", () => {
      // 2024-12-31 20:00 UTC  =>  KST 2025-01-01 05:00
      const date = new Date("2024-12-31T20:00:00.000Z");
      const parts = getKstParts(date);
      expect(parts.year).toBe(2025);
      expect(parts.monthIndex).toBe(0);
      expect(parts.day).toBe(1);
    });
  });

  // ========================================================================
  // toKstYmd
  // ========================================================================
  describe("toKstYmd", () => {
    it("converts a Date to YYYY-MM-DD in KST", () => {
      const date = new Date("2025-07-04T00:00:00.000Z");
      expect(toKstYmd(date)).toBe("2025-07-04");
    });

    it("converts a string date to YYYY-MM-DD in KST", () => {
      expect(toKstYmd("2025-01-15T15:00:00.000Z")).toBe("2025-01-16");
    });

    it("returns empty string for null", () => {
      expect(toKstYmd(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(toKstYmd(undefined)).toBe("");
    });

    it("returns empty string for invalid date string", () => {
      expect(toKstYmd("not-a-date")).toBe("");
    });

    it("pads month and day to two digits", () => {
      // 2025-01-05 00:00 UTC => KST 2025-01-05 09:00
      const date = new Date("2025-01-05T00:00:00.000Z");
      expect(toKstYmd(date)).toBe("2025-01-05");
    });
  });

  // ========================================================================
  // isKstYmdInRange
  // ========================================================================
  describe("isKstYmdInRange", () => {
    it("returns true when target is within range", () => {
      expect(isKstYmdInRange("2025-06-15", "2025-06-01", "2025-06-30")).toBe(true);
    });

    it("returns true when target equals start", () => {
      expect(isKstYmdInRange("2025-06-01", "2025-06-01", "2025-06-30")).toBe(true);
    });

    it("returns true when target equals end", () => {
      expect(isKstYmdInRange("2025-06-30", "2025-06-01", "2025-06-30")).toBe(true);
    });

    it("returns false when target is before range", () => {
      expect(isKstYmdInRange("2025-05-31", "2025-06-01", "2025-06-30")).toBe(false);
    });

    it("returns false when target is after range", () => {
      expect(isKstYmdInRange("2025-07-01", "2025-06-01", "2025-06-30")).toBe(false);
    });

    it("swaps from/to if from > to", () => {
      expect(isKstYmdInRange("2025-06-15", "2025-06-30", "2025-06-01")).toBe(true);
    });

    it("returns false for empty targetYmd", () => {
      expect(isKstYmdInRange("", "2025-06-01", "2025-06-30")).toBe(false);
    });

    it("returns false for empty fromYmd", () => {
      expect(isKstYmdInRange("2025-06-15", "", "2025-06-30")).toBe(false);
    });

    it("returns false for empty toYmd", () => {
      expect(isKstYmdInRange("2025-06-15", "2025-06-01", "")).toBe(false);
    });
  });

  // ========================================================================
  // isMasterHolidayOnDate
  // ========================================================================
  describe("isMasterHolidayOnDate", () => {
    it("returns true when an instance matches the target date and system year", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: "2025-03-01T00:00:00.000Z" }],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(true);
    });

    it("returns false when holidayMasterId is null", () => {
      const holiday = makeMasterHoliday({ holidayMasterId: null });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("returns false when instances array is empty", () => {
      const holiday = makeMasterHoliday({ holidayInstances: [] });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("returns false when instance year does not match system year", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: "2024-03-01T00:00:00.000Z" }],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("returns false when no instance date matches target", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: "2025-03-02T00:00:00.000Z" }],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("defaults systemYear to current year", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T00:00:00.000Z"));

      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: "2025-06-15T00:00:00.000Z" }],
      });
      const target = new Date("2025-06-15T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target)).toBe(true);

      vi.useRealTimers();
    });

    it("returns false when holidayMaster has no holidayInstances property", () => {
      const holiday = {
        ...makeMasterHoliday(),
        holidayMaster: {} as any,
      } as HolidayApplicationTypes;
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("returns false for instance with invalid actualDate", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: "invalid" as any }],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("handles actualDate as Date object", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: new Date("2025-03-01T00:00:00.000Z") }],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(true);
    });

    it("handles actualDate as non-string, non-Date value", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [{ actualDate: 12345 as any }],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(false);
    });

    it("matches among multiple instances", () => {
      const holiday = makeMasterHoliday({
        holidayInstances: [
          { actualDate: "2025-01-01T00:00:00.000Z" },
          { actualDate: "2025-03-01T00:00:00.000Z" },
          { actualDate: "2025-05-05T00:00:00.000Z" },
        ],
      });
      const target = new Date("2025-03-01T00:00:00.000Z");
      expect(isMasterHolidayOnDate(holiday, target, 2025)).toBe(true);
    });
  });

  // ========================================================================
  // isRegularHolidayOnDate
  // ========================================================================
  describe("isRegularHolidayOnDate", () => {
    it("returns false when holidayMasterId is set (master holiday)", () => {
      const holiday = makeRegularHoliday({ holidayMasterId: 100 });
      const target = new Date("2025-06-02T00:00:00.000Z"); // Monday
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when recurrenceType is 없음", () => {
      const holiday = makeRegularHoliday({ recurrenceType: HolidayRecurrenceType.없음 });
      const target = new Date("2025-06-02T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when recurrenceType is not 매월", () => {
      const holiday = makeRegularHoliday({ recurrenceType: HolidayRecurrenceType.매주 });
      const target = new Date("2025-06-02T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when dayOfWeek is undefined", () => {
      const holiday = makeRegularHoliday({ recurrenceDayOfWeek: undefined });
      const target = new Date("2025-06-02T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when recurrenceWeek is undefined", () => {
      const holiday = makeRegularHoliday({ recurrenceWeek: undefined });
      const target = new Date("2025-06-02T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when target day-of-week does not match", () => {
      // Holiday is for Monday, target is Tuesday
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.MONDAY,
        recurrenceWeek: HolidayRecurrenceWeek.첫째주,
      });
      const target = new Date("2025-06-03T00:00:00.000Z"); // Tuesday
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    // -- First week Monday tests --
    it("matches first Monday of June 2025", () => {
      // June 2025: 1st is Sunday, so first Monday = June 2
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.MONDAY,
        recurrenceWeek: HolidayRecurrenceWeek.첫째주,
      });
      const target = new Date("2025-06-02T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });

    it("does not match second Monday when holiday is first week", () => {
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.MONDAY,
        recurrenceWeek: HolidayRecurrenceWeek.첫째주,
      });
      // Second Monday of June 2025 = June 9
      const target = new Date("2025-06-09T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    // -- Second week --
    it("matches second Wednesday of March 2025", () => {
      // March 2025: 1st is Saturday, first Wed = March 5, second Wed = March 12
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.WEDNESDAY,
        recurrenceWeek: HolidayRecurrenceWeek.둘째주,
      });
      const target = new Date("2025-03-12T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });

    // -- Third week --
    it("matches third Friday of January 2025", () => {
      // Jan 2025: 1st is Wednesday, first Fri = Jan 3, second = Jan 10, third = Jan 17
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.FRIDAY,
        recurrenceWeek: HolidayRecurrenceWeek.셋째주,
      });
      const target = new Date("2025-01-17T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });

    // -- Fourth week --
    it("matches fourth Thursday of April 2025", () => {
      // April 2025: 1st is Tuesday, first Thu = April 3, 4th Thu = April 24
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.THURSDAY,
        recurrenceWeek: HolidayRecurrenceWeek.넷째주,
      });
      const target = new Date("2025-04-24T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });

    // -- Last week (마지막주) --
    it("matches last Sunday of February 2025", () => {
      // Feb 2025: 28 days, Feb 28 is Friday, last Sunday = Feb 23
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.SUNDAY,
        recurrenceWeek: HolidayRecurrenceWeek.마지막주,
      });
      const target = new Date("2025-02-23T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });

    it("does not match non-last occurrence for 마지막주", () => {
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.SUNDAY,
        recurrenceWeek: HolidayRecurrenceWeek.마지막주,
      });
      // Feb 16 is the third Sunday, not the last
      const target = new Date("2025-02-16T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    it("matches last Saturday of a month where last day is Saturday", () => {
      // May 2025: May 31 is Saturday
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.SATURDAY,
        recurrenceWeek: HolidayRecurrenceWeek.마지막주,
      });
      const target = new Date("2025-05-31T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });

    it("returns false when recurrenceType is missing (defaults to 없음)", () => {
      const holiday = makeRegularHoliday({ recurrenceType: undefined });
      const target = new Date("2025-06-02T00:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(false);
    });

    // -- KST boundary: UTC date differs from KST date --
    it("correctly evaluates when KST date differs from UTC date", () => {
      // 2025-06-01 22:00 UTC => 2025-06-02 07:00 KST (Monday in KST)
      // First Monday of June 2025 = June 2
      const holiday = makeRegularHoliday({
        recurrenceDayOfWeek: DayOfWeek.MONDAY,
        recurrenceWeek: HolidayRecurrenceWeek.첫째주,
      });
      const target = new Date("2025-06-01T22:00:00.000Z");
      expect(isRegularHolidayOnDate(holiday, target)).toBe(true);
    });
  });

  // ========================================================================
  // isTempHolidayOnDate
  // ========================================================================
  describe("isTempHolidayOnDate", () => {
    it("returns true when target date is within temp holiday range", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z");
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(true);
    });

    it("returns true on start date boundary", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z");
      const target = new Date("2025-06-10T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(true);
    });

    it("returns true on end date boundary", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z");
      const target = new Date("2025-06-15T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(true);
    });

    it("returns false when target is outside range", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z");
      const target = new Date("2025-06-16T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when holidayMasterId is set", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z", {
        holidayMasterId: 100,
      });
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when recurrenceType is not 없음", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z", {
        recurrenceType: HolidayRecurrenceType.매월,
      });
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when startDate is null", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z", {
        startDate: null,
      });
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(false);
    });

    it("returns false when endDate is null", () => {
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z", {
        endDate: null,
      });
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(false);
    });

    it("handles single-day temp holiday", () => {
      const holiday = makeTempHoliday("2025-06-12T00:00:00.000Z", "2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, new Date("2025-06-12T00:00:00.000Z"))).toBe(true);
      expect(isTempHolidayOnDate(holiday, new Date("2025-06-11T00:00:00.000Z"))).toBe(false);
      expect(isTempHolidayOnDate(holiday, new Date("2025-06-13T00:00:00.000Z"))).toBe(false);
    });

    it("returns false when recurrenceType defaults to 없음 via undefined", () => {
      // recurrenceType is undefined => defaults to 없음, so this IS a temp holiday check path
      const holiday = makeTempHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z", {
        recurrenceType: undefined,
      });
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(isTempHolidayOnDate(holiday, target)).toBe(true);
    });
  });

  // ========================================================================
  // findHospitalHolidayInfoFromDate
  // ========================================================================
  describe("findHospitalHolidayInfoFromDate", () => {
    it("returns matching holiday when date is in range", () => {
      const holidays = [
        makeHospitalHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z", {
          id: 10,
          holidayName: "Summer Break",
        }),
      ];
      const target = new Date("2025-06-12T00:00:00.000Z");
      const result = findHospitalHolidayInfoFromDate(holidays, target);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(10);
      expect(result?.holidayName).toBe("Summer Break");
    });

    it("returns null when no holiday matches", () => {
      const holidays = [
        makeHospitalHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z"),
      ];
      const target = new Date("2025-06-20T00:00:00.000Z");
      expect(findHospitalHolidayInfoFromDate(holidays, target)).toBeNull();
    });

    it("returns null for null holidays list", () => {
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(findHospitalHolidayInfoFromDate(null, target)).toBeNull();
    });

    it("returns null for undefined holidays list", () => {
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(findHospitalHolidayInfoFromDate(undefined, target)).toBeNull();
    });

    it("returns null for empty holidays list", () => {
      const target = new Date("2025-06-12T00:00:00.000Z");
      expect(findHospitalHolidayInfoFromDate([], target)).toBeNull();
    });

    it("returns the first matching holiday when multiple match", () => {
      const holidays = [
        makeHospitalHoliday("2025-06-01T00:00:00.000Z", "2025-06-30T00:00:00.000Z", {
          id: 1,
          holidayName: "First",
        }),
        makeHospitalHoliday("2025-06-10T00:00:00.000Z", "2025-06-20T00:00:00.000Z", {
          id: 2,
          holidayName: "Second",
        }),
      ];
      const target = new Date("2025-06-15T00:00:00.000Z");
      const result = findHospitalHolidayInfoFromDate(holidays, target);
      expect(result?.id).toBe(1);
    });
  });

  // ========================================================================
  // isHospitalHolidayDate
  // ========================================================================
  describe("isHospitalHolidayDate", () => {
    it("returns true when date falls within a hospital holiday", () => {
      const holidays = [
        makeHospitalHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z"),
      ];
      expect(isHospitalHolidayDate(holidays, new Date("2025-06-12T00:00:00.000Z"))).toBe(true);
    });

    it("returns false when date does not fall within any hospital holiday", () => {
      const holidays = [
        makeHospitalHoliday("2025-06-10T00:00:00.000Z", "2025-06-15T00:00:00.000Z"),
      ];
      expect(isHospitalHolidayDate(holidays, new Date("2025-06-20T00:00:00.000Z"))).toBe(false);
    });

    it("returns false for null holidays", () => {
      expect(isHospitalHolidayDate(null, new Date("2025-06-12T00:00:00.000Z"))).toBe(false);
    });

    it("returns false for undefined holidays", () => {
      expect(isHospitalHolidayDate(undefined, new Date("2025-06-12T00:00:00.000Z"))).toBe(false);
    });

    it("returns false for empty array", () => {
      expect(isHospitalHolidayDate([], new Date("2025-06-12T00:00:00.000Z"))).toBe(false);
    });
  });
});
