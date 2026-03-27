import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAgeOrMonth,
  getGender,
  getRelationType,
  toKRW,
  formatPhoneNumber,
  isValidPhoneNumber,
  unformatPhoneNumber,
  unformatRrn,
  formatRrn,
  formatPhoneNumberRealtime,
  getBirthdayFromRrn,
  getIsBaby,
  makeRrnView,
  calculateAge,
  mapToPatient,
} from "../patient-utils";

vi.mock("@/constants/form-options", () => ({
  FAMILY_OPTIONS: [
    { value: 1, label: "부" },
    { value: 2, label: "모" },
    { value: 3, label: "배우자" },
  ],
}));

vi.mock("@/constants/common/common-enum", () => ({
  ConsentPrivacyType: { 미동의: 0 },
}));

const FIXED_NOW = new Date("2024-12-24T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. getAgeOrMonth
// ---------------------------------------------------------------------------
describe("getAgeOrMonth", () => {
  describe("empty / invalid input", () => {
    it("returns empty string for undefined", () => {
      expect(getAgeOrMonth(undefined)).toBe("");
    });

    it("returns empty string for null", () => {
      expect(getAgeOrMonth(null)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(getAgeOrMonth("")).toBe("");
    });

    it("returns empty string for invalid date string", () => {
      expect(getAgeOrMonth("not-a-date")).toBe("");
    });
  });

  describe("YYYYMMDD format", () => {
    it("calculates age for 8-digit birth string", () => {
      // born 1990-01-01 → 34세
      expect(getAgeOrMonth("19900101")).toBe("34세");
    });
  });

  describe("YYYY-MM-DD format", () => {
    it("calculates age for dash-separated birth string", () => {
      expect(getAgeOrMonth("1990-01-01")).toBe("34세");
    });
  });

  describe("ISO format", () => {
    it("parses ISO date string", () => {
      expect(getAgeOrMonth("1990-01-01T00:00:00.000Z")).toBe("34세");
    });
  });

  describe("< 1 month (days only)", () => {
    it("shows days in Korean", () => {
      // born 2024-12-10 → 14 days
      const result = getAgeOrMonth("20241210");
      expect(result).toMatch(/^\d+일$/);
    });

    it("shows days in English", () => {
      const result = getAgeOrMonth("20241210", "en");
      expect(result).toMatch(/^\d+d$/);
    });
  });

  describe("1-12 months (months + days)", () => {
    it("shows months and days in Korean", () => {
      // born 2024-06-24 → 6 months
      const result = getAgeOrMonth("20240624");
      expect(result).toMatch(/^\d+개월 \d+일$/);
    });

    it("shows months and days in English", () => {
      const result = getAgeOrMonth("20240624", "en");
      expect(result).toMatch(/^\d+m \d+d$/);
    });
  });

  describe("12-36 months (months only)", () => {
    it("shows months only in Korean", () => {
      // born 2023-06-24 → 18 months
      const result = getAgeOrMonth("20230624");
      expect(result).toMatch(/^\d+개월$/);
    });

    it("shows months only in English", () => {
      const result = getAgeOrMonth("20230624", "en");
      expect(result).toMatch(/^\d+m$/);
    });
  });

  describe("36 months - 8 years (years + months)", () => {
    it("shows years and months in Korean", () => {
      // born 2020-03-01 → ~4y 9m
      const result = getAgeOrMonth("20200301");
      expect(result).toMatch(/^\d+세 \d+개월$/);
    });

    it("shows years and months in English", () => {
      const result = getAgeOrMonth("20200301", "en");
      expect(result).toMatch(/^\d+y \d+m$/);
    });
  });

  describe("8+ years (age only)", () => {
    it("shows age in Korean", () => {
      expect(getAgeOrMonth("19900515")).toBe("34세");
    });

    it("shows age in English", () => {
      expect(getAgeOrMonth("19900515", "en")).toBe("34");
    });

    it("shows age for exactly 8 years old", () => {
      // born 2016-12-24 → exactly 8
      expect(getAgeOrMonth("20161224")).toBe("8세");
    });
  });
});

// ---------------------------------------------------------------------------
// 2. getGender
// ---------------------------------------------------------------------------
describe("getGender", () => {
  it('returns "남" for 1 in Korean', () => {
    expect(getGender(1)).toBe("남");
  });

  it('returns "M" for 1 in English', () => {
    expect(getGender(1, "en")).toBe("M");
  });

  it('returns "여" for 2 in Korean', () => {
    expect(getGender(2)).toBe("여");
  });

  it('returns "F" for 2 in English', () => {
    expect(getGender(2, "en")).toBe("F");
  });

  it("returns empty string for undefined", () => {
    expect(getGender(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(getGender(null)).toBe("");
  });

  it("returns empty string for other numbers", () => {
    expect(getGender(0)).toBe("");
    expect(getGender(3)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 3. getRelationType
// ---------------------------------------------------------------------------
describe("getRelationType", () => {
  it("returns label for known relation type", () => {
    expect(getRelationType(1)).toBe("부");
    expect(getRelationType(2)).toBe("모");
    expect(getRelationType(3)).toBe("배우자");
  });

  it("returns empty string for unknown relation type", () => {
    expect(getRelationType(999)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 4. toKRW
// ---------------------------------------------------------------------------
describe("toKRW", () => {
  it("formats number with unit", () => {
    expect(toKRW(1000)).toBe("1,000원");
  });

  it("formats number without unit", () => {
    expect(toKRW(1000, false)).toBe("1,000");
  });

  it("formats string number", () => {
    expect(toKRW("2500")).toBe("2,500원");
  });

  it("returns empty string for null", () => {
    expect(toKRW(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(toKRW(undefined)).toBe("");
  });

  it("returns empty string for non-numeric string", () => {
    expect(toKRW("abc")).toBe("");
  });

  it("formats zero", () => {
    expect(toKRW(0)).toBe("0원");
  });

  it("formats negative number", () => {
    expect(toKRW(-500)).toBe("-500원");
  });
});

// ---------------------------------------------------------------------------
// 5. formatPhoneNumber
// ---------------------------------------------------------------------------
describe("formatPhoneNumber", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhoneNumber("")).toBe("");
  });

  describe("10-digit numbers", () => {
    it("formats Seoul number (02)", () => {
      expect(formatPhoneNumber("0212345678")).toBe("02-1234-5678");
    });

    it("formats regional number", () => {
      expect(formatPhoneNumber("0312345678")).toBe("031-234-5678");
    });
  });

  describe("11-digit numbers", () => {
    it("formats Seoul number (02) 11 digits", () => {
      expect(formatPhoneNumber("02123456789")).toBe("02-1234-56789");
    });

    it("formats mobile number (010)", () => {
      expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
    });

    it("formats regional 11-digit number", () => {
      expect(formatPhoneNumber("03112345678")).toBe("031-123-45678");
    });
  });

  it("returns original for other lengths", () => {
    expect(formatPhoneNumber("123")).toBe("123");
  });
});

// ---------------------------------------------------------------------------
// 6. isValidPhoneNumber
// ---------------------------------------------------------------------------
describe("isValidPhoneNumber", () => {
  it("returns false for empty string", () => {
    expect(isValidPhoneNumber("")).toBe(false);
  });

  it("returns false for wrong length", () => {
    expect(isValidPhoneNumber("123")).toBe(false);
  });

  describe("10-digit", () => {
    it("accepts Seoul 02 number", () => {
      expect(isValidPhoneNumber("0212345678")).toBe(true);
    });

    it("accepts regional 03x number", () => {
      expect(isValidPhoneNumber("0312345678")).toBe(true);
    });

    it("rejects invalid prefix", () => {
      expect(isValidPhoneNumber("0712345678")).toBe(false);
    });
  });

  describe("11-digit", () => {
    it("accepts Seoul 02 number", () => {
      expect(isValidPhoneNumber("02123456789")).toBe(true);
    });

    it("accepts mobile 010", () => {
      expect(isValidPhoneNumber("01012345678")).toBe(true);
    });

    it("accepts regional 04x number", () => {
      expect(isValidPhoneNumber("04112345678")).toBe(true);
    });

    it("rejects invalid prefix", () => {
      expect(isValidPhoneNumber("07112345678")).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 7. unformatPhoneNumber
// ---------------------------------------------------------------------------
describe("unformatPhoneNumber", () => {
  it("removes dashes from formatted number", () => {
    expect(unformatPhoneNumber("010-1234-5678")).toBe("01012345678");
  });

  it("returns empty string for empty input", () => {
    expect(unformatPhoneNumber("")).toBe("");
  });

  it("strips all non-digit characters", () => {
    expect(unformatPhoneNumber("(02) 1234-5678")).toBe("0212345678");
  });
});

// ---------------------------------------------------------------------------
// 8. unformatRrn
// ---------------------------------------------------------------------------
describe("unformatRrn", () => {
  it("removes hyphens from RRN", () => {
    expect(unformatRrn("920101-1234567")).toBe("9201011234567");
  });

  it("returns empty string for empty input", () => {
    expect(unformatRrn("")).toBe("");
  });

  it("returns same string if no hyphens", () => {
    expect(unformatRrn("9201011234567")).toBe("9201011234567");
  });
});

// ---------------------------------------------------------------------------
// 9. formatRrn
// ---------------------------------------------------------------------------
describe("formatRrn", () => {
  it("returns empty string for empty input", () => {
    expect(formatRrn("")).toBe("");
  });

  it("formats 13-digit RRN with hyphen", () => {
    expect(formatRrn("9201011234567")).toBe("920101-1234567");
  });

  it("formats 7-digit partial RRN", () => {
    expect(formatRrn("9201011")).toBe("920101-1");
  });

  it("adds trailing hyphen for exactly 6 digits", () => {
    expect(formatRrn("920101")).toBe("920101-");
  });

  it("returns digits as-is if fewer than 6", () => {
    expect(formatRrn("9201")).toBe("9201");
  });

  it("handles already-hyphenated input", () => {
    expect(formatRrn("920101-1234567")).toBe("920101-1234567");
  });
});

// ---------------------------------------------------------------------------
// 10. formatPhoneNumberRealtime
// ---------------------------------------------------------------------------
describe("formatPhoneNumberRealtime", () => {
  it("formats 010 mobile number progressively", () => {
    expect(formatPhoneNumberRealtime("01012345678")).toBe("010-1234-5678");
  });

  it("formats partial 010 number", () => {
    expect(formatPhoneNumberRealtime("01012")).toBe("010-12");
  });

  it("formats Seoul 02 area code", () => {
    expect(formatPhoneNumberRealtime("0212345678")).toBe("02-1234-5678");
  });

  it("formats 031 area code", () => {
    expect(formatPhoneNumberRealtime("03112345678")).toBe("031-1234-5678");
  });

  it("truncates 010 number to 11 digits", () => {
    expect(formatPhoneNumberRealtime("010123456789")).toBe("010-1234-5678");
  });

  it("returns raw digits for short non-matching input", () => {
    expect(formatPhoneNumberRealtime("12")).toBe("12");
  });

  it("strips non-numeric non-dash characters", () => {
    expect(formatPhoneNumberRealtime("010-abcd-1234")).toBe("010-1234");
  });
});

// ---------------------------------------------------------------------------
// 11. getBirthdayFromRrn
// ---------------------------------------------------------------------------
describe("getBirthdayFromRrn", () => {
  it("returns Date(0) for empty string", () => {
    expect(getBirthdayFromRrn("").getTime()).toBe(new Date(0).getTime());
  });

  it("returns Date(0) for wrong length", () => {
    expect(getBirthdayFromRrn("123").getTime()).toBe(new Date(0).getTime());
  });

  it("parses birth date with hyphenated format (index 6 is hyphen, falls to 2000s)", () => {
    // Note: getBirthdayFromRrn reads gender from index 6, which is '-' in
    // hyphenated format. '-' does not match 1/2/5/6, so it falls to 2000s branch.
    const d = getBirthdayFromRrn("920101-1234567");
    expect(d.getFullYear()).toBe(2092);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("parses 1900s birth date with unhyphenated 14-char input (gender code 1)", () => {
    // "92010112345670" — index 6 = '1' → 1900s
    const d = getBirthdayFromRrn("92010112345670");
    expect(d.getFullYear()).toBe(1992);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("parses 1900s birth date (gender code 2, unhyphenated)", () => {
    const d = getBirthdayFromRrn("92010122345670");
    expect(d.getFullYear()).toBe(1992);
  });

  it("parses 1900s birth date (gender code 5, unhyphenated)", () => {
    const d = getBirthdayFromRrn("92010152345670");
    expect(d.getFullYear()).toBe(1992);
  });

  it("parses 1900s birth date (gender code 6, unhyphenated)", () => {
    const d = getBirthdayFromRrn("92010162345670");
    expect(d.getFullYear()).toBe(1992);
  });

  it("parses 2000s birth date (gender code 3, unhyphenated)", () => {
    const d = getBirthdayFromRrn("05051532345670");
    expect(d.getFullYear()).toBe(2005);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(15);
  });

  it("parses 2000s birth date (gender code 4, unhyphenated)", () => {
    const d = getBirthdayFromRrn("05051542345670");
    expect(d.getFullYear()).toBe(2005);
  });

  it("parses 2000s birth date (gender code 7, unhyphenated)", () => {
    const d = getBirthdayFromRrn("05051572345670");
    expect(d.getFullYear()).toBe(2005);
  });

  it("parses 2000s birth date (gender code 8, unhyphenated)", () => {
    const d = getBirthdayFromRrn("05051582345670");
    expect(d.getFullYear()).toBe(2005);
  });
});

// ---------------------------------------------------------------------------
// 12. getIsBaby
// ---------------------------------------------------------------------------
describe("getIsBaby", () => {
  it("returns false for null", () => {
    expect(getIsBaby(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(getIsBaby(undefined)).toBe(false);
  });

  it("returns false for wrong length", () => {
    expect(getIsBaby("123")).toBe(false);
  });

  it("returns false for adult RRN", () => {
    expect(getIsBaby("920101-1234567")).toBe(false);
  });

  it("returns false if birth > 30 days ago", () => {
    // Born 2024-11-01 → more than 30 days before 2024-12-24
    expect(getIsBaby("241101-3000000")).toBe(false);
  });

  it("returns true for valid baby RRN (male, no twin)", () => {
    // Born 2024-12-10 → 14 days, gender 3, 00000, twin code 0
    expect(getIsBaby("241210-3000000")).toBe(true);
  });

  it("returns true for valid baby RRN (female)", () => {
    expect(getIsBaby("241210-4000000")).toBe(true);
  });

  it("returns true for valid baby RRN (foreign male)", () => {
    expect(getIsBaby("241210-7000000")).toBe(true);
  });

  it("returns true for valid baby RRN (foreign female)", () => {
    expect(getIsBaby("241210-8000000")).toBe(true);
  });

  it("returns false for twin code 1 (00000 check at indices 9-13 fails)", () => {
    // safeSubstring(rrn, 9, 5) = "00001" !== "00000"
    expect(getIsBaby("241210-3000001")).toBe(false);
  });

  it("returns false for twin code 2 (00000 check at indices 9-13 fails)", () => {
    // safeSubstring(rrn, 9, 5) = "00002" !== "00000"
    expect(getIsBaby("241210-3000002")).toBe(false);
  });

  it("returns false for invalid twin code (3)", () => {
    expect(getIsBaby("241210-3000003")).toBe(false);
  });

  it("returns false for non-baby gender code (1)", () => {
    expect(getIsBaby("241210-1000000")).toBe(false);
  });

  it("returns false if 00000 pattern not present", () => {
    expect(getIsBaby("241210-3123450")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 13. makeRrnView
// ---------------------------------------------------------------------------
describe("makeRrnView", () => {
  it("returns empty string for empty input", () => {
    expect(makeRrnView("")).toBe("");
  });

  it("returns empty string for short input (< 7 chars)", () => {
    expect(makeRrnView("92010")).toBe("");
  });

  it("masks RRN with 7-char input", () => {
    expect(makeRrnView("9201011")).toBe("920101-1******");
  });

  it("masks RRN with longer input", () => {
    expect(makeRrnView("92010121234")).toBe("920101-2******");
  });
});

// ---------------------------------------------------------------------------
// 14. calculateAge
// ---------------------------------------------------------------------------
describe("calculateAge", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("YYYY-MM-DD format", () => {
    it("calculates correct age", () => {
      expect(calculateAge("1990-05-15")).toBe(34);
    });

    it("subtracts 1 if birthday has not passed", () => {
      expect(calculateAge("1990-12-25")).toBe(33);
    });

    it("exact birthday returns correct age", () => {
      expect(calculateAge("1990-12-24")).toBe(34);
    });

    it("handles ISO format", () => {
      expect(calculateAge("1990-05-15T00:00:00.000Z")).toBe(34);
    });
  });

  describe("YYYYMMDD format", () => {
    it("calculates age from 8-digit string", () => {
      expect(calculateAge("19900515")).toBe(34);
    });

    it("handles very old birth date", () => {
      expect(calculateAge("19230901")).toBe(101);
    });

    it("subtracts 1 if birthday has not passed", () => {
      expect(calculateAge("19901225")).toBe(33);
    });
  });

  describe("edge cases", () => {
    it("returns undefined for empty string", () => {
      expect(calculateAge("")).toBe(undefined);
    });

    it("returns undefined for invalid date", () => {
      expect(calculateAge("invalid-date")).toBe(undefined);
    });

    it("returns undefined for out-of-range date", () => {
      expect(calculateAge("1990-13-40")).toBe(undefined);
    });
  });
});

// ---------------------------------------------------------------------------
// 15. mapToPatient
// ---------------------------------------------------------------------------
describe("mapToPatient", () => {
  it("maps full patient data", () => {
    const data = {
      id: 1,
      patientNo: 100,
      uuid: "abc-123",
      name: "홍길동",
      gender: 1,
      phone1: "01012345678",
      birthDate: "19900101",
      isActive: true,
    };
    const patient = mapToPatient(data);
    expect(patient.id).toBe(1);
    expect(patient.patientNo).toBe(100);
    expect(patient.uuid).toBe("abc-123");
    expect(patient.name).toBe("홍길동");
    expect(patient.gender).toBe(1);
    expect(patient.phone1).toBe("01012345678");
    expect(patient.birthDate).toBe("19900101");
    expect(patient.isActive).toBe(true);
  });

  it("returns defaults for empty object", () => {
    const patient = mapToPatient({});
    expect(patient.id).toBe(0);
    expect(patient.patientNo).toBe(0);
    expect(patient.uuid).toBe("");
    expect(patient.name).toBe("");
    expect(patient.gender).toBe(0);
    expect(patient.phone1).toBe("");
    expect(patient.phone2).toBe("");
    expect(patient.birthDate).toBe("");
    expect(patient.address1).toBe("");
    expect(patient.address2).toBe("");
    expect(patient.zipcode).toBe("");
    expect(patient.rrn).toBe("");
    expect(patient.rrnView).toBe("");
    expect(patient.rrnHash).toBe(null);
    expect(patient.loginId).toBe(null);
    expect(patient.password).toBe(null);
    expect(patient.isActive).toBe(true);
    expect(patient.isTemporary).toBe(false);
    expect(patient.createId).toBe(0);
    expect(patient.createDateTime).toBe("");
    expect(patient.updateId).toBe(null);
    expect(patient.updateDateTime).toBe(null);
    expect(patient.identityVerifiedAt).toBe(null);
    expect(patient.idNumber).toBe(null);
    expect(patient.idType).toBe(null);
    expect(patient.lastEncounterDate).toBe(null);
    expect(patient.vitalSignMeasurements).toEqual([]);
    expect(patient.fatherRrn).toBe("");
    expect(patient.groupId).toBe(null);
    expect(patient.memo).toBe("");
    expect(patient.hospitalId).toBe(0);
    expect(patient.patientType).toBe(null);
    expect(patient.nextAppointmentDateTime).toBe(null);
  });

  it("returns defaults for null/undefined input", () => {
    const patient = mapToPatient(null);
    expect(patient.id).toBe(0);
    expect(patient.name).toBe("");
    expect(patient.isActive).toBe(true);
  });

  it("sets chronicDisease defaults", () => {
    const patient = mapToPatient({});
    expect(patient.chronicDisease).toEqual({
      diabetes: false,
      hypertension: false,
      highCholesterol: false,
    });
  });

  it("sets consent defaults with ConsentPrivacyType.미동의", () => {
    const patient = mapToPatient({});
    expect(patient.consent).toEqual({
      privacy: 0,
      message: false,
      marketing: false,
    });
  });

  it("preserves provided chronicDisease", () => {
    const data = {
      chronicDisease: { diabetes: true, hypertension: true, highCholesterol: false },
    };
    const patient = mapToPatient(data);
    expect(patient.chronicDisease.diabetes).toBe(true);
    expect(patient.chronicDisease.hypertension).toBe(true);
  });
});
