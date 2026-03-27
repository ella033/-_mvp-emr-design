import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/constants/common/common-enum", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  본인확인여부: {
    미완료: 0,
    완료: 1,
    예외: 2,
  },
}));

vi.mock("@/lib/date-utils", () => ({
  formatUTCDateToKSTString: vi.fn((date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }),
}));

vi.mock("@/lib/common-utils", () => ({
  extractInfoFromRrn: vi.fn((rrn: string) => {
    // Simple mock: treat 7-digit suffix starting with 3 or 4 as 2000s birth
    if (!rrn || rrn.length < 13) return { isValid: false };
    const front = rrn.replace("-", "").substring(0, 6);
    const genderDigit = rrn.replace("-", "").charAt(6);
    let century = "19";
    if (genderDigit === "3" || genderDigit === "4") century = "20";
    const birthString = `${century}${front.substring(0, 2)}-${front.substring(2, 4)}-${front.substring(4, 6)}`;
    return { isValid: true, birthString };
  }),
}));

vi.mock("@/lib/patient-utils", () => ({
  calculateAge: vi.fn((birthString: string) => {
    if (!birthString) return undefined;
    const birth = new Date(birthString);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }),
}));

import {
  REGISTRATION_ID_NEW,
  APPOINTMENT_ID_PREFIX,
  PROVISIONAL_ID_PREFIX,
  getIsVitalToday,
  isNewRegistrationId,
  isAppointmentRegistrationId,
  isRegistrationMode,
  isProvisionalRegistrationId,
  normalizeRegistrationId,
  buildAppointmentRegistrationId,
  buildProvisionalRegistrationId,
  formatTimeHHMM,
  isToday,
  checkIdYN,
  showIdYN,
} from "../registration-utils";

// eslint-disable-next-line @typescript-eslint/naming-convention
import { 본인확인여부 } from "@/constants/common/common-enum";

// ─── Constants ───────────────────────────────────────────────

describe("Constants", () => {
  it('REGISTRATION_ID_NEW is "new"', () => {
    expect(REGISTRATION_ID_NEW).toBe("new");
  });

  it('APPOINTMENT_ID_PREFIX is "a"', () => {
    expect(APPOINTMENT_ID_PREFIX).toBe("a");
  });

  it('PROVISIONAL_ID_PREFIX is "p"', () => {
    expect(PROVISIONAL_ID_PREFIX).toBe("p");
  });
});

// ─── getIsVitalToday ─────────────────────────────────────────

describe("getIsVitalToday", () => {
  it("returns false when receptionDateTime is null", () => {
    expect(getIsVitalToday(null, [{ measurementDateTime: "2025-01-01" }])).toBe(
      false
    );
  });

  it("returns false when receptionDateTime is undefined", () => {
    expect(
      getIsVitalToday(undefined, [{ measurementDateTime: "2025-01-01" }])
    ).toBe(false);
  });

  it("returns false when vitalMeasurements is null", () => {
    expect(getIsVitalToday("2025-01-01", null)).toBe(false);
  });

  it("returns false when vitalMeasurements is undefined", () => {
    expect(getIsVitalToday("2025-01-01", undefined)).toBe(false);
  });

  it("returns false when vitalMeasurements is empty", () => {
    expect(getIsVitalToday("2025-01-01", [])).toBe(false);
  });

  it("returns true when a measurement matches the reception date", () => {
    expect(
      getIsVitalToday("2025-03-15", [
        { measurementDateTime: "2025-03-15T09:30:00Z" },
      ])
    ).toBe(true);
  });

  it("returns false when no measurement matches the reception date", () => {
    expect(
      getIsVitalToday("2025-03-15", [
        { measurementDateTime: "2025-03-14T09:30:00Z" },
      ])
    ).toBe(false);
  });

  it("returns true when one of multiple measurements matches", () => {
    expect(
      getIsVitalToday("2025-03-15", [
        { measurementDateTime: "2025-03-14T09:30:00Z" },
        { measurementDateTime: "2025-03-15T14:00:00Z" },
        { measurementDateTime: "2025-03-16T08:00:00Z" },
      ])
    ).toBe(true);
  });

  it("accepts a Date object for receptionDateTime", () => {
    const receptionDate = new Date("2025-06-01T03:00:00Z");
    expect(
      getIsVitalToday(receptionDate, [
        { measurementDateTime: "2025-06-01T10:00:00Z" },
      ])
    ).toBe(true);
  });
});

// ─── isNewRegistrationId ─────────────────────────────────────

describe("isNewRegistrationId", () => {
  it('returns true for "new"', () => {
    expect(isNewRegistrationId("new")).toBe(true);
  });

  it('returns true for " new " (trimmed)', () => {
    expect(isNewRegistrationId(" new ")).toBe(true);
  });

  it("returns false for a numeric id", () => {
    expect(isNewRegistrationId(123)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isNewRegistrationId(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isNewRegistrationId(undefined)).toBe(false);
  });

  it('returns false for "a123"', () => {
    expect(isNewRegistrationId("a123")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isNewRegistrationId("")).toBe(false);
  });
});

// ─── isAppointmentRegistrationId ─────────────────────────────

describe("isAppointmentRegistrationId", () => {
  it('returns true for "a123"', () => {
    expect(isAppointmentRegistrationId("a123")).toBe(true);
  });

  it('returns true for "a"', () => {
    expect(isAppointmentRegistrationId("a")).toBe(true);
  });

  it('returns false for "123"', () => {
    expect(isAppointmentRegistrationId("123")).toBe(false);
  });

  it('returns false for "p123"', () => {
    expect(isAppointmentRegistrationId("p123")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAppointmentRegistrationId(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAppointmentRegistrationId(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isAppointmentRegistrationId("")).toBe(false);
  });
});

// ─── isProvisionalRegistrationId ─────────────────────────────

describe("isProvisionalRegistrationId", () => {
  it('returns true for "p123"', () => {
    expect(isProvisionalRegistrationId("p123")).toBe(true);
  });

  it('returns true for "p"', () => {
    expect(isProvisionalRegistrationId("p")).toBe(true);
  });

  it('returns false for "a123"', () => {
    expect(isProvisionalRegistrationId("a123")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isProvisionalRegistrationId(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isProvisionalRegistrationId(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isProvisionalRegistrationId("")).toBe(false);
  });
});

// ─── isRegistrationMode ──────────────────────────────────────

describe("isRegistrationMode", () => {
  it('returns true for "new"', () => {
    expect(isRegistrationMode("new")).toBe(true);
  });

  it('returns true for "a123" (appointment)', () => {
    expect(isRegistrationMode("a123")).toBe(true);
  });

  it('returns true for "p456" (provisional)', () => {
    expect(isRegistrationMode("p456")).toBe(true);
  });

  it("returns true for null (falsy)", () => {
    expect(isRegistrationMode(null)).toBe(true);
  });

  it("returns true for undefined", () => {
    expect(isRegistrationMode(undefined)).toBe(true);
  });

  it('returns true for empty string ""', () => {
    expect(isRegistrationMode("")).toBe(true);
  });

  it('returns true for "0"', () => {
    expect(isRegistrationMode("0")).toBe(true);
  });

  it("returns true for numeric 0", () => {
    expect(isRegistrationMode(0)).toBe(true);
  });

  it("returns false for a valid numeric registration id", () => {
    expect(isRegistrationMode("12345")).toBe(false);
  });

  it("returns false for numeric 999", () => {
    expect(isRegistrationMode(999)).toBe(false);
  });
});

// ─── normalizeRegistrationId ─────────────────────────────────

describe("normalizeRegistrationId", () => {
  it('returns "new" for input "new"', () => {
    expect(normalizeRegistrationId("new")).toBe("new");
  });

  it("preserves appointment ids", () => {
    expect(normalizeRegistrationId("a42")).toBe("a42");
  });

  it("preserves provisional ids", () => {
    expect(normalizeRegistrationId("p99")).toBe("p99");
  });

  it("returns the numeric string as-is for valid ids", () => {
    expect(normalizeRegistrationId("12345")).toBe("12345");
  });

  it("handles number input", () => {
    expect(normalizeRegistrationId(12345)).toBe("12345");
  });

  it('returns "new" and warns for null', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeRegistrationId(null)).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns "new" and warns for undefined', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeRegistrationId(undefined)).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns "new" and warns for empty string', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeRegistrationId("")).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns "new" and warns for "0"', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeRegistrationId("0")).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns "new" and warns for numeric 0', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeRegistrationId(0)).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("trims whitespace before checking", () => {
    expect(normalizeRegistrationId(" a42 ")).toBe("a42");
  });
});

// ─── buildAppointmentRegistrationId ──────────────────────────

describe("buildAppointmentRegistrationId", () => {
  it("prefixes the id with 'a'", () => {
    expect(buildAppointmentRegistrationId("42")).toBe("a42");
  });

  it("handles numeric input", () => {
    expect(buildAppointmentRegistrationId(100)).toBe("a100");
  });

  it('returns "new" and warns for null', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(buildAppointmentRegistrationId(null)).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns "new" and warns for undefined', () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(buildAppointmentRegistrationId(undefined)).toBe("new");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ─── buildProvisionalRegistrationId ──────────────────────────

describe("buildProvisionalRegistrationId", () => {
  it("prefixes the id with 'p'", () => {
    expect(buildProvisionalRegistrationId("789")).toBe("p789");
  });

  it("handles numeric input", () => {
    expect(buildProvisionalRegistrationId(456)).toBe("p456");
  });

  it("generates a timestamp-based id for null", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const result = buildProvisionalRegistrationId(null);
    expect(result).toBe(`p${Date.now()}`);
    vi.useRealTimers();
  });

  it("generates a timestamp-based id for undefined", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const result = buildProvisionalRegistrationId(undefined);
    expect(result).toBe(`p${Date.now()}`);
    vi.useRealTimers();
  });
});

// ─── formatTimeHHMM ──────────────────────────────────────────

describe("formatTimeHHMM", () => {
  it("formats a Date object to HH:MM", () => {
    const d = new Date(2025, 2, 15, 9, 5, 0); // local time 09:05
    expect(formatTimeHHMM(d)).toBe("09:05");
  });

  it("formats a date string to HH:MM", () => {
    // Use a local-time-aware approach
    const d = new Date("2025-03-15T14:30:00");
    const expected = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    expect(formatTimeHHMM("2025-03-15T14:30:00")).toBe(expected);
  });

  it("returns empty string for null", () => {
    expect(formatTimeHHMM(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatTimeHHMM(undefined)).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatTimeHHMM("not-a-date")).toBe("");
  });

  it("pads single-digit hours and minutes", () => {
    const d = new Date(2025, 0, 1, 3, 7, 0); // 03:07
    expect(formatTimeHHMM(d)).toBe("03:07");
  });
});

// ─── isToday ─────────────────────────────────────────────────

describe("isToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for today's date", () => {
    expect(isToday("2025-06-15T08:30:00")).toBe(true);
  });

  it("returns true for today's date without time", () => {
    expect(isToday("2025-06-15")).toBe(true);
  });

  it("returns false for yesterday", () => {
    expect(isToday("2025-06-14T23:59:59")).toBe(false);
  });

  it("returns false for tomorrow", () => {
    expect(isToday("2025-06-16T00:00:00")).toBe(false);
  });

  it("returns false for a different year", () => {
    expect(isToday("2024-06-15T12:00:00")).toBe(false);
  });
});

// ─── checkIdYN ───────────────────────────────────────────────

describe("checkIdYN", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix current date to 2025-06-15
    vi.setSystemTime(new Date("2025-06-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 예외 for a minor (under 19) based on rrn", () => {
    // Born 2010-01-15 => age ~15 in 2025
    const result = checkIdYN(null, "100115-3123456", false);
    expect(result).toBe(본인확인여부.예외);
  });

  it("returns 완료 when identityVerifiedAt is within 6 months and identityOptional is false", () => {
    // Verified 2 months ago
    const result = checkIdYN("2025-04-15T00:00:00Z", "800101-1234567", false);
    expect(result).toBe(본인확인여부.완료);
  });

  it("returns 미완료 when identityVerifiedAt is older than 6 months", () => {
    // Verified 8 months ago
    const result = checkIdYN("2024-10-01T00:00:00Z", "800101-1234567", false);
    expect(result).toBe(본인확인여부.미완료);
  });

  it("returns 예외 when identityOptional is true and identityVerifiedAt exists", () => {
    const result = checkIdYN("2025-01-01T00:00:00Z", "800101-1234567", true);
    expect(result).toBe(본인확인여부.예외);
  });

  it("returns 미완료 when identityVerifiedAt is null and identityOptional is false", () => {
    const result = checkIdYN(null, "800101-1234567", false);
    expect(result).toBe(본인확인여부.미완료);
  });

  it("returns 미완료 when identityOptional is true but identityVerifiedAt is null", () => {
    const result = checkIdYN(null, "800101-1234567", true);
    expect(result).toBe(본인확인여부.미완료);
  });

  it("returns 미완료 when no rrn and no identityVerifiedAt", () => {
    const result = checkIdYN(null, null, false);
    expect(result).toBe(본인확인여부.미완료);
  });

  it("accepts a Date object for identityVerifiedAt", () => {
    const verifiedDate = new Date("2025-04-01T00:00:00Z");
    const result = checkIdYN(verifiedDate, "800101-1234567", false);
    expect(result).toBe(본인확인여부.완료);
  });

  it("defaults identityOptional to false when undefined", () => {
    const result = checkIdYN("2025-04-15T00:00:00Z", "800101-1234567");
    expect(result).toBe(본인확인여부.완료);
  });
});

// ─── showIdYN ────────────────────────────────────────────────

describe("showIdYN", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 예외 with correct style for a minor", () => {
    const result = showIdYN(null, "100115-3123456", false);
    expect(result.idYN).toBe(본인확인여부.예외);
    expect(result.style.backgroundColor).toBe("var(--bg-main)");
    expect(result.style.color).toBe("var(--border-2)");
    expect(result.style.borderColor).toBe("var(--border-2)");
  });

  it("returns 완료 with correct style when verified within 6 months", () => {
    const result = showIdYN("2025-04-15T00:00:00Z", "800101-1234567", false);
    expect(result.idYN).toBe(본인확인여부.완료);
    expect(result.style.backgroundColor).toBe("var(--bg-main)");
    expect(result.style.color).toBe("var(--positive)");
    expect(result.style.borderColor).toBe("var(--positive)");
  });

  it("returns 예외 with correct style when identityOptional is true", () => {
    const result = showIdYN("2025-01-01T00:00:00Z", "800101-1234567", true);
    expect(result.idYN).toBe(본인확인여부.예외);
    expect(result.style.color).toBe("var(--border-2)");
    expect(result.style.borderColor).toBe("var(--border-2)");
  });

  it("returns 미완료 with red style as fallback", () => {
    const result = showIdYN(null, null, false);
    expect(result.idYN).toBe(본인확인여부.미완료);
    expect(result.style.backgroundColor).toBe("var(--red-1)");
    expect(result.style.color).toBe("var(--red-2)");
    expect(result.style.borderColor).toBe("transparent");
  });

  it("returns 미완료 when verification is older than 6 months", () => {
    const result = showIdYN("2024-10-01T00:00:00Z", "800101-1234567", false);
    expect(result.idYN).toBe(본인확인여부.미완료);
    expect(result.style.backgroundColor).toBe("var(--red-1)");
  });

  it("defaults identityOptional to false when undefined", () => {
    const result = showIdYN("2025-04-15T00:00:00Z", "800101-1234567");
    expect(result.idYN).toBe(본인확인여부.완료);
  });
});
