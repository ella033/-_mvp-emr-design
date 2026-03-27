import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DisRegType,
  DisRegTypeLabel,
  MinDate,
  의료급여자격여부,
  본인부담구분코드,
  본인부담구분코드Label,
  급여제한여부 as 급여제한여부Enum,
  급여제한여부Label,
  국적구분 as 국적구분Enum,
  국적구분Label,
} from "@/constants/common/common-enum";
import {
  getStringData,
  getNumberData,
  get본인부담구분코드ToString,
  DISEASE_REGISTRATION_FIELDS,
  extractEtcInfoListFromEligibilityCheckResponse,
  extractChoiceHospitalListFromEligibilityCheckResponse,
  calculateComputedFieldsFromParsedData,
  getAllEtcInfoComputedFieldsFromParsedData,
  getDiseaseRegistrationFieldsFromExtraQualification,
  getExtraQualificationStrListFromExtraQualification,
  convertBaseDisRegToDiseaseRegistration,
  convertDisRegPrsonOtherInfoToBaseDisReg,
} from "@/lib/nhic-form-utils";

// ============================================================================
// Mock date-utils - the source file imports these
// ============================================================================
vi.mock("@/lib/date-utils", () => ({
  parseDateString: vi.fn((dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return MinDate;
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? MinDate : date;
  }),
  parseDateStringOrNull: vi.fn((dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return null;
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }),
  formatDateToString: vi.fn((date: Date | null | undefined) => {
    if (!date) return "";
    if (date.getTime() === MinDate.getTime() || date.getFullYear() === 1970)
      return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }),
  formatDateTimeString: vi.fn((dateTimeStr: string) => {
    if (!dateTimeStr || dateTimeStr.length < 8) return "";
    return `formatted:${dateTimeStr}`;
  }),
}));

// ============================================================================
// Helper to build a minimal EligibilityCheckResponseDto-like object
// ============================================================================
function makeEmptyParsedData(): Record<string, any> {
  return {};
}

function makeStringField(data?: string): { data?: string } {
  return data !== undefined ? { data } : {};
}

// ============================================================================
// getStringData
// ============================================================================
describe("getStringData", () => {
  it("returns empty string for undefined", () => {
    expect(getStringData(undefined)).toBe("");
  });

  it("returns empty string for empty object ({})", () => {
    expect(getStringData({} as Record<string, never>)).toBe("");
  });

  it("returns empty string when data is undefined", () => {
    expect(getStringData({ data: undefined })).toBe("");
  });

  it("returns the data value when present", () => {
    expect(getStringData({ data: "hello" })).toBe("hello");
  });

  it("returns empty string data when data is empty string", () => {
    expect(getStringData({ data: "" })).toBe("");
  });
});

// ============================================================================
// getNumberData
// ============================================================================
describe("getNumberData", () => {
  it("returns the number when provided", () => {
    expect(getNumberData(42)).toBe(42);
  });

  it("returns 0 for undefined", () => {
    expect(getNumberData(undefined)).toBe(0);
  });

  it("returns 0 for 0 (falsy number)", () => {
    // Note: this is the actual behavior due to `value || 0`
    expect(getNumberData(0)).toBe(0);
  });

  it("returns negative numbers correctly", () => {
    expect(getNumberData(-5)).toBe(-5);
  });
});

// ============================================================================
// get본인부담구분코드ToString
// ============================================================================
describe("get본인부담구분코드ToString", () => {
  it("returns empty string for null", () => {
    expect(get본인부담구분코드ToString(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(get본인부담구분코드ToString(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(get본인부담구분코드ToString("")).toBe("");
  });

  it('returns empty string for "0"', () => {
    expect(get본인부담구분코드ToString("0")).toBe("");
  });

  it('returns empty string for "00"', () => {
    expect(get본인부담구분코드ToString("00")).toBe("");
  });

  it("returns label for valid code M001", () => {
    const result = get본인부담구분코드ToString("M001");
    expect(result).toBe(본인부담구분코드Label[본인부담구분코드.M001]);
  });

  it("returns label for valid code B014", () => {
    const result = get본인부담구분코드ToString("B014");
    expect(result).toBe(본인부담구분코드Label[본인부담구분코드.B014]);
  });

  it("returns empty string for unknown code without fallback", () => {
    expect(get본인부담구분코드ToString("UNKNOWN")).toBe("");
  });

  it("returns code for unknown code with fallbackToCode", () => {
    expect(
      get본인부담구분코드ToString("UNKNOWN", { fallbackToCode: true })
    ).toBe("UNKNOWN");
  });

  it("returns empty string for unknown code with fallbackToCode false", () => {
    expect(
      get본인부담구분코드ToString("UNKNOWN", { fallbackToCode: false })
    ).toBe("");
  });
});

// ============================================================================
// DISEASE_REGISTRATION_FIELDS
// ============================================================================
describe("DISEASE_REGISTRATION_FIELDS", () => {
  it("has 14 entries", () => {
    expect(DISEASE_REGISTRATION_FIELDS).toHaveLength(14);
  });

  it("first entry is for 산정특례희귀질환등록대상자", () => {
    expect(DISEASE_REGISTRATION_FIELDS[0]).toEqual({
      key: "산정특례희귀질환등록대상자",
      disRegType: DisRegType.산정특례New,
    });
  });

  it("contains multiple 중증암 entries for 중복암", () => {
    const cancerEntries = DISEASE_REGISTRATION_FIELDS.filter(
      (f) => f.disRegType === DisRegType.중증암
    );
    // 산정특례암등록대상자1 + 4 중복암 entries = 5
    expect(cancerEntries.length).toBe(5);
  });
});

// ============================================================================
// extractEtcInfoListFromEligibilityCheckResponse
// ============================================================================
describe("extractEtcInfoListFromEligibilityCheckResponse", () => {
  it("returns empty array for empty parsed data", () => {
    const result = extractEtcInfoListFromEligibilityCheckResponse(
      makeEmptyParsedData() as any
    );
    expect(result).toEqual([]);
  });

  it("extracts etcInfo from a field with registration data", () => {
    const parsedData = {
      산정특례희귀질환등록대상자: {
        특정기호: "V123",
        등록번호: "R001",
        등록일: "20240101",
        종료일: "20241231",
        상병코드: "J01",
        상병일련번호: "001",
      },
    } as any;

    const result =
      extractEtcInfoListFromEligibilityCheckResponse(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0].disRegType).toBe(DisRegType.산정특례New);
    expect(result[0].specificCode).toBe("V123");
    expect(result[0].registeredCode).toBe("R001");
    expect(result[0].corporalCode).toBe("J01");
    expect(result[0].corporalSerialNumber).toBe("001");
    expect(result[0].registeredDate).toBeInstanceOf(Date);
    expect(result[0].endDate).toBeInstanceOf(Date);
  });

  it("skips fields that are empty objects", () => {
    const parsedData = {
      산정특례희귀질환등록대상자: {},
    } as any;
    const result =
      extractEtcInfoListFromEligibilityCheckResponse(parsedData);
    expect(result).toEqual([]);
  });

  it("skips fields that have no registration data (no 등록일, 특정기호, 등록번호)", () => {
    const parsedData = {
      산정특례희귀질환등록대상자: {
        상병코드: "J01",
        종료일: "20241231",
      },
    } as any;
    const result =
      extractEtcInfoListFromEligibilityCheckResponse(parsedData);
    expect(result).toEqual([]);
  });

  it("includes field when only 특정기호 is present", () => {
    const parsedData = {
      산정특례암등록대상자1: {
        특정기호: "V999",
      },
    } as any;
    const result =
      extractEtcInfoListFromEligibilityCheckResponse(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0].specificCode).toBe("V999");
    expect(result[0].disRegType).toBe(DisRegType.중증암);
  });

  it("handles null dates gracefully", () => {
    const parsedData = {
      산정특례화상등록대상자: {
        등록번호: "R002",
        등록일: "",
        종료일: "",
      },
    } as any;
    const result =
      extractEtcInfoListFromEligibilityCheckResponse(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0].registeredDate).toBeNull();
    expect(result[0].endDate).toBeNull();
  });

  it("skips non-object fields", () => {
    const parsedData = {
      산정특례희귀질환등록대상자: "not-an-object",
    } as any;
    const result =
      extractEtcInfoListFromEligibilityCheckResponse(parsedData);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// extractChoiceHospitalListFromEligibilityCheckResponse
// ============================================================================
describe("extractChoiceHospitalListFromEligibilityCheckResponse", () => {
  it("returns empty array when no choice hospitals", () => {
    const result =
      extractChoiceHospitalListFromEligibilityCheckResponse(
        makeEmptyParsedData() as any
      );
    expect(result).toEqual([]);
  });

  it("extracts hospitals with codes", () => {
    const parsedData = {
      선택기관기호1: { data: "H001" },
      선택기관기호2: { data: "H002" },
      선택기관기호3: undefined,
      선택기관기호4: undefined,
      선택기관이름1: { data: "Hospital A" },
      선택기관이름2: { data: "Hospital B" },
      선택기관이름3: undefined,
      선택기관이름4: undefined,
    } as any;

    const result =
      extractChoiceHospitalListFromEligibilityCheckResponse(parsedData);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, code: "H001", name: "Hospital A" });
    expect(result[1]).toEqual({ id: 2, code: "H002", name: "Hospital B" });
  });

  it("skips hospitals with empty codes", () => {
    const parsedData = {
      선택기관기호1: { data: "" },
      선택기관기호2: { data: "H002" },
      선택기관기호3: {},
      선택기관기호4: undefined,
      선택기관이름1: { data: "Hospital A" },
      선택기관이름2: { data: "Hospital B" },
      선택기관이름3: {},
      선택기관이름4: undefined,
    } as any;

    const result =
      extractChoiceHospitalListFromEligibilityCheckResponse(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 2, code: "H002", name: "Hospital B" });
  });

  it("assigns sequential IDs starting from 1", () => {
    const parsedData = {
      선택기관기호1: undefined,
      선택기관기호2: undefined,
      선택기관기호3: { data: "H003" },
      선택기관기호4: { data: "H004" },
      선택기관이름1: undefined,
      선택기관이름2: undefined,
      선택기관이름3: { data: "Hospital C" },
      선택기관이름4: { data: "Hospital D" },
    } as any;

    const result =
      extractChoiceHospitalListFromEligibilityCheckResponse(parsedData);
    expect(result).toHaveLength(2);
    // IDs are based on position index + 1 (3rd=3, 4th=4)
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(4);
  });
});

// ============================================================================
// calculateComputedFieldsFromParsedData
// ============================================================================
describe("calculateComputedFieldsFromParsedData", () => {
  it("returns default values for empty parsed data", () => {
    const result = calculateComputedFieldsFromParsedData(
      makeEmptyParsedData() as any
    );

    expect(result.주민등록번호).toBe("");
    expect(result.의료급여여부).toBe(false);
    expect(result.의료급여자격여부).toBe("");
    expect(result.선택요양기관제도선택).toBe("아니오");
    expect(result.선택요양기관여부).toBe("아니오");
    expect(result.선택요양기관지정일).toBe("");
    expect(result.출국자여부).toBe("아니오");
    expect(result.자격취득일).toBe("");
    expect(result.급여제한여부).toBe("아니오");
    expect(result.급여제한일자).toBe("");
    expect(result.본인부담구분코드).toBe("");
    expect(result.기타자격정보여부).toBe(false);
    expect(result.건강보험자격상실처리일자).toBe("");
    expect(result.요양병원입원여부).toBe("아니오");
    expect(result.본인확인예외).toBe("아니오");
    expect(result.본인부담차등여부).toBe("아니오");
    expect(result.비대면진료여부).toBe("아니오");
    expect(result.자립준비청년여부).toBe("아니오");
    expect(result.국적구분).toBe("");
    expect(result.방문진료본인부담경감대상자여부).toBe("아니오");
    expect(result.산정특례환자여부).toBe(false);
    expect(result.수진자성명).toBe("");
    expect(result.세대주성명).toBe("");
    expect(result.보장기관명).toBe("");
    expect(result.보장기관기호).toBe("");
    expect(result.시설기호).toBe("");
    expect(result.건강생활유지비지원금).toBe("0");
    expect(result.선택요양기관목록).toEqual([]);
    expect(result.기타자격정보목록).toEqual([]);
  });

  it("formats resident registration number with dash", () => {
    const parsedData = {
      수진자주민등록번호: { data: "9001011234567" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.주민등록번호).toBe("900101-1234567");
  });

  it("preserves resident registration number that already has dash", () => {
    const parsedData = {
      수진자주민등록번호: { data: "900101-1234567" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.주민등록번호).toBe("900101-1234567");
  });

  it("returns empty string for missing resident registration number", () => {
    const result = calculateComputedFieldsFromParsedData(
      makeEmptyParsedData() as any
    );
    expect(result.주민등록번호).toBe("");
  });

  it("detects 의료급여1종", () => {
    const parsedData = {
      자격여부: { data: String(의료급여자격여부.의료급여1종) },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.의료급여여부).toBe(true);
    expect(result.의료급여자격여부).toBe("의료급여1종");
  });

  it("detects 의료급여2종", () => {
    const parsedData = {
      자격여부: { data: String(의료급여자격여부.의료급여2종) },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.의료급여여부).toBe(true);
    expect(result.의료급여자격여부).toBe("의료급여2종");
  });

  it("detects non-의료급여 (직장가입자)", () => {
    const parsedData = {
      자격여부: { data: String(의료급여자격여부.직장가입자) },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.의료급여여부).toBe(false);
    expect(result.의료급여자격여부).toBe("직장가입자");
  });

  it('sets 선택요양기관 to "예" when 선택기관기호1 exists', () => {
    const parsedData = {
      선택기관기호1: { data: "H001" },
      선택기관이름1: { data: "Hospital" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.선택요양기관제도선택).toBe("예");
    expect(result.선택요양기관여부).toBe("예");
  });

  it('sets 출국자여부 to "예" when value is "Y"', () => {
    const parsedData = {
      출국자여부: { data: "Y" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.출국자여부).toBe("예");
  });

  it('sets 출국자여부 to "아니오" when value is not "Y"', () => {
    const parsedData = {
      출국자여부: { data: "N" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.출국자여부).toBe("아니오");
  });

  it("formats valid qualification date", () => {
    const parsedData = {
      자격취득일: { data: "20240315" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.자격취득일).toBe("2024-03-15");
  });

  it("handles 급여제한여부 with valid enum value", () => {
    const parsedData = {
      급여제한여부: { data: String(급여제한여부Enum.무자격자) },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.급여제한여부).toBe(
      급여제한여부Label[급여제한여부Enum.무자격자]
    );
  });

  it('handles 급여제한여부 "00" as 아니오', () => {
    const parsedData = {
      급여제한여부: { data: "00" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.급여제한여부).toBe("아니오");
  });

  it("formats 급여제한일자 correctly", () => {
    const parsedData = {
      급여제한일자: { data: "20240601" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.급여제한일자).toBe("2024-06-01");
  });

  it('sets 요양병원입원여부 to "예" with institution code', () => {
    const parsedData = {
      요양병원입원여부: { data: "Y" },
      요양병원기관기호: { data: "INST001" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.요양병원입원여부).toBe("예(INST001)");
  });

  it('sets 요양병원입원여부 to "예()" when institution code is empty', () => {
    const parsedData = {
      요양병원입원여부: { data: "Y" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.요양병원입원여부).toBe("예()");
  });

  it('sets 본인확인예외 to "예" when Y', () => {
    const parsedData = {
      본인확인예외여부: { data: "Y" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.본인확인예외).toBe("예");
  });

  it('sets 본인확인예외 to "아니오" when not Y', () => {
    const parsedData = {
      본인확인예외여부: { data: "N" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.본인확인예외).toBe("아니오");
  });

  it("falls back to rawData for 본인확인예외여부 when parsedData field is empty object", () => {
    const parsedData = {
      본인확인예외여부: {},
    } as any;
    const rawData = { idCfrExcepYn: "Y" } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData, rawData);
    expect(result.본인확인예외).toBe("예");
  });

  it("falls back to rawData object form for 본인확인예외여부", () => {
    const parsedData = {
      본인확인예외여부: {},
    } as any;
    const rawData = { idCfrExcepYn: { data: "Y" } } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData, rawData);
    expect(result.본인확인예외).toBe("예");
  });

  it('sets 본인부담차등여부 to "예" when Y', () => {
    const parsedData = {
      본인부담차등여부: { data: "Y" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.본인부담차등여부).toBe("예");
  });

  it('sets 비대면진료여부 to "예" when valid non-empty object', () => {
    const parsedData = {
      비대면진료대상정보: { 섬벽지거주여부: "Y" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.비대면진료여부).toBe("예");
  });

  it('sets 비대면진료여부 to "아니오" when empty object', () => {
    const parsedData = {
      비대면진료대상정보: {},
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.비대면진료여부).toBe("아니오");
  });

  it('sets 자립준비청년여부 to "예" when valid non-empty object', () => {
    const parsedData = {
      자립준비청년대상자: { someField: "value" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.자립준비청년여부).toBe("예");
  });

  it('sets 자립준비청년여부 to "아니오" when empty object', () => {
    const parsedData = {
      자립준비청년대상자: {},
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.자립준비청년여부).toBe("아니오");
  });

  it("maps 국적구분 correctly for 내국인", () => {
    const parsedData = {
      국적구분: { data: String(국적구분Enum.내국인) },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.국적구분).toBe("내국인");
  });

  it("maps 국적구분 correctly for 외국인", () => {
    const parsedData = {
      국적구분: { data: String(국적구분Enum.외국인) },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.국적구분).toBe("외국인");
  });

  it("sets 산정특례환자여부 to true when etcInfoList is non-empty", () => {
    const parsedData = {
      산정특례희귀질환등록대상자: {
        특정기호: "V123",
        등록일: "20240101",
      },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.산정특례환자여부).toBe(true);
    expect(result.기타자격정보여부).toBe(true);
    expect(result.기타자격정보목록.length).toBeGreaterThan(0);
  });

  it("includes 조회기준일 with formatted date", () => {
    const parsedData = {
      데이터입력일자: { data: "20240315-120000" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.조회기준일).toContain("조회기준일 :");
  });

  it("extracts 수진자성명 correctly", () => {
    const parsedData = {
      수진자성명: { data: "홍길동" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.수진자성명).toBe("홍길동");
  });

  it("extracts 세대주성명 correctly", () => {
    const parsedData = {
      세대주성명: { data: "김철수" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.세대주성명).toBe("김철수");
  });

  it("converts 건강생활유지비잔액 to string", () => {
    const parsedData = {
      건강생활유지비잔액: 50000,
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.건강생활유지비지원금).toBe("50000");
  });

  it("uses 보장기관기호 for 보장기관명", () => {
    const parsedData = {
      보장기관기호: { data: "ORG001" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.보장기관명).toBe("ORG001");
    expect(result.보장기관기호).toBe("ORG001");
  });

  it("always returns 방문진료본인부담경감대상자여부 as 아니오", () => {
    const parsedData = {
      방문진료본인부담경감: { data: "Y" }, // even if some field set
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.방문진료본인부담경감대상자여부).toBe("아니오");
  });

  it("always returns 선택요양기관지정일 as empty string", () => {
    const result = calculateComputedFieldsFromParsedData(
      makeEmptyParsedData() as any
    );
    expect(result.선택요양기관지정일).toBe("");
  });

  it("formats 건강보험자격상실처리일자 date correctly", () => {
    const parsedData = {
      건강보험수진자의자격상실처리일자: { data: "20231201" },
    } as any;
    const result = calculateComputedFieldsFromParsedData(parsedData);
    expect(result.건강보험자격상실처리일자).toBe("2023-12-01");
  });
});

// ============================================================================
// getAllEtcInfoComputedFieldsFromParsedData
// ============================================================================
describe("getAllEtcInfoComputedFieldsFromParsedData", () => {
  it("returns empty array for empty parsed data", () => {
    const result = getAllEtcInfoComputedFieldsFromParsedData(
      makeEmptyParsedData() as any
    );
    expect(result).toEqual([]);
  });

  it("maps etcInfo to computed fields correctly", () => {
    const parsedData = {
      산정특례결핵등록대상자: {
        특정기호: "TB01",
        등록번호: "R100",
        등록일: "20240101",
        종료일: "20241231",
        상병코드: "A15",
        상병일련번호: "002",
      },
    } as any;

    const result = getAllEtcInfoComputedFieldsFromParsedData(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0].산정특례유형).toBe(DisRegType.결핵환자산정특례);
    expect(result[0].산정특례유형명).toBe(
      DisRegTypeLabel[DisRegType.결핵환자산정특례]
    );
    expect(result[0].특정기호).toBe("TB01");
    expect(result[0].등록번호).toBe("R100");
    expect(result[0].등록일표시).toBe("2024-01-01");
    expect(result[0].종료일표시).toBe("2024-12-31");
    expect(result[0].상병코드).toBe("A15");
    expect(result[0].상병일련번호).toBe("002");
  });

  it("returns empty date string for MinDate (1970)", () => {
    const parsedData = {
      산정특례암등록대상자1: {
        등록번호: "R200",
        등록일: "", // will result in null from parseDateStringOrNull
        종료일: "",
      },
    } as any;

    const result = getAllEtcInfoComputedFieldsFromParsedData(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0].등록일표시).toBe("");
    expect(result[0].종료일표시).toBe("");
  });

  it("converts null dates to undefined in output", () => {
    const parsedData = {
      산정특례화상등록대상자: {
        특정기호: "BN01",
      },
    } as any;

    const result = getAllEtcInfoComputedFieldsFromParsedData(parsedData);
    expect(result).toHaveLength(1);
    expect(result[0].등록일).toBeUndefined();
    expect(result[0].종료일).toBeUndefined();
  });
});

// ============================================================================
// getDiseaseRegistrationFieldsFromExtraQualification
// ============================================================================
describe("getDiseaseRegistrationFieldsFromExtraQualification", () => {
  it("returns empty object for undefined input", () => {
    expect(getDiseaseRegistrationFieldsFromExtraQualification(undefined)).toEqual(
      {}
    );
  });

  it("returns empty object for empty object input", () => {
    expect(getDiseaseRegistrationFieldsFromExtraQualification({})).toEqual({});
  });

  it("filters known qualification keys", () => {
    const input = {
      산정특례희귀질환등록대상자: { 등록일: "20240101" },
      unknownKey: { data: "ignored" },
      출국자여부: { data: "Y" },
    };
    const result = getDiseaseRegistrationFieldsFromExtraQualification(input);
    expect(result).toHaveProperty("산정특례희귀질환등록대상자");
    expect(result).toHaveProperty("출국자여부");
    expect(result).not.toHaveProperty("unknownKey");
  });

  it("includes all disease registration field keys when present", () => {
    const input = {
      산정특례암등록대상자1: { 등록일: "20240101" },
      산정특례중복암등록대상자2: { 등록일: "20240201" },
      비대면진료대상정보: { 섬벽지거주여부: "Y" },
      자립준비청년대상자: { someField: "value" },
      본인부담차등여부: { data: "Y" },
    };
    const result = getDiseaseRegistrationFieldsFromExtraQualification(input);
    expect(Object.keys(result)).toHaveLength(5);
  });

  it("does not include falsy values", () => {
    const input = {
      출국자여부: null,
      급여제한여부: undefined,
      요양병원입원여부: 0,
      산정특례희귀질환등록대상자: "",
    };
    const result = getDiseaseRegistrationFieldsFromExtraQualification(input);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ============================================================================
// getExtraQualificationStrListFromExtraQualification
// ============================================================================
describe("getExtraQualificationStrListFromExtraQualification", () => {
  it("returns empty array for undefined", () => {
    expect(getExtraQualificationStrListFromExtraQualification(undefined)).toEqual(
      []
    );
  });

  it("returns empty array for empty object", () => {
    expect(getExtraQualificationStrListFromExtraQualification({})).toEqual([]);
  });

  it("returns labels for DiseaseRegistrationPersonBase fields with registration data", () => {
    const input = {
      산정특례희귀질환등록대상자: {
        등록일: "20240101",
        특정기호: "V123",
        등록번호: "R001",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.산정특례New]);
  });

  it("skips DiseaseRegistrationPersonBase fields with no registration data", () => {
    const input = {
      산정특례희귀질환등록대상자: {
        상병코드: "J01",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toEqual([]);
  });

  it("skips empty object fields", () => {
    const input = {
      산정특례희귀질환등록대상자: {},
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toEqual([]);
  });

  it("handles StringDataField type fields (data field with non-N value)", () => {
    const input = {
      출국자여부: { data: "Y" },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.출국자]);
  });

  it("skips StringDataField with data value N", () => {
    const input = {
      출국자여부: { data: "N" },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toEqual([]);
  });

  it("skips StringDataField with empty data", () => {
    const input = {
      출국자여부: { data: "" },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toEqual([]);
  });

  it("handles 비대면진료대상정보 with valid Y values", () => {
    const input = {
      비대면진료대상정보: {
        섬벽지거주여부: "Y",
        장애등록여부: "N",
        장기요양등급여부: "N",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.비대면대상자]);
  });

  it("skips 비대면진료대상정보 when all values are not Y", () => {
    const input = {
      비대면진료대상정보: {
        섬벽지거주여부: "N",
        장애등록여부: "N",
        장기요양등급여부: "N",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).not.toContain(DisRegTypeLabel[DisRegType.비대면대상자]);
  });

  it("deduplicates labels for same DisRegType (multiple 중증암 entries)", () => {
    const input = {
      산정특례암등록대상자1: {
        등록일: "20240101",
        특정기호: "V1",
        등록번호: "R1",
      },
      산정특례중복암등록대상자2: {
        등록일: "20240201",
        특정기호: "V2",
        등록번호: "R2",
      },
      산정특례중복암등록대상자3: {
        등록일: "20240301",
        특정기호: "V3",
        등록번호: "R3",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    const cancerLabels = result.filter(
      (r) => r === DisRegTypeLabel[DisRegType.중증암]
    );
    expect(cancerLabels).toHaveLength(1); // deduplicated
  });

  it("handles 본인부담차등여부 as StringDataField", () => {
    const input = {
      본인부담차등여부: { data: "Y" },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.본인부담차등여부]);
  });

  it("handles 급여제한여부 as StringDataField", () => {
    const input = {
      급여제한여부: { data: "1" },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.급여제한]);
  });

  it("handles 비대면진료대상정보 with 장기요양등급여부 Y", () => {
    const input = {
      비대면진료대상정보: {
        장기요양등급여부: "Y",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.비대면대상자]);
  });

  it("handles 비대면진료대상정보 with 장애등록여부 Y", () => {
    const input = {
      비대면진료대상정보: {
        장애등록여부: "Y",
      },
    };
    const result = getExtraQualificationStrListFromExtraQualification(input);
    expect(result).toContain(DisRegTypeLabel[DisRegType.비대면대상자]);
  });
});

// ============================================================================
// convertBaseDisRegToDiseaseRegistration
// ============================================================================
describe("convertBaseDisRegToDiseaseRegistration", () => {
  it("converts complete data correctly", () => {
    const data = {
      specificCode: "V123",
      registeredCode: "R001",
      registeredDate: new Date(2024, 0, 15),
      validity: new Date(2024, 11, 31),
      corporalCode: "J01",
      corporalSerialNumber: "001",
    };
    const result = convertBaseDisRegToDiseaseRegistration(data);
    expect(result).toEqual({
      특정기호: "V123",
      등록번호: "R001",
      등록일: "20240115",
      종료일: "20241231",
      상병코드: "J01",
      상병일련번호: "001",
    });
  });

  it("handles null dates", () => {
    const data = {
      specificCode: "V123",
      registeredCode: "R001",
      registeredDate: null,
      validity: null,
    };
    const result = convertBaseDisRegToDiseaseRegistration(data);
    expect(result.등록일).toBe("");
    expect(result.종료일).toBe("");
  });

  it("handles missing optional fields", () => {
    const data = {
      specificCode: "",
      registeredCode: "",
      registeredDate: null,
      validity: null,
    };
    const result = convertBaseDisRegToDiseaseRegistration(data);
    expect(result.특정기호).toBe("");
    expect(result.등록번호).toBe("");
    expect(result.상병코드).toBe("");
    expect(result.상병일련번호).toBe("");
  });

  it("pads single-digit month and day with zeros", () => {
    const data = {
      specificCode: "V1",
      registeredCode: "R1",
      registeredDate: new Date(2024, 0, 5), // Jan 5
      validity: new Date(2024, 8, 3), // Sep 3
    };
    const result = convertBaseDisRegToDiseaseRegistration(data);
    expect(result.등록일).toBe("20240105");
    expect(result.종료일).toBe("20240903");
  });
});

// ============================================================================
// convertDisRegPrsonOtherInfoToBaseDisReg
// ============================================================================
describe("convertDisRegPrsonOtherInfoToBaseDisReg", () => {
  it("converts complete data correctly", () => {
    const data = {
      특정기호: "V123",
      등록번호: "R001",
      등록일: "20240115",
      종료일: "20241231",
      상병코드: "A15",
      상병일련번호: "002",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.isData).toBe(true);
    expect(result.division).toBe(0);
    expect(result.specificCode).toBe("V123");
    expect(result.registeredCode).toBe("R001");
    expect(result.registeredDate).toBeInstanceOf(Date);
    expect(result.registeredDate!.getFullYear()).toBe(2024);
    expect(result.registeredDate!.getMonth()).toBe(0); // Jan
    expect(result.registeredDate!.getDate()).toBe(15);
    expect(result.validity).toBeInstanceOf(Date);
    expect(result.corporalCode).toBe("A15");
    expect(result.corporalSerialNumber).toBe("002");
  });

  it("sets isData to false when no registration data", () => {
    const data = {
      상병코드: "A15",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.isData).toBe(false);
    expect(result.specificCode).toBe("");
    expect(result.registeredCode).toBe("");
    expect(result.registeredDate).toBeNull();
    expect(result.validity).toBeNull();
  });

  it("sets isData to true when only 특정기호 is present", () => {
    const data = {
      특정기호: "V999",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.isData).toBe(true);
  });

  it("sets isData to true when only 등록번호 is present", () => {
    const data = {
      등록번호: "R999",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.isData).toBe(true);
  });

  it("sets isData to true when only 등록일 is present", () => {
    const data = {
      등록일: "20240101",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.isData).toBe(true);
  });

  it("returns null dates for invalid date strings", () => {
    const data = {
      등록번호: "R001",
      등록일: "invalid",
      종료일: "2024",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.registeredDate).toBeNull();
    expect(result.validity).toBeNull();
  });

  it("returns undefined for empty 상병코드 and 상병일련번호", () => {
    const data = {
      등록번호: "R001",
      상병코드: "",
      상병일련번호: "",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.corporalCode).toBeUndefined();
    expect(result.corporalSerialNumber).toBeUndefined();
  });

  it("always sets division to 0", () => {
    const data = {
      특정기호: "V1",
    };
    const result = convertDisRegPrsonOtherInfoToBaseDisReg(data);
    expect(result.division).toBe(0);
  });

  it("handles completely empty object", () => {
    const result = convertDisRegPrsonOtherInfoToBaseDisReg({});
    expect(result.isData).toBe(false);
    expect(result.division).toBe(0);
    expect(result.specificCode).toBe("");
    expect(result.registeredCode).toBe("");
    expect(result.registeredDate).toBeNull();
    expect(result.validity).toBeNull();
    expect(result.corporalCode).toBeUndefined();
    expect(result.corporalSerialNumber).toBeUndefined();
  });
});
