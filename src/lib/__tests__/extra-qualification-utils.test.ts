import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  EXTRA_QUALIFICATION_FLAG_KEYS,
  getAdditionalExtraQualificationFlag,
  is임신부,
  is난임치료,
  getCurrentYyyyMmDdHyphen,
  formatDateToYyyyMmDdHyphen,
  mergeAdditionalExtraQualificationFlag,
  merge임신부ExtraQualificationFlag,
  get임신부WeekAndDay,
  get임신부WeekNum,
  get임신부UpsertDate,
  is산정특례,
  is산정특례희귀질환등록대상자,
  is산정특례극희귀등록대상자,
  is산정특례상세불명희귀등록대상자,
  is산정특례중증난치질환등록대상자,
  is산정특례기타염색체이상질환등록대상자,
  is중증,
  is중증암,
  is산정특례암등록대상자1,
  is산정특례화상등록대상자,
  is산정특례중복암등록대상자2,
  is산정특례중복암등록대상자3,
  is산정특례중복암등록대상자4,
  is산정특례중복암등록대상자5,
  is출국자,
  is급여제한,
  is당뇨병요양비대상자유형,
  is요양병원입원여부,
  is본인부담차등,
  is조산아및저체중아,
  is결핵,
  is산정특례결핵등록대상자,
  is요양기관별산정특례결핵등록대상자,
  is중증치매,
  is자립준비청년,
  is비대면,
  clear임신부IfOverLimit,
} from "../extra-qualification-utils";

// ---------------------------------------------------------------------------
// Helper: build a disease registration record that isDiseaseRegistrationActive
// will recognise as active for a given encounter date.
// ---------------------------------------------------------------------------
function makeDiseaseRegistration(
  key: string,
  overrides: Record<string, any> = {}
) {
  return {
    [key]: {
      특정기호: "V123",
      등록번호: "REG-001",
      등록일: "20240101",
      종료일: "20241231",
      ...overrides,
    },
  };
}

// Encounter date inside the default range above
const ENCOUNTER_IN_RANGE = new Date(2024, 5, 15); // 2024-06-15
// Encounter date outside
const ENCOUNTER_OUT_OF_RANGE = new Date(2025, 5, 15); // 2025-06-15

// ---------------------------------------------------------------------------
// EXTRA_QUALIFICATION_FLAG_KEYS
// ---------------------------------------------------------------------------
describe("EXTRA_QUALIFICATION_FLAG_KEYS", () => {
  it("should expose PREGNANT and INFERTILITY_TREATMENT constants", () => {
    expect(EXTRA_QUALIFICATION_FLAG_KEYS.PREGNANT).toBe("임신부");
    expect(EXTRA_QUALIFICATION_FLAG_KEYS.INFERTILITY_TREATMENT).toBe("난임치료");
  });
});

// ---------------------------------------------------------------------------
// getAdditionalExtraQualificationFlag
// ---------------------------------------------------------------------------
describe("getAdditionalExtraQualificationFlag", () => {
  it("returns fallbackValue when extraQualification is undefined", () => {
    expect(getAdditionalExtraQualificationFlag(undefined, "임신부")).toBe(false);
    expect(getAdditionalExtraQualificationFlag(undefined, "임신부", true)).toBe(true);
  });

  it("returns fallbackValue when key is missing", () => {
    expect(getAdditionalExtraQualificationFlag({}, "임신부")).toBe(false);
    expect(getAdditionalExtraQualificationFlag({}, "임신부", true)).toBe(true);
  });

  it("returns fallbackValue when field is not an object", () => {
    expect(getAdditionalExtraQualificationFlag({ 임신부: "Y" }, "임신부")).toBe(false);
    expect(getAdditionalExtraQualificationFlag({ 임신부: 42 }, "임신부")).toBe(false);
  });

  it("returns fallbackValue when field has no 'data' property", () => {
    expect(getAdditionalExtraQualificationFlag({ 임신부: { other: "Y" } }, "임신부")).toBe(false);
  });

  it("returns false for falsy data values", () => {
    expect(getAdditionalExtraQualificationFlag({ 임신부: { data: "" } }, "임신부")).toBe(false);
    expect(getAdditionalExtraQualificationFlag({ 임신부: { data: null } }, "임신부")).toBe(false);
    expect(getAdditionalExtraQualificationFlag({ 임신부: { data: undefined } }, "임신부")).toBe(false);
  });

  it("returns false for BOOLEAN_FALSE_VALUES", () => {
    for (const falsy of ["N", "0", "FALSE", "F", "NO"]) {
      expect(getAdditionalExtraQualificationFlag({ k: { data: falsy } }, "k")).toBe(false);
    }
    // case-insensitive
    expect(getAdditionalExtraQualificationFlag({ k: { data: "n" } }, "k")).toBe(false);
    expect(getAdditionalExtraQualificationFlag({ k: { data: "  no  " } }, "k")).toBe(false);
  });

  it("returns true for truthy data values", () => {
    expect(getAdditionalExtraQualificationFlag({ k: { data: "Y" } }, "k")).toBe(true);
    expect(getAdditionalExtraQualificationFlag({ k: { data: "1" } }, "k")).toBe(true);
    expect(getAdditionalExtraQualificationFlag({ k: { data: "YES" } }, "k")).toBe(true);
    expect(getAdditionalExtraQualificationFlag({ k: { data: "TRUE" } }, "k")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// is임신부 / is난임치료  (thin wrappers)
// ---------------------------------------------------------------------------
describe("is임신부", () => {
  it("returns true when pregnant flag is Y", () => {
    expect(is임신부({ 임신부: { data: "Y" } })).toBe(true);
  });

  it("returns false when pregnant flag is N", () => {
    expect(is임신부({ 임신부: { data: "N" } })).toBe(false);
  });

  it("returns fallbackValue when undefined", () => {
    expect(is임신부(undefined)).toBe(false);
    expect(is임신부(undefined, true)).toBe(true);
  });
});

describe("is난임치료", () => {
  it("returns true when infertility flag is Y", () => {
    expect(is난임치료({ 난임치료: { data: "Y" } })).toBe(true);
  });

  it("returns false when infertility flag is N", () => {
    expect(is난임치료({ 난임치료: { data: "N" } })).toBe(false);
  });

  it("returns fallbackValue when undefined", () => {
    expect(is난임치료(undefined)).toBe(false);
    expect(is난임치료(undefined, true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCurrentYyyyMmDdHyphen
// ---------------------------------------------------------------------------
describe("getCurrentYyyyMmDdHyphen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns today's date in YYYY-MM-DD format", () => {
    vi.setSystemTime(new Date(2024, 0, 5)); // 2024-01-05
    expect(getCurrentYyyyMmDdHyphen()).toBe("2024-01-05");
  });

  it("pads month and day with leading zeros", () => {
    vi.setSystemTime(new Date(2023, 2, 9)); // March 9
    expect(getCurrentYyyyMmDdHyphen()).toBe("2023-03-09");
  });
});

// ---------------------------------------------------------------------------
// formatDateToYyyyMmDdHyphen
// ---------------------------------------------------------------------------
describe("formatDateToYyyyMmDdHyphen", () => {
  it("formats a date object correctly", () => {
    expect(formatDateToYyyyMmDdHyphen(new Date(2024, 11, 25))).toBe("2024-12-25");
  });

  it("pads single-digit month and day", () => {
    expect(formatDateToYyyyMmDdHyphen(new Date(2024, 0, 1))).toBe("2024-01-01");
  });
});

// ---------------------------------------------------------------------------
// mergeAdditionalExtraQualificationFlag
// ---------------------------------------------------------------------------
describe("mergeAdditionalExtraQualificationFlag", () => {
  it("merges checked=true as { data: 'Y' }", () => {
    const result = mergeAdditionalExtraQualificationFlag(undefined, "myKey", true);
    expect(result).toEqual({ myKey: { data: "Y" } });
  });

  it("merges checked=false as { data: 'N' }", () => {
    const result = mergeAdditionalExtraQualificationFlag({ existing: 1 }, "myKey", false);
    expect(result).toEqual({ existing: 1, myKey: { data: "N" } });
  });

  it("does not mutate the original object", () => {
    const original = { a: 1 };
    const result = mergeAdditionalExtraQualificationFlag(original, "b", true);
    expect(original).toEqual({ a: 1 });
    expect(result).toEqual({ a: 1, b: { data: "Y" } });
  });

  it("handles undefined extraQualification", () => {
    const result = mergeAdditionalExtraQualificationFlag(undefined, "x", true);
    expect(result).toEqual({ x: { data: "Y" } });
  });
});

// ---------------------------------------------------------------------------
// merge임신부ExtraQualificationFlag
// ---------------------------------------------------------------------------
describe("merge임신부ExtraQualificationFlag", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // 2024-06-15
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("unchecked sets data=N and upsertDate=empty", () => {
    const result = merge임신부ExtraQualificationFlag({ other: 1 }, false);
    expect(result.임신부).toEqual({ data: "N", upsertDate: "" });
    expect(result.other).toBe(1);
  });

  it("checked sets data=Y with current date when no options", () => {
    const result = merge임신부ExtraQualificationFlag(undefined, true);
    expect(result.임신부).toEqual({
      data: "Y",
      upsertDate: "2024-06-15",
      week: 0,
      day: 0,
    });
  });

  it("checked with explicit options", () => {
    const result = merge임신부ExtraQualificationFlag(undefined, true, {
      upsertDate: "2024-03-01",
      week: 12,
      day: 3,
    });
    expect(result.임신부).toEqual({
      data: "Y",
      upsertDate: "2024-03-01",
      week: 12,
      day: 3,
    });
  });

  it("clamps week to max 43", () => {
    const result = merge임신부ExtraQualificationFlag(undefined, true, { week: 50 });
    expect(result.임신부.week).toBe(43);
  });

  it("clamps week to min 0", () => {
    const result = merge임신부ExtraQualificationFlag(undefined, true, { week: -5 });
    expect(result.임신부.week).toBe(0);
  });

  it("clamps day to max 31", () => {
    const result = merge임신부ExtraQualificationFlag(undefined, true, { day: 100 });
    expect(result.임신부.day).toBe(31);
  });

  it("clamps day to min 0", () => {
    const result = merge임신부ExtraQualificationFlag(undefined, true, { day: -3 });
    expect(result.임신부.day).toBe(0);
  });

  it("does not mutate original object", () => {
    const orig = { foo: "bar" };
    merge임신부ExtraQualificationFlag(orig, true);
    expect(orig).toEqual({ foo: "bar" });
  });
});

// ---------------------------------------------------------------------------
// get임신부WeekAndDay
// ---------------------------------------------------------------------------
describe("get임신부WeekAndDay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // 2024-06-15
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when extraQualification is undefined", () => {
    expect(get임신부WeekAndDay(undefined)).toBeNull();
  });

  it("returns null when pregnant field is missing", () => {
    expect(get임신부WeekAndDay({})).toBeNull();
  });

  it("returns null when pregnant field is not an object", () => {
    expect(get임신부WeekAndDay({ 임신부: "Y" })).toBeNull();
  });

  it("returns null when data is N (boolean false)", () => {
    expect(get임신부WeekAndDay({ 임신부: { data: "N", upsertDate: "2024-06-01", week: 10, day: 0 } })).toBeNull();
  });

  it("returns null when data is empty", () => {
    expect(get임신부WeekAndDay({ 임신부: { data: "", upsertDate: "2024-06-01" } })).toBeNull();
  });

  it("returns null when upsertDate is missing", () => {
    expect(get임신부WeekAndDay({ 임신부: { data: "Y" } })).toBeNull();
  });

  it("returns null when upsertDate is empty string", () => {
    expect(get임신부WeekAndDay({ 임신부: { data: "Y", upsertDate: "" } })).toBeNull();
  });

  it("returns null when upsertDate is unparseable", () => {
    expect(get임신부WeekAndDay({ 임신부: { data: "Y", upsertDate: "not-a-date" } })).toBeNull();
  });

  it("calculates week and day from upsertDate + stored week/day", () => {
    // upsertDate = 2024-06-01, stored week=10, day=0
    // LMP = 2024-06-01 - 70 days = 2024-03-23
    // selectedDate (now) = 2024-06-15
    // diffDays from upsertDate to now = 14
    // totalDays = 70 + 14 = 84 = 12 weeks, 0 days
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-01", week: 10, day: 0 },
    };
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 12, day: 0 });
  });

  it("accepts YYYYMMDD format upsertDate", () => {
    const eq = {
      임신부: { data: "Y", upsertDate: "20240601", week: 10, day: 0 },
    };
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 12, day: 0 });
  });

  it("uses selectedDate parameter instead of 'now'", () => {
    // upsertDate=2024-06-01, week=10, day=0 → totalAtUpsert=70
    // selectedDate=2024-06-08 → diff=7 → total=77 → 11w0d
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-01", week: 10, day: 0 },
    };
    const result = get임신부WeekAndDay(eq, new Date(2024, 5, 8));
    expect(result).toEqual({ week: 11, day: 0 });
  });

  it("accepts string selectedDate", () => {
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-01", week: 10, day: 0 },
    };
    const result = get임신부WeekAndDay(eq, "2024-06-08");
    expect(result).toEqual({ week: 11, day: 0 });
  });

  it("returns { week: 0, day: 0 } when totalDays is negative", () => {
    // upsertDate far in the future, stored week=0
    const eq = {
      임신부: { data: "Y", upsertDate: "2025-01-01", week: 0, day: 0 },
    };
    // now = 2024-06-15, diff is negative
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 0, day: 0 });
  });

  it("returns overLimit when storedWeek > 43", () => {
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-01", week: 44, day: 0 },
    };
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 43, day: 6, overLimit: true });
  });

  it("returns overLimit when totalDays exceeds PREGNANCY_MAX_TOTAL_DAYS", () => {
    // PREGNANCY_MAX_TOTAL_DAYS = 43*7+6 = 307
    // upsertDate = 2023-01-01, week=40, day=0 → totalAtUpsert=280
    // now = 2024-06-15 → diff = 531 days → total = 811 >> 307
    const eq = {
      임신부: { data: "Y", upsertDate: "2023-01-01", week: 40, day: 0 },
    };
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 43, day: 6, overLimit: true });
  });

  it("handles missing week/day gracefully (defaults to 0)", () => {
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-15" },
    };
    // totalAtUpsert = 0, diff = 0 (same day), total = 0
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 0, day: 0 });
  });

  it("handles StringDataField format for data", () => {
    // data can be a { data: "Y" } nested structure - getStringFromMaybeStringDataField handles it
    const eq = {
      임신부: { data: { data: "Y" }, upsertDate: "2024-06-15", week: 5, day: 3 },
    };
    const result = get임신부WeekAndDay(eq);
    expect(result).toEqual({ week: 5, day: 3 });
  });
});

// ---------------------------------------------------------------------------
// get임신부WeekNum
// ---------------------------------------------------------------------------
describe("get임신부WeekNum", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns week number when data exists", () => {
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-01", week: 10, day: 0 },
    };
    expect(get임신부WeekNum(eq)).toBe(12);
  });

  it("returns 0 when no pregnancy data", () => {
    expect(get임신부WeekNum(undefined)).toBe(0);
    expect(get임신부WeekNum({})).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// get임신부UpsertDate
// ---------------------------------------------------------------------------
describe("get임신부UpsertDate", () => {
  it("returns upsertDate string when present and data is truthy", () => {
    const eq = { 임신부: { data: "Y", upsertDate: "2024-06-01" } };
    expect(get임신부UpsertDate(eq)).toBe("2024-06-01");
  });

  it("returns empty string when data is N", () => {
    const eq = { 임신부: { data: "N", upsertDate: "2024-06-01" } };
    expect(get임신부UpsertDate(eq)).toBe("");
  });

  it("returns empty string when extraQualification is undefined", () => {
    expect(get임신부UpsertDate(undefined)).toBe("");
  });

  it("returns empty string when field is not an object", () => {
    expect(get임신부UpsertDate({ 임신부: "Y" })).toBe("");
  });

  it("returns empty string when upsertDate is missing", () => {
    expect(get임신부UpsertDate({ 임신부: { data: "Y" } })).toBe("");
  });

  it("trims whitespace from upsertDate", () => {
    const eq = { 임신부: { data: "Y", upsertDate: "  2024-06-01  " } };
    expect(get임신부UpsertDate(eq)).toBe("2024-06-01");
  });

  it("handles upsertDate as StringDataField object", () => {
    const eq = { 임신부: { data: "Y", upsertDate: { data: "2024-06-01" } } };
    expect(get임신부UpsertDate(eq)).toBe("2024-06-01");
  });
});

// ---------------------------------------------------------------------------
// isDiseaseRegistrationActive (tested via exported wrappers)
// ---------------------------------------------------------------------------
describe("isDiseaseRegistrationActive (via is산정특례희귀질환등록대상자)", () => {
  const KEY = "산정특례희귀질환등록대상자";

  it("returns false for undefined extraQualification", () => {
    expect(is산정특례희귀질환등록대상자(undefined, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false when key is missing", () => {
    expect(is산정특례희귀질환등록대상자({}, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false when field is not an object", () => {
    expect(is산정특례희귀질환등록대상자({ [KEY]: "value" }, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(is산정특례희귀질환등록대상자({ [KEY]: {} }, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false when 특정기호 is missing", () => {
    const eq = { [KEY]: { 등록번호: "R1", 등록일: "20240101", 종료일: "20241231" } };
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false when 등록번호 is missing", () => {
    const eq = { [KEY]: { 특정기호: "V1", 등록일: "20240101", 종료일: "20241231" } };
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false when 등록일 (startYmd) is missing", () => {
    const eq = { [KEY]: { 특정기호: "V1", 등록번호: "R1", 종료일: "20241231" } };
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns true when encounter is within date range", () => {
    const eq = makeDiseaseRegistration(KEY);
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns false when encounter is outside date range", () => {
    const eq = makeDiseaseRegistration(KEY);
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_OUT_OF_RANGE)).toBe(false);
  });

  it("defaults end date to 99991231 when 종료일 is absent", () => {
    const eq = makeDiseaseRegistration(KEY, { 종료일: undefined });
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(true);
    expect(is산정특례희귀질환등록대상자(eq, new Date(9998, 11, 31))).toBe(true);
  });

  it("supports StringDataField format (nested { data: '...' })", () => {
    const eq = {
      [KEY]: {
        특정기호: { data: "V123" },
        등록번호: { data: "REG-001" },
        등록일: { data: "20240101" },
        종료일: { data: "20241231" },
      },
    };
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("supports alternative field names (specificCode, registeredCode, approvedDate, validity)", () => {
    const eq = {
      [KEY]: {
        specificCode: "V123",
        registeredCode: "REG-001",
        approvedDate: "20240101",
        validity: "20241231",
      },
    };
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("supports alternative start field names (시작유효일, 시작유효일자, 지원시작일, 치료시작일자)", () => {
    for (const startField of ["시작유효일", "시작유효일자", "지원시작일", "치료시작일자"]) {
      const eq = {
        [KEY]: {
          특정기호: "V1",
          등록번호: "R1",
          [startField]: "20240101",
          종료일: "20241231",
        },
      };
      expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(true);
    }
  });

  it("supports alternative end field names (상실유효일, 종료유효일자, 지원종료일, 치료종료일자)", () => {
    for (const endField of ["상실유효일", "종료유효일자", "지원종료일", "치료종료일자"]) {
      const eq = {
        [KEY]: {
          특정기호: "V1",
          등록번호: "R1",
          등록일: "20240101",
          [endField]: "20241231",
        },
      };
      expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(true);
    }
  });

  it("returns false for invalid startYmd format", () => {
    const eq = makeDiseaseRegistration(KEY, { 등록일: "2024-01-01" }); // hyphenated, not YYYYMMDD
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false for invalid endYmd format (when present)", () => {
    const eq = makeDiseaseRegistration(KEY, { 종료일: "bad-date" });
    expect(is산정특례희귀질환등록대상자(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("uses current date when encounterDateTime is null/undefined", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    const eq = makeDiseaseRegistration(KEY);
    expect(is산정특례희귀질환등록대상자(eq)).toBe(true);
    vi.useRealTimers();
  });

  it("accepts string encounterDateTime", () => {
    const eq = makeDiseaseRegistration(KEY);
    expect(is산정특례희귀질환등록대상자(eq, "2024-06-15")).toBe(true);
    expect(is산정특례희귀질환등록대상자(eq, "2025-06-15")).toBe(false);
  });

  it("falls back to current date for invalid Date object", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    const eq = makeDiseaseRegistration(KEY);
    expect(is산정특례희귀질환등록대상자(eq, new Date("invalid"))).toBe(true);
    vi.useRealTimers();
  });

  it("falls back to current date for invalid string encounterDateTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    const eq = makeDiseaseRegistration(KEY);
    expect(is산정특례희귀질환등록대상자(eq, "not-a-date")).toBe(true);
    vi.useRealTimers();
  });

  it("boundary: encounter on start date is in range", () => {
    const eq = makeDiseaseRegistration(KEY, { 등록일: "20240615", 종료일: "20240615" });
    expect(is산정특례희귀질환등록대상자(eq, new Date(2024, 5, 15, 12, 0, 0))).toBe(true);
  });

  it("boundary: encounter on end date is in range", () => {
    const eq = makeDiseaseRegistration(KEY, { 등록일: "20240101", 종료일: "20240615" });
    expect(is산정특례희귀질환등록대상자(eq, new Date(2024, 5, 15, 23, 59, 59))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// is산정특례 (aggregate)
// ---------------------------------------------------------------------------
describe("is산정특례", () => {
  it("returns false when no sub-registrations", () => {
    expect(is산정특례(undefined)).toBe(false);
    expect(is산정특례({})).toBe(false);
  });

  it("returns true if any sub-registration is active", () => {
    const keys = [
      "산정특례희귀질환등록대상자",
      "산정특례극희귀등록대상자",
      "산정특례상세불명희귀등록대상자",
      "산정특례중증난치질환등록대상자",
      "산정특례기타염색체이상질환등록대상자",
    ];
    for (const key of keys) {
      const eq = makeDiseaseRegistration(key);
      expect(is산정특례(eq, ENCOUNTER_IN_RANGE)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Individual 산정특례 sub-functions
// ---------------------------------------------------------------------------
describe("산정특례 sub-functions", () => {
  const testCases: [string, (eq: any, d?: any) => boolean][] = [
    ["산정특례극희귀등록대상자", is산정특례극희귀등록대상자],
    ["산정특례상세불명희귀등록대상자", is산정특례상세불명희귀등록대상자],
    ["산정특례중증난치질환등록대상자", is산정특례중증난치질환등록대상자],
    ["산정특례기타염색체이상질환등록대상자", is산정특례기타염색체이상질환등록대상자],
  ];

  for (const [key, fn] of testCases) {
    it(`${key}: returns true when active`, () => {
      expect(fn(makeDiseaseRegistration(key), ENCOUNTER_IN_RANGE)).toBe(true);
    });

    it(`${key}: returns false when out of range`, () => {
      expect(fn(makeDiseaseRegistration(key), ENCOUNTER_OUT_OF_RANGE)).toBe(false);
    });

    it(`${key}: returns false for undefined`, () => {
      expect(fn(undefined)).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// is중증 (aggregate)
// ---------------------------------------------------------------------------
describe("is중증", () => {
  it("returns false when no sub-registrations", () => {
    expect(is중증(undefined)).toBe(false);
  });

  it("returns true for 산정특례암등록대상자1", () => {
    expect(is중증(makeDiseaseRegistration("산정특례암등록대상자1"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns true for 산정특례화상등록대상자", () => {
    expect(is중증(makeDiseaseRegistration("산정특례화상등록대상자"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns true for 중복암 2-5", () => {
    for (let i = 2; i <= 5; i++) {
      expect(is중증(makeDiseaseRegistration(`산정특례중복암등록대상자${i}`), ENCOUNTER_IN_RANGE)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// is중증암
// ---------------------------------------------------------------------------
describe("is중증암", () => {
  it("returns false when undefined", () => {
    expect(is중증암(undefined)).toBe(false);
  });

  it("returns true for 산정특례암등록대상자1", () => {
    expect(is중증암(makeDiseaseRegistration("산정특례암등록대상자1"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("does NOT include 화상 (is중증 does, is중증암 does not)", () => {
    expect(is중증암(makeDiseaseRegistration("산정특례화상등록대상자"), ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns true for 중복암 2-5", () => {
    for (let i = 2; i <= 5; i++) {
      expect(is중증암(makeDiseaseRegistration(`산정특례중복암등록대상자${i}`), ENCOUNTER_IN_RANGE)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Individual 중증 sub-functions
// ---------------------------------------------------------------------------
describe("중증 sub-functions", () => {
  const fns: [string, (eq: any, d?: any) => boolean][] = [
    ["산정특례암등록대상자1", is산정특례암등록대상자1],
    ["산정특례화상등록대상자", is산정특례화상등록대상자],
    ["산정특례중복암등록대상자2", is산정특례중복암등록대상자2],
    ["산정특례중복암등록대상자3", is산정특례중복암등록대상자3],
    ["산정특례중복암등록대상자4", is산정특례중복암등록대상자4],
    ["산정특례중복암등록대상자5", is산정특례중복암등록대상자5],
  ];

  for (const [key, fn] of fns) {
    it(`${key}: active → true`, () => {
      expect(fn(makeDiseaseRegistration(key), ENCOUNTER_IN_RANGE)).toBe(true);
    });

    it(`${key}: out of range → false`, () => {
      expect(fn(makeDiseaseRegistration(key), ENCOUNTER_OUT_OF_RANGE)).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// isStringDataFieldTruthy (tested via is출국자)
// ---------------------------------------------------------------------------
describe("isStringDataFieldTruthy (via is출국자)", () => {
  it("returns false for undefined", () => {
    expect(is출국자(undefined)).toBe(false);
  });

  it("returns false when key missing", () => {
    expect(is출국자({})).toBe(false);
  });

  it("returns false when field is not an object", () => {
    expect(is출국자({ 출국자여부: "Y" })).toBe(false);
  });

  it("returns true for truthy data", () => {
    expect(is출국자({ 출국자여부: { data: "Y" } })).toBe(true);
    expect(is출국자({ 출국자여부: { data: "1" } })).toBe(true);
  });

  it("returns false for falsy data values", () => {
    expect(is출국자({ 출국자여부: { data: "N" } })).toBe(false);
    expect(is출국자({ 출국자여부: { data: "0" } })).toBe(false);
    expect(is출국자({ 출국자여부: { data: "FALSE" } })).toBe(false);
    expect(is출국자({ 출국자여부: { data: "F" } })).toBe(false);
    expect(is출국자({ 출국자여부: { data: "NO" } })).toBe(false);
  });

  it("returns false for empty data", () => {
    expect(is출국자({ 출국자여부: { data: "" } })).toBe(false);
  });

  it("handles nested StringDataField (field without data key uses field itself)", () => {
    // isStringDataFieldTruthy reads (field.data ?? field) then calls getStringFromMaybeStringDataField
    // When field = { something: "Y" } (no data key), it reads field itself as StringDataField
    expect(is출국자({ 출국자여부: { data: { data: "Y" } } })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// is급여제한
// ---------------------------------------------------------------------------
describe("is급여제한", () => {
  it("returns false for undefined", () => {
    expect(is급여제한(undefined)).toBe(false);
  });

  it("returns false when key missing", () => {
    expect(is급여제한({})).toBe(false);
  });

  it("returns false when field is not an object", () => {
    expect(is급여제한({ 급여제한여부: "Y" })).toBe(false);
  });

  it("returns true for valid codes like '01'", () => {
    expect(is급여제한({ 급여제한여부: { data: "01" } })).toBe(true);
    expect(is급여제한({ 급여제한여부: { data: "02" } })).toBe(true);
  });

  it("returns false for '00' (해당없음)", () => {
    expect(is급여제한({ 급여제한여부: { data: "00" } })).toBe(false);
  });

  it("returns false for boolean-false values", () => {
    expect(is급여제한({ 급여제한여부: { data: "N" } })).toBe(false);
    expect(is급여제한({ 급여제한여부: { data: "0" } })).toBe(false);
  });

  it("returns false for empty data", () => {
    expect(is급여제한({ 급여제한여부: { data: "" } })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is당뇨병요양비대상자유형
// ---------------------------------------------------------------------------
describe("is당뇨병요양비대상자유형", () => {
  it("returns false for undefined", () => {
    expect(is당뇨병요양비대상자유형(undefined)).toBe(false);
  });

  it("returns true for truthy value", () => {
    expect(is당뇨병요양비대상자유형({ 당뇨병요양비대상자유형: { data: "01" } })).toBe(true);
  });

  it("returns false for N", () => {
    expect(is당뇨병요양비대상자유형({ 당뇨병요양비대상자유형: { data: "N" } })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is요양병원입원여부
// ---------------------------------------------------------------------------
describe("is요양병원입원여부", () => {
  it("returns false for undefined", () => {
    expect(is요양병원입원여부(undefined)).toBe(false);
  });

  it("returns true for truthy value", () => {
    expect(is요양병원입원여부({ 요양병원입원여부: { data: "Y" } })).toBe(true);
  });

  it("returns false for N", () => {
    expect(is요양병원입원여부({ 요양병원입원여부: { data: "N" } })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is본인부담차등
// ---------------------------------------------------------------------------
describe("is본인부담차등", () => {
  it("returns false for undefined", () => {
    expect(is본인부담차등(undefined)).toBe(false);
  });

  it("returns true for truthy value", () => {
    expect(is본인부담차등({ 본인부담차등여부: { data: "Y" } })).toBe(true);
  });

  it("returns false for N", () => {
    expect(is본인부담차등({ 본인부담차등여부: { data: "N" } })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is조산아및저체중아
// ---------------------------------------------------------------------------
describe("is조산아및저체중아", () => {
  it("returns false for undefined", () => {
    expect(is조산아및저체중아(undefined)).toBe(false);
  });

  it("returns false when key is missing", () => {
    expect(is조산아및저체중아({})).toBe(false);
  });

  it("returns true for simple { data: 'Y' } format", () => {
    expect(is조산아및저체중아({ 조산아및저체중출생아등록대상자: { data: "Y" } })).toBe(true);
  });

  it("returns false for simple { data: 'N' } format", () => {
    expect(is조산아및저체중아({ 조산아및저체중출생아등록대상자: { data: "N" } })).toBe(false);
  });

  it("returns true for PreInfantInfo format within date range", () => {
    const eq = {
      조산아및저체중출생아등록대상자: {
        등록번호: "INF-001",
        시작유효일자: "20240101",
        종료유효일자: "20241231",
      },
    };
    expect(is조산아및저체중아(eq, ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns false for PreInfantInfo format outside date range", () => {
    const eq = {
      조산아및저체중출생아등록대상자: {
        등록번호: "INF-001",
        시작유효일자: "20240101",
        종료유효일자: "20241231",
      },
    };
    expect(is조산아및저체중아(eq, ENCOUNTER_OUT_OF_RANGE)).toBe(false);
  });

  it("returns false when 등록번호 is missing in PreInfantInfo format", () => {
    const eq = {
      조산아및저체중출생아등록대상자: {
        시작유효일자: "20240101",
        종료유효일자: "20241231",
      },
    };
    expect(is조산아및저체중아(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("returns false when 시작유효일자 is invalid in PreInfantInfo format", () => {
    const eq = {
      조산아및저체중출생아등록대상자: {
        등록번호: "INF-001",
        시작유효일자: "bad",
        종료유효일자: "20241231",
      },
    };
    expect(is조산아및저체중아(eq, ENCOUNTER_IN_RANGE)).toBe(false);
  });

  it("defaults end date to 99991231 when 종료유효일자 is invalid", () => {
    const eq = {
      조산아및저체중출생아등록대상자: {
        등록번호: "INF-001",
        시작유효일자: "20240101",
        종료유효일자: "",
      },
    };
    expect(is조산아및저체중아(eq, ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns false for non-object field", () => {
    expect(is조산아및저체중아({ 조산아및저체중출생아등록대상자: "Y" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is결핵
// ---------------------------------------------------------------------------
describe("is결핵", () => {
  it("returns false for undefined", () => {
    expect(is결핵(undefined)).toBe(false);
  });

  it("returns true when 산정특례결핵등록대상자 is active", () => {
    expect(is결핵(makeDiseaseRegistration("산정특례결핵등록대상자"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns true when 요양기관별산정특례결핵등록대상자 is active", () => {
    expect(is결핵(makeDiseaseRegistration("요양기관별산정특례결핵등록대상자"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns false when both are out of range", () => {
    expect(is결핵(makeDiseaseRegistration("산정특례결핵등록대상자"), ENCOUNTER_OUT_OF_RANGE)).toBe(false);
  });
});

describe("is산정특례결핵등록대상자", () => {
  it("active → true", () => {
    expect(is산정특례결핵등록대상자(makeDiseaseRegistration("산정특례결핵등록대상자"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("out of range → false", () => {
    expect(is산정특례결핵등록대상자(makeDiseaseRegistration("산정특례결핵등록대상자"), ENCOUNTER_OUT_OF_RANGE)).toBe(false);
  });
});

describe("is요양기관별산정특례결핵등록대상자", () => {
  it("active → true", () => {
    expect(
      is요양기관별산정특례결핵등록대상자(makeDiseaseRegistration("요양기관별산정특례결핵등록대상자"), ENCOUNTER_IN_RANGE)
    ).toBe(true);
  });

  it("out of range → false", () => {
    expect(
      is요양기관별산정특례결핵등록대상자(makeDiseaseRegistration("요양기관별산정특례결핵등록대상자"), ENCOUNTER_OUT_OF_RANGE)
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is중증치매
// ---------------------------------------------------------------------------
describe("is중증치매", () => {
  it("returns false for undefined", () => {
    expect(is중증치매(undefined)).toBe(false);
  });

  it("returns true when active", () => {
    expect(is중증치매(makeDiseaseRegistration("산정특례중증치매등록대상자"), ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns false when out of range", () => {
    expect(is중증치매(makeDiseaseRegistration("산정특례중증치매등록대상자"), ENCOUNTER_OUT_OF_RANGE)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is자립준비청년
// ---------------------------------------------------------------------------
describe("is자립준비청년", () => {
  it("returns false for undefined", () => {
    expect(is자립준비청년(undefined)).toBe(false);
  });

  it("returns false when key is missing", () => {
    expect(is자립준비청년({})).toBe(false);
  });

  it("returns true for simple { data: 'Y' } format", () => {
    expect(is자립준비청년({ 자립준비청년대상자: { data: "Y" } })).toBe(true);
  });

  it("returns false for simple { data: 'N' } format", () => {
    expect(is자립준비청년({ 자립준비청년대상자: { data: "N" } })).toBe(false);
  });

  it("returns true for SelfPreparationPersonInfo format within range", () => {
    const eq = {
      자립준비청년대상자: {
        특정기호: "SP1",
        등록번호: "REG-SP",
        지원시작일: "20240101",
        지원종료일: "20241231",
      },
    };
    expect(is자립준비청년(eq, ENCOUNTER_IN_RANGE)).toBe(true);
  });

  it("returns false for SelfPreparationPersonInfo format outside range", () => {
    const eq = {
      자립준비청년대상자: {
        특정기호: "SP1",
        등록번호: "REG-SP",
        지원시작일: "20240101",
        지원종료일: "20241231",
      },
    };
    expect(is자립준비청년(eq, ENCOUNTER_OUT_OF_RANGE)).toBe(false);
  });

  it("returns false for falsy field", () => {
    expect(is자립준비청년({ 자립준비청년대상자: null })).toBe(false);
    expect(is자립준비청년({ 자립준비청년대상자: "" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// is비대면
// ---------------------------------------------------------------------------
describe("is비대면", () => {
  it("returns false for undefined", () => {
    expect(is비대면(undefined)).toBe(false);
  });

  it("returns false when key is missing", () => {
    expect(is비대면({})).toBe(false);
  });

  it("returns false when field is not an object", () => {
    expect(is비대면({ 비대면진료대상정보: "something" })).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(is비대면({ 비대면진료대상정보: {} })).toBe(false);
  });

  it("returns true for non-empty object", () => {
    expect(is비대면({ 비대면진료대상정보: { someField: "value" } })).toBe(true);
  });

  it("ignores encounterDateTime parameter", () => {
    const eq = { 비대면진료대상정보: { type: "phone" } };
    expect(is비대면(eq, new Date(2020, 0, 1))).toBe(true);
    expect(is비대면(eq, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clear임신부IfOverLimit
// ---------------------------------------------------------------------------
describe("clear임신부IfOverLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // 2024-06-15
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is임신부가 false이면 아무것도 변경하지 않음", () => {
    const info = {
      is임신부: false,
      extraQualification: {
        임신부: { data: "Y", upsertDate: "2024-01-01", week: 40, day: 0 },
      },
    };
    clear임신부IfOverLimit(info, new Date(2024, 5, 15));
    expect(info.is임신부).toBe(false);
  });

  it("is임신부가 undefined이면 아무것도 변경하지 않음", () => {
    const info = { extraQualification: {} } as any;
    clear임신부IfOverLimit(info, new Date(2024, 5, 15));
    expect(info.is임신부).toBeUndefined();
  });

  it("임신 42주 6일이면 해제하지 않음 (43주 미만)", () => {
    // upsertDate=2024-06-15, week=42, day=6 → selectedDate=2024-06-15 → diff=0 → 42w6d
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-15", week: 42, day: 6 },
    };
    const info = { is임신부: true, extraQualification: eq };
    clear임신부IfOverLimit(info, new Date(2024, 5, 15));
    expect(info.is임신부).toBe(true);
  });

  it("임신 정확히 43주 0일이면 해제함", () => {
    // upsertDate=2024-06-15, week=43, day=0 → selectedDate=2024-06-15 → diff=0 → 43w0d
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-15", week: 43, day: 0 },
    };
    const info = { is임신부: true, extraQualification: eq };
    clear임신부IfOverLimit(info, new Date(2024, 5, 15));
    expect(info.is임신부).toBe(false);
    expect(info.extraQualification.임신부.data).toBe("N");
  });

  it("selectedDate 기준으로 43주 이상이면 해제함", () => {
    // upsertDate=2024-01-01, week=10, day=0 → totalAtUpsert=70
    // selectedDate=2024-08-12 → diff=224 days → total=294 → 42w0d → NOT over
    // selectedDate=2024-08-19 → diff=231 → total=301 → 43w0d → over
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-01-01", week: 10, day: 0 },
    };
    const info42 = { is임신부: true, extraQualification: { ...eq } };
    clear임신부IfOverLimit(info42, new Date(2024, 7, 12));
    expect(info42.is임신부).toBe(true);

    const info43 = {
      is임신부: true,
      extraQualification: { 임신부: { ...eq.임신부 } },
    };
    clear임신부IfOverLimit(info43, new Date(2024, 7, 19));
    expect(info43.is임신부).toBe(false);
  });

  it("extraQualification이 없으면 아무것도 변경하지 않음", () => {
    const info = { is임신부: true } as any;
    clear임신부IfOverLimit(info, new Date(2024, 5, 15));
    // get임신부WeekAndDay returns null → no change
    expect(info.is임신부).toBe(true);
  });

  it("selectedDate가 null이면 현재 날짜 기준으로 계산", () => {
    // fakeTimer: 2024-06-15, upsertDate=2024-06-15, week=43, day=0 → 43w0d
    const eq = {
      임신부: { data: "Y", upsertDate: "2024-06-15", week: 43, day: 0 },
    };
    const info = { is임신부: true, extraQualification: eq };
    clear임신부IfOverLimit(info, null);
    expect(info.is임신부).toBe(false);
  });
});
