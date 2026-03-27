import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  formatTime,
  getWeekDates,
  isSameDay,
  isSameDate,
  isDateInRange,
  getWeekRange,
  getDateRangeText,
  getMonthText,
  getTimeSlots,
  getSlotsPerHour,
  formatBirthDate,
  renderExternalPlatformIcon,
  getAppointmentStatusColor,
} from "../reservation-utils";

// Use fake timers to control Date behavior across all date-dependent tests
beforeEach(() => {
  vi.useFakeTimers();
  // Fix to a known date: Wednesday, 2025-01-15 09:00:00 KST
  vi.setSystemTime(new Date(2025, 0, 15, 9, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatDate", () => {
  it("formats a date in Korean YYYY년 MM월 DD일 (weekday) format", () => {
    const date = new Date(2025, 0, 15); // Wednesday
    const result = formatDate(date);
    expect(result).toMatch(/2025년 01월 15일/);
    // Should contain a Korean weekday abbreviation in parentheses
    expect(result).toMatch(/\(.+\)$/);
  });

  it("pads single-digit month and day with leading zeros", () => {
    const date = new Date(2025, 2, 5); // March 5
    const result = formatDate(date);
    expect(result).toMatch(/2025년 03월 05일/);
  });

  it("formats December 31 correctly", () => {
    const date = new Date(2025, 11, 31);
    const result = formatDate(date);
    expect(result).toMatch(/2025년 12월 31일/);
  });
});

describe("formatTime", () => {
  it("formats hour and minute with leading zeros", () => {
    expect(formatTime(9, 5)).toBe("09:05");
  });

  it("defaults minute to 0 when not provided", () => {
    expect(formatTime(14)).toBe("14:00");
  });

  it("formats midnight correctly", () => {
    expect(formatTime(0, 0)).toBe("00:00");
  });

  it("formats 23:59 correctly", () => {
    expect(formatTime(23, 59)).toBe("23:59");
  });
});

describe("getWeekDates", () => {
  it("returns an array of 7 dates", () => {
    const date = new Date(2025, 0, 15); // Wednesday
    const result = getWeekDates(date);
    expect(result).toHaveLength(7);
  });

  it("starts from Sunday of the given date's week", () => {
    const date = new Date(2025, 0, 15); // Wednesday
    const result = getWeekDates(date);
    // Jan 15, 2025 is Wednesday; Sunday of that week is Jan 12
    expect(result[0].getDay()).toBe(0); // Sunday
    expect(result[0].getDate()).toBe(12);
  });

  it("ends on Saturday of the given date's week", () => {
    const date = new Date(2025, 0, 15);
    const result = getWeekDates(date);
    expect(result[6].getDay()).toBe(6); // Saturday
    expect(result[6].getDate()).toBe(18);
  });

  it("handles a date that is already Sunday", () => {
    const date = new Date(2025, 0, 12); // Sunday
    const result = getWeekDates(date);
    expect(result[0].getDate()).toBe(12);
    expect(result[6].getDate()).toBe(18);
  });

  it("handles month boundaries", () => {
    // Jan 1, 2025 is Wednesday; Sunday of that week is Dec 29, 2024
    const date = new Date(2025, 0, 1);
    const result = getWeekDates(date);
    expect(result[0].getMonth()).toBe(11); // December
    expect(result[0].getFullYear()).toBe(2024);
    expect(result[0].getDate()).toBe(29);
  });
});

describe("isSameDay", () => {
  it("returns true for same day regardless of time", () => {
    const a = new Date(2025, 0, 15, 8, 0, 0);
    const b = new Date(2025, 0, 15, 22, 30, 45);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    const a = new Date(2025, 0, 15);
    const b = new Date(2025, 0, 16);
    expect(isSameDay(a, b)).toBe(false);
  });

  it("returns false for same day different month", () => {
    const a = new Date(2025, 0, 15);
    const b = new Date(2025, 1, 15);
    expect(isSameDay(a, b)).toBe(false);
  });

  it("returns false for same day different year", () => {
    const a = new Date(2025, 0, 15);
    const b = new Date(2024, 0, 15);
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe("isSameDate", () => {
  it("returns true for identical timestamps", () => {
    const a = new Date(2025, 0, 15, 10, 30, 0);
    const b = new Date(2025, 0, 15, 10, 30, 0);
    expect(isSameDate(a, b)).toBe(true);
  });

  it("returns false when times differ", () => {
    const a = new Date(2025, 0, 15, 10, 30, 0);
    const b = new Date(2025, 0, 15, 10, 30, 1);
    expect(isSameDate(a, b)).toBe(false);
  });
});

describe("isDateInRange", () => {
  it("returns true when date is within range", () => {
    const date = new Date(2025, 0, 15);
    const start = new Date(2025, 0, 10);
    const end = new Date(2025, 0, 20);
    expect(isDateInRange(date, start, end)).toBe(true);
  });

  it("returns true when date equals start date", () => {
    const date = new Date(2025, 0, 10, 15, 0, 0);
    const start = new Date(2025, 0, 10, 8, 0, 0);
    const end = new Date(2025, 0, 20);
    expect(isDateInRange(date, start, end)).toBe(true);
  });

  it("returns true when date equals end date", () => {
    const date = new Date(2025, 0, 20);
    const start = new Date(2025, 0, 10);
    const end = new Date(2025, 0, 20);
    expect(isDateInRange(date, start, end)).toBe(true);
  });

  it("returns false when date is before range", () => {
    const date = new Date(2025, 0, 9);
    const start = new Date(2025, 0, 10);
    const end = new Date(2025, 0, 20);
    expect(isDateInRange(date, start, end)).toBe(false);
  });

  it("returns false when date is after range", () => {
    const date = new Date(2025, 0, 21);
    const start = new Date(2025, 0, 10);
    const end = new Date(2025, 0, 20);
    expect(isDateInRange(date, start, end)).toBe(false);
  });

  it("ignores time component when comparing", () => {
    const date = new Date(2025, 0, 10, 23, 59, 59);
    const start = new Date(2025, 0, 10, 0, 0, 0);
    const end = new Date(2025, 0, 10, 0, 0, 0);
    expect(isDateInRange(date, start, end)).toBe(true);
  });
});

describe("getWeekRange", () => {
  it("returns start as Sunday 00:00:00.000", () => {
    const date = new Date(2025, 0, 15); // Wednesday
    const { start } = getWeekRange(date);
    expect(start.getDay()).toBe(0); // Sunday
    expect(start.getDate()).toBe(12);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it("returns end as Saturday 23:59:59.999", () => {
    const date = new Date(2025, 0, 15);
    const { end } = getWeekRange(date);
    expect(end.getDay()).toBe(6); // Saturday
    expect(end.getDate()).toBe(18);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("handles Sunday input correctly", () => {
    const date = new Date(2025, 0, 12); // Sunday
    const { start, end } = getWeekRange(date);
    expect(start.getDate()).toBe(12);
    expect(end.getDate()).toBe(18);
  });
});

describe("getDateRangeText", () => {
  it("generates Korean date range text", () => {
    const start = new Date(2025, 0, 12); // Sunday
    const end = new Date(2025, 0, 18); // Saturday
    const result = getDateRangeText(start, end);
    // Should contain month and day for both dates
    expect(result).toContain("1월 12일");
    expect(result).toContain("1월 18일");
    expect(result).toContain(" - ");
  });

  it("handles cross-month ranges", () => {
    const start = new Date(2025, 0, 27);
    const end = new Date(2025, 1, 2);
    const result = getDateRangeText(start, end);
    expect(result).toContain("1월 27일");
    expect(result).toContain("2월 2일");
  });
});

describe("getMonthText", () => {
  it("returns YYYY년 M월 format", () => {
    const date = new Date(2025, 0, 15);
    expect(getMonthText(date)).toBe("2025년 1월");
  });

  it("handles December", () => {
    const date = new Date(2025, 11, 1);
    expect(getMonthText(date)).toBe("2025년 12월");
  });
});

describe("getTimeSlots", () => {
  it("returns an array of hourly integers from fromTime to toTime (exclusive)", () => {
    const result = getTimeSlots(9, 12);
    expect(result).toEqual([9, 10, 11]);
  });

  it("returns empty array when fromTime equals toTime", () => {
    const result = getTimeSlots(9, 9);
    expect(result).toEqual([]);
  });

  it("returns single element when range is 1 hour", () => {
    const result = getTimeSlots(0, 1);
    expect(result).toEqual([0]);
  });

  it("handles full day range", () => {
    const result = getTimeSlots(0, 24);
    expect(result).toHaveLength(24);
    expect(result[0]).toBe(0);
    expect(result[23]).toBe(23);
  });

  it("accepts timeInterval parameter without affecting output", () => {
    // Current implementation ignores timeInterval
    const result = getTimeSlots(9, 12, 15);
    expect(result).toEqual([9, 10, 11]);
  });
});

describe("getSlotsPerHour", () => {
  it("returns 2 for 30-minute intervals", () => {
    expect(getSlotsPerHour(30)).toBe(2);
  });

  it("returns 4 for 15-minute intervals", () => {
    expect(getSlotsPerHour(15)).toBe(4);
  });

  it("returns 1 for 60-minute intervals", () => {
    expect(getSlotsPerHour(60)).toBe(1);
  });

  it("returns 6 for 10-minute intervals", () => {
    expect(getSlotsPerHour(10)).toBe(6);
  });
});

describe("formatBirthDate", () => {
  it("converts YYYYMMDD to YYYY-MM-DD", () => {
    expect(formatBirthDate("19900115")).toBe("1990-01-15");
  });

  it("returns empty string for empty input", () => {
    expect(formatBirthDate("")).toBe("");
  });

  it("returns original string for non-8-digit input", () => {
    expect(formatBirthDate("1990-01-15")).toBe("1990-01-15");
  });

  it("returns original string for short input", () => {
    expect(formatBirthDate("199001")).toBe("199001");
  });

  it("handles edge date values", () => {
    expect(formatBirthDate("20001231")).toBe("2000-12-31");
    expect(formatBirthDate("20000101")).toBe("2000-01-01");
  });
});

describe("renderExternalPlatformIcon", () => {
  it("returns ddocdoc icon path for 'ddocdoc' platform", () => {
    expect(renderExternalPlatformIcon("ddocdoc")).toBe("/icon/ic_ddocdoc.svg");
  });

  it("returns null for unknown platform", () => {
    expect(renderExternalPlatformIcon("naver")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(renderExternalPlatformIcon("")).toBeNull();
  });
});

describe("getAppointmentStatusColor", () => {
  it("returns purple classes for CONFIRMED", () => {
    const result = getAppointmentStatusColor("CONFIRMED");
    expect(result).toBe("bg-[var(--purple-1)] text-[var(--purple-2)]");
  });

  it("returns gray classes for CANCELED", () => {
    const result = getAppointmentStatusColor("CANCELED");
    expect(result).toBe("bg-[var(--gray-4)] text-[var(--gray-400)]");
  });

  it("returns red classes for NOSHOW", () => {
    const result = getAppointmentStatusColor("NOSHOW");
    expect(result).toBe("bg-[var(--red-1)] text-[var(--red-2)]");
  });

  it("returns yellow classes for PENDING", () => {
    const result = getAppointmentStatusColor("PENDING");
    expect(result).toBe("bg-[var(--yellow-4)] text-[var(--yellow-1)]");
  });

  it("returns lime classes for VISITED", () => {
    const result = getAppointmentStatusColor("VISITED");
    expect(result).toBe("bg-[var(--lime-1)] text-[var(--lime-2)]");
  });

  it("returns default gray classes for unknown status", () => {
    const result = getAppointmentStatusColor("UNKNOWN");
    expect(result).toBe("bg-gray-100 text-gray-800");
  });
});
