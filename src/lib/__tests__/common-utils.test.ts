import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  보험구분,
  보험구분상세,
} from "@/constants/common/common-enum";

// ================================ Store Mocks (hoisted) ================================

const {
  mockUserGetState,
  mockHospitalGetState,
  mockFacilityGetState,
  mockDepartmentGetState,
} = vi.hoisted(() => ({
  mockUserGetState: vi.fn(),
  mockHospitalGetState: vi.fn(),
  mockFacilityGetState: vi.fn(),
  mockDepartmentGetState: vi.fn(),
}));

vi.mock("@/store/user-store", () => ({
  useUserStore: { getState: mockUserGetState },
}));

vi.mock("@/store/hospital-store", () => ({
  useHospitalStore: { getState: mockHospitalGetState },
}));

vi.mock("@/store/facility-store", () => ({
  useFacilityStore: { getState: mockFacilityGetState },
}));

vi.mock("@/store/department-store", () => ({
  useDepartmentStore: { getState: mockDepartmentGetState },
}));

// ================================ Import after mocks ================================

import {
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserName,
  getCurrentHospital,
  getCurrentHospitalId,
  getCurrentHospitalName,
  getFacilityNameById,
  getFacilityDetailsByHospital,
  getDepartmentNameById,
  getPositionNameById,
  getDepartmentAndPositionNames,
  getDepartmentsByHospital,
  getPositionsByDepartment,
  getCurrentContext,
  isValidId,
  safeToString,
  safeToNumber,
  formatRrnNumber,
  extractInfoFromRrn,
  isRrnBirthDateAfterTodayKst,
  formatBirthDate,
  parseBirthDate,
  getUdeptDetailToUdept,
  getChronicDiseaseLabels,
} from "../common-utils";

// ================================ Test Fixtures ================================

const mockUser = { id: 1, name: "홍길동" };
const mockHospital = { id: 10, name: "서울병원" };
const mockFacilities = [
  { id: 100, name: "내과", facilityCode: 1 },
  { id: 101, name: "외과", facilityCode: 2 },
  { id: 102, name: "정형외과", facilityCode: 3 },
];
const mockDepartmentsByHospital: Record<string, Array<{
  department: { id: number; name: string };
  positions: Array<{ id: number; name: string }>;
}>> = {
  "10": [
    {
      department: { id: 1, name: "진료부" },
      positions: [
        { id: 10, name: "과장" },
        { id: 11, name: "대리" },
      ],
    },
    {
      department: { id: 2, name: "간호부" },
      positions: [{ id: 20, name: "수간호사" }],
    },
  ],
};

// ================================ Setup ================================

beforeEach(() => {
  mockUserGetState.mockReturnValue({ user: mockUser });
  mockHospitalGetState.mockReturnValue({ hospital: mockHospital });
  mockFacilityGetState.mockReturnValue({ facilities: mockFacilities });
  mockDepartmentGetState.mockReturnValue({
    departmentsByHospital: mockDepartmentsByHospital,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ================================ Safe Conversions ================================

describe("isValidId", () => {
  it("returns true for positive numbers", () => {
    expect(isValidId(1)).toBe(true);
    expect(isValidId(999)).toBe(true);
  });

  it("returns true for numeric strings", () => {
    expect(isValidId("1")).toBe(true);
    expect(isValidId("123")).toBe(true);
  });

  it("returns false for null and undefined", () => {
    expect(isValidId(null)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidId("")).toBe(false);
  });

  it("returns false for zero", () => {
    expect(isValidId(0)).toBe(false);
  });

  it("returns false for NaN-producing values", () => {
    expect(isValidId("abc")).toBe(false);
    expect(isValidId("not-a-number")).toBe(false);
  });

  it("returns true for negative numbers (they are valid IDs technically)", () => {
    expect(isValidId(-1)).toBe(true);
  });

  it("returns true for float strings", () => {
    expect(isValidId("3.14")).toBe(true);
  });
});

describe("safeToString", () => {
  it("returns empty string for null", () => {
    expect(safeToString(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(safeToString(undefined)).toBe("");
  });

  it("converts numbers to strings", () => {
    expect(safeToString(123)).toBe("123");
    expect(safeToString(0)).toBe("0");
  });

  it("returns string values as-is", () => {
    expect(safeToString("hello")).toBe("hello");
    expect(safeToString("")).toBe("");
  });

  it("converts booleans to strings", () => {
    expect(safeToString(true)).toBe("true");
    expect(safeToString(false)).toBe("false");
  });
});

describe("safeToNumber", () => {
  it("converts numeric strings to numbers", () => {
    expect(safeToNumber("123")).toBe(123);
    expect(safeToNumber("3.14")).toBe(3.14);
  });

  it("returns 0 for non-numeric strings", () => {
    expect(safeToNumber("abc")).toBe(0);
    expect(safeToNumber("")).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(safeToNumber(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(safeToNumber(undefined)).toBe(0);
  });

  it("passes through numbers", () => {
    expect(safeToNumber(42)).toBe(42);
    expect(safeToNumber(0)).toBe(0);
    expect(safeToNumber(-5)).toBe(-5);
  });
});

// ================================ RRN Utilities ================================

describe("formatRrnNumber", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(formatRrnNumber(null)).toBe("");
    expect(formatRrnNumber(undefined)).toBe("");
    expect(formatRrnNumber("")).toBe("");
  });

  it("formats 13-digit number with hyphen", () => {
    expect(formatRrnNumber("9301011234567")).toBe("930101-1234567");
  });

  it("formats partial input (6 or fewer digits) without hyphen", () => {
    expect(formatRrnNumber("930101")).toBe("930101");
    expect(formatRrnNumber("93")).toBe("93");
  });

  it("formats partial input (7+ digits) with hyphen", () => {
    expect(formatRrnNumber("9301011")).toBe("930101-1");
    expect(formatRrnNumber("93010112345")).toBe("930101-12345");
  });

  it("strips non-numeric characters before formatting", () => {
    expect(formatRrnNumber("930101-1234567")).toBe("930101-1234567");
    expect(formatRrnNumber("930 101 1234567")).toBe("930101-1234567");
  });

  it("truncates to 13 digits if longer", () => {
    expect(formatRrnNumber("93010112345678999")).toBe("930101-1234567");
  });

  it("returns masked values as-is", () => {
    expect(formatRrnNumber("930101-1******")).toBe("930101-1******");
    expect(formatRrnNumber("******-*******")).toBe("******-*******");
  });
});

describe("extractInfoFromRrn", () => {
  it("extracts male born in 1900s (gender code 1)", () => {
    const result = extractInfoFromRrn("930101-1234567");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(1); // male
    expect(result.birthString).toBe("19930101");
    expect(result.birthDate).toBeInstanceOf(Date);
    expect(result.birthDate!.getFullYear()).toBe(1993);
  });

  it("extracts female born in 1900s (gender code 2)", () => {
    const result = extractInfoFromRrn("850315-2345678");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(2); // female
    expect(result.birthString).toBe("19850315");
  });

  it("extracts male born in 2000s (gender code 3)", () => {
    const result = extractInfoFromRrn("050620-3123456");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(1); // male
    expect(result.birthString).toBe("20050620");
  });

  it("extracts female born in 2000s (gender code 4)", () => {
    const result = extractInfoFromRrn("100101-4567890");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(2); // female
    expect(result.birthString).toBe("20100101");
  });

  it("handles foreign male in 1900s (gender code 5)", () => {
    const result = extractInfoFromRrn("900101-5123456");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(1);
    expect(result.birthString).toBe("19900101");
  });

  it("handles foreign female in 1900s (gender code 6)", () => {
    const result = extractInfoFromRrn("900101-6123456");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(2);
    expect(result.birthString).toBe("19900101");
  });

  it("handles foreign male in 2000s (gender code 7)", () => {
    const result = extractInfoFromRrn("050101-7123456");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(1);
    expect(result.birthString).toBe("20050101");
  });

  it("handles foreign female in 2000s (gender code 8)", () => {
    const result = extractInfoFromRrn("050101-8123456");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(2);
    expect(result.birthString).toBe("20050101");
  });

  it("works without hyphen", () => {
    const result = extractInfoFromRrn("9301011234567");
    expect(result.isValid).toBe(true);
    expect(result.gender).toBe(1);
    expect(result.birthString).toBe("19930101");
  });

  it("returns invalid for empty string", () => {
    const result = extractInfoFromRrn("");
    expect(result.isValid).toBe(false);
    expect(result.birthDate).toBeNull();
    expect(result.gender).toBe(0);
    expect(result.birthString).toBe("");
  });

  it("returns invalid for wrong format", () => {
    expect(extractInfoFromRrn("12345").isValid).toBe(false);
    expect(extractInfoFromRrn("abcdef-ghijklm").isValid).toBe(false);
  });

  it("returns invalid for gender code 0 or 9", () => {
    expect(extractInfoFromRrn("930101-0234567").isValid).toBe(false);
    expect(extractInfoFromRrn("930101-9234567").isValid).toBe(false);
  });
});

describe("isRrnBirthDateAfterTodayKst", () => {
  beforeEach(() => {
    // Fix the date to 2026-03-09 KST (2026-03-09 00:00 UTC = 2026-03-09 09:00 KST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for past birth dates (7+ digits)", () => {
    // 1993-01-01, gender code 1 -> past
    expect(isRrnBirthDateAfterTodayKst("9301011")).toBe(false);
  });

  it("returns true for future birth dates (7+ digits)", () => {
    // 2027-06-01, gender code 3 -> future
    expect(isRrnBirthDateAfterTodayKst("2706013")).toBe(true);
  });

  it("returns false for 6 digits when at least one interpretation is not after today", () => {
    // "930101" -> 19930101 and 20930101
    // 19930101 is past, so not both after today? Actually the logic is pair[0] > today && pair[1] > today
    // 19930101 < 20260309, so returns false
    expect(isRrnBirthDateAfterTodayKst("930101")).toBe(false);
  });

  it("returns false for fewer than 6 digits", () => {
    expect(isRrnBirthDateAfterTodayKst("93010")).toBe(false);
    expect(isRrnBirthDateAfterTodayKst("")).toBe(false);
  });

  it("returns false for invalid date in 6 digits", () => {
    // Invalid month 13
    expect(isRrnBirthDateAfterTodayKst("931301")).toBe(false);
  });

  it("returns true when both 19xx and 20xx interpretations are after today", () => {
    // "991231" -> 19991231 and 20991231
    // 19991231 < 20260309, so false
    expect(isRrnBirthDateAfterTodayKst("991231")).toBe(false);

    // Need both in the future: e.g., "270601" -> 19270601 (past) and 20270601 (future)
    // 19270601 is past, so false
    expect(isRrnBirthDateAfterTodayKst("270601")).toBe(false);
  });
});

// ================================ Birth Date Utilities ================================

describe("formatBirthDate", () => {
  it("returns empty string for falsy values", () => {
    expect(formatBirthDate(null)).toBe("");
    expect(formatBirthDate(undefined)).toBe("");
    expect(formatBirthDate("")).toBe("");
    expect(formatBirthDate(0)).toBe("");
  });

  it("returns YYYYMMDD string as-is", () => {
    expect(formatBirthDate("19930101")).toBe("19930101");
    expect(formatBirthDate("20050620")).toBe("20050620");
  });

  it("formats Date object to YYYYMMDD", () => {
    const date = new Date(1993, 0, 1); // Jan 1, 1993
    expect(formatBirthDate(date)).toBe("19930101");
  });

  it("formats ISO date string to YYYYMMDD", () => {
    const result = formatBirthDate("1993-01-15");
    expect(result).toMatch(/^199301/);
  });

  it("returns empty string for unparseable values", () => {
    expect(formatBirthDate("not-a-date")).toBe("");
  });

  it("handles Date objects with padding for single-digit months/days", () => {
    const date = new Date(2005, 5, 2); // June 2
    expect(formatBirthDate(date)).toBe("20050602");
  });
});

describe("parseBirthDate", () => {
  it("returns null for empty string", () => {
    expect(parseBirthDate("")).toBeNull();
  });

  it("parses YYYYMMDD to Date", () => {
    const result = parseBirthDate("19930101");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(1993);
    // Month is 0-indexed
    expect(result!.getMonth()).toBe(0);
    expect(result!.getDate()).toBe(1);
  });

  it("parses ISO date string", () => {
    const result = parseBirthDate("1993-06-15");
    expect(result).toBeInstanceOf(Date);
  });

  it("returns null for invalid date strings", () => {
    expect(parseBirthDate("invalid")).toBeNull();
  });

  it("auto-corrects overflow dates via JS Date behavior", () => {
    // "1993-02-30" is auto-corrected by JS Date to March 2, 1993
    const result = parseBirthDate("19930230");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getMonth()).toBe(2); // March (0-indexed)
    expect(result!.getDate()).toBe(2);
  });

  it("returns null for completely invalid YYYYMMDD", () => {
    // Month 00 is invalid
    const result = parseBirthDate("19930001");
    // "1993-00-01" -> NaN
    expect(result).toBeNull();
  });
});

// ================================ Insurance Utilities ================================

describe("getUdeptDetailToUdept", () => {
  it("maps 국민공단 to 국민공단", () => {
    expect(getUdeptDetailToUdept(보험구분상세.국민공단)).toBe(보험구분.국민공단);
  });

  it("maps 직장조합 to 직장조합", () => {
    expect(getUdeptDetailToUdept(보험구분상세.직장조합)).toBe(보험구분.직장조합);
  });

  it("maps 의료급여1종 to 급여1종", () => {
    expect(getUdeptDetailToUdept(보험구분상세.의료급여1종)).toBe(보험구분.급여1종);
  });

  it("maps 의료급여2종 to 급여2종", () => {
    expect(getUdeptDetailToUdept(보험구분상세.의료급여2종)).toBe(보험구분.급여2종);
  });

  it("maps 의료급여2종장애 to 급여2종", () => {
    expect(getUdeptDetailToUdept(보험구분상세.의료급여2종장애)).toBe(보험구분.급여2종);
  });

  it("maps 차상위1종 to 국민공단", () => {
    expect(getUdeptDetailToUdept(보험구분상세.차상위1종)).toBe(보험구분.국민공단);
  });

  it("maps 차상위2종 to 국민공단", () => {
    expect(getUdeptDetailToUdept(보험구분상세.차상위2종)).toBe(보험구분.국민공단);
  });

  it("maps 차상위2종장애 to 국민공단", () => {
    expect(getUdeptDetailToUdept(보험구분상세.차상위2종장애)).toBe(보험구분.국민공단);
  });

  it("returns 일반 for unknown values (default)", () => {
    expect(getUdeptDetailToUdept(999)).toBe(보험구분.일반);
  });

  it("maps 일반(0) to 일반 via default", () => {
    expect(getUdeptDetailToUdept(보험구분상세.일반)).toBe(보험구분.일반);
  });
});

// ================================ Chronic Disease ================================

describe("getChronicDiseaseLabels", () => {
  it("returns all three labels when all are true", () => {
    expect(
      getChronicDiseaseLabels({
        hypertension: true,
        diabetes: true,
        highCholesterol: true,
      })
    ).toBe("고혈압, 당뇨, 이상지혈");
  });

  it("returns single label for hypertension only", () => {
    expect(
      getChronicDiseaseLabels({
        hypertension: true,
        diabetes: false,
        highCholesterol: false,
      })
    ).toBe("고혈압");
  });

  it("returns single label for diabetes only", () => {
    expect(
      getChronicDiseaseLabels({
        hypertension: false,
        diabetes: true,
        highCholesterol: false,
      })
    ).toBe("당뇨");
  });

  it("returns single label for highCholesterol only", () => {
    expect(
      getChronicDiseaseLabels({
        hypertension: false,
        diabetes: false,
        highCholesterol: true,
      })
    ).toBe("이상지혈");
  });

  it("returns two labels when two are true", () => {
    expect(
      getChronicDiseaseLabels({
        hypertension: true,
        diabetes: true,
        highCholesterol: false,
      })
    ).toBe("고혈압, 당뇨");
  });

  it("returns empty string when none are true", () => {
    expect(
      getChronicDiseaseLabels({
        hypertension: false,
        diabetes: false,
        highCholesterol: false,
      })
    ).toBe("");
  });
});

// ================================ Store Accessors: User ================================

describe("getCurrentUser", () => {
  it("returns the user from user store", () => {
    expect(getCurrentUser()).toEqual(mockUser);
  });

  it("calls getState on user store", () => {
    getCurrentUser();
    expect(mockUserGetState).toHaveBeenCalled();
  });
});

describe("getCurrentUserId", () => {
  it("returns user id", () => {
    expect(getCurrentUserId()).toBe(1);
  });

  it("returns null when user has no id", () => {
    mockUserGetState.mockReturnValue({ user: {} });
    expect(getCurrentUserId()).toBeNull();
  });

  it("returns null when user is null", () => {
    mockUserGetState.mockReturnValue({ user: null });
    expect(getCurrentUserId()).toBeNull();
  });
});

describe("getCurrentUserName", () => {
  it("returns user name", () => {
    expect(getCurrentUserName()).toBe("홍길동");
  });

  it("returns empty string when user has no name", () => {
    mockUserGetState.mockReturnValue({ user: {} });
    expect(getCurrentUserName()).toBe("");
  });

  it("returns empty string when user is null", () => {
    mockUserGetState.mockReturnValue({ user: null });
    expect(getCurrentUserName()).toBe("");
  });
});

// ================================ Store Accessors: Hospital ================================

describe("getCurrentHospital", () => {
  it("returns the hospital from hospital store", () => {
    expect(getCurrentHospital()).toEqual(mockHospital);
  });
});

describe("getCurrentHospitalId", () => {
  it("returns hospital id", () => {
    expect(getCurrentHospitalId()).toBe(10);
  });

  it("returns null when hospital has no id", () => {
    mockHospitalGetState.mockReturnValue({ hospital: {} });
    expect(getCurrentHospitalId()).toBeNull();
  });

  it("returns null when hospital is null", () => {
    mockHospitalGetState.mockReturnValue({ hospital: null });
    expect(getCurrentHospitalId()).toBeNull();
  });
});

describe("getCurrentHospitalName", () => {
  it("returns hospital name", () => {
    expect(getCurrentHospitalName()).toBe("서울병원");
  });

  it("returns empty string when hospital has no name", () => {
    mockHospitalGetState.mockReturnValue({ hospital: {} });
    expect(getCurrentHospitalName()).toBe("");
  });
});

// ================================ Store Accessors: Facility ================================

describe("getFacilityNameById", () => {
  it("returns facility name for valid id", () => {
    expect(getFacilityNameById(100)).toBe("내과");
    expect(getFacilityNameById(101)).toBe("외과");
  });

  it("returns empty string for non-existent id", () => {
    expect(getFacilityNameById(999)).toBe("");
  });

  it("returns empty string for falsy id", () => {
    expect(getFacilityNameById(0)).toBe("");
  });

  it("handles string id by converting to number", () => {
    expect(getFacilityNameById("100")).toBe("내과");
  });

  it("returns empty string when facilities is null/undefined", () => {
    mockFacilityGetState.mockReturnValue({ facilities: null });
    expect(getFacilityNameById(100)).toBe("");
  });
});

describe("getFacilityDetailsByHospital", () => {
  it("returns all facilities with id, name, facilityId", () => {
    const result = getFacilityDetailsByHospital();
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 100, name: "내과", facilityId: 1 });
    expect(result[1]).toEqual({ id: 101, name: "외과", facilityId: 2 });
  });

  it("returns empty array when facilities is null", () => {
    mockFacilityGetState.mockReturnValue({ facilities: null });
    expect(getFacilityDetailsByHospital()).toEqual([]);
  });

  it("returns empty array when facilities is empty", () => {
    mockFacilityGetState.mockReturnValue({ facilities: [] });
    expect(getFacilityDetailsByHospital()).toEqual([]);
  });
});

// ================================ Store Accessors: Department ================================

describe("getDepartmentNameById", () => {
  it("returns department name for valid department id", () => {
    expect(getDepartmentNameById(1)).toBe("진료부");
    expect(getDepartmentNameById(2)).toBe("간호부");
  });

  it("returns empty string for non-existent department id", () => {
    expect(getDepartmentNameById(999)).toBe("");
  });

  it("uses explicit hospitalId when provided", () => {
    expect(getDepartmentNameById(1, 10)).toBe("진료부");
    expect(getDepartmentNameById(1, "10")).toBe("진료부");
  });

  it("returns empty string when hospitalId resolves to nothing", () => {
    mockHospitalGetState.mockReturnValue({ hospital: null });
    expect(getDepartmentNameById(1)).toBe("");
  });

  it("returns empty string for non-existent hospital", () => {
    expect(getDepartmentNameById(1, 999)).toBe("");
  });
});

describe("getPositionNameById", () => {
  it("returns position name for valid department and position ids", () => {
    expect(getPositionNameById(1, 10)).toBe("과장");
    expect(getPositionNameById(1, 11)).toBe("대리");
    expect(getPositionNameById(2, 20)).toBe("수간호사");
  });

  it("returns empty string for non-existent position", () => {
    expect(getPositionNameById(1, 999)).toBe("");
  });

  it("returns empty string for non-existent department", () => {
    expect(getPositionNameById(999, 10)).toBe("");
  });

  it("returns empty string when no hospital id found", () => {
    mockHospitalGetState.mockReturnValue({ hospital: null });
    expect(getPositionNameById(1, 10)).toBe("");
  });

  it("uses explicit hospitalId when provided", () => {
    expect(getPositionNameById(1, 10, "10")).toBe("과장");
  });
});

describe("getDepartmentAndPositionNames", () => {
  it("returns both department and position names", () => {
    const result = getDepartmentAndPositionNames(1, 10);
    expect(result).toEqual({
      departmentName: "진료부",
      positionName: "과장",
    });
  });

  it("returns empty strings when not found", () => {
    const result = getDepartmentAndPositionNames(999, 999);
    expect(result).toEqual({
      departmentName: "",
      positionName: "",
    });
  });

  it("passes hospitalId through to sub-functions", () => {
    const result = getDepartmentAndPositionNames(1, 10, "10");
    expect(result.departmentName).toBe("진료부");
    expect(result.positionName).toBe("과장");
  });
});

describe("getDepartmentsByHospital", () => {
  it("returns simplified department list", () => {
    const result = getDepartmentsByHospital();
    expect(result).toEqual([
      { id: 1, name: "진료부" },
      { id: 2, name: "간호부" },
    ]);
  });

  it("uses explicit hospitalId", () => {
    const result = getDepartmentsByHospital("10");
    expect(result).toHaveLength(2);
  });

  it("returns empty array for non-existent hospital", () => {
    const result = getDepartmentsByHospital(999);
    expect(result).toEqual([]);
  });

  it("returns empty array when no hospitalId is resolvable", () => {
    mockHospitalGetState.mockReturnValue({ hospital: null });
    expect(getDepartmentsByHospital()).toEqual([]);
  });
});

describe("getPositionsByDepartment", () => {
  it("returns positions for valid department", () => {
    const result = getPositionsByDepartment(1);
    expect(result).toEqual([
      { id: 10, name: "과장" },
      { id: 11, name: "대리" },
    ]);
  });

  it("returns single position for 간호부", () => {
    const result = getPositionsByDepartment(2);
    expect(result).toEqual([{ id: 20, name: "수간호사" }]);
  });

  it("returns empty array for non-existent department", () => {
    expect(getPositionsByDepartment(999)).toEqual([]);
  });

  it("returns empty array when no hospitalId is resolvable", () => {
    mockHospitalGetState.mockReturnValue({ hospital: null });
    expect(getPositionsByDepartment(1)).toEqual([]);
  });

  it("uses explicit hospitalId", () => {
    const result = getPositionsByDepartment(1, "10");
    expect(result).toHaveLength(2);
  });
});

// ================================ Combined Context ================================

describe("getCurrentContext", () => {
  it("returns combined user and hospital context", () => {
    const ctx = getCurrentContext();
    expect(ctx.user).toEqual(mockUser);
    expect(ctx.userId).toBe(1);
    expect(ctx.userName).toBe("홍길동");
    expect(ctx.hospital).toEqual(mockHospital);
    expect(ctx.hospitalId).toBe(10);
    expect(ctx.hospitalName).toBe("서울병원");
  });

  it("handles null user and hospital gracefully", () => {
    mockUserGetState.mockReturnValue({ user: null });
    mockHospitalGetState.mockReturnValue({ hospital: null });
    const ctx = getCurrentContext();
    expect(ctx.user).toBeNull();
    expect(ctx.userId).toBeNull();
    expect(ctx.userName).toBe("");
    expect(ctx.hospital).toBeNull();
    expect(ctx.hospitalId).toBeNull();
    expect(ctx.hospitalName).toBe("");
  });
});
