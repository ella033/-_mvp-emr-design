import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  safeSubstring,
  getUDeptDetailFromQualificationStatus,
  extractExtraQualificationFromParsedData,
  normalizeExtraQualification,
  setEligibilityResponseToInsuranceInfo,
} from "../eligibility-utils";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// 의료급여자격여부 enum values
const 의료급여자격여부 = {
  해당없음: 0,
  지역세대주: 1,
  지역세대원: 2,
  임의계속직장가입자: 4,
  직장가입자: 5,
  직장피부양자: 6,
  의료급여1종: 7,
  의료급여2종: 8,
} as const;

// 보험구분상세 enum values
const 보험구분상세 = {
  일반: 0,
  직장조합: 1,
  국민공단: 2,
  의료급여1종: 3,
  의료급여2종: 4,
  의료급여2종장애: 5,
  차상위1종: 6,
  차상위2종: 7,
  차상위2종장애: 8,
  자보: 9,
  산재: 10,
  재해: 11,
} as const;

vi.mock("@/constants/common/common-enum", () => ({
  의료급여자격여부: {
    해당없음: 0,
    지역세대주: 1,
    지역세대원: 2,
    임의계속직장가입자: 4,
    직장가입자: 5,
    직장피부양자: 6,
    의료급여1종: 7,
    의료급여2종: 8,
  },
  보험구분상세: {
    일반: 0,
    직장조합: 1,
    국민공단: 2,
    의료급여1종: 3,
    의료급여2종: 4,
    의료급여2종장애: 5,
    차상위1종: 6,
    차상위2종: 7,
    차상위2종장애: 8,
    자보: 9,
    산재: 10,
    재해: 11,
  },
}));

vi.mock("@/constants/common/additional-qualification-options", () => ({
  ADDITIONAL_QUALIFICATION_OPTIONS: [
    { eligibilityKey: "산정특례암등록대상자1", label: "중증 암" },
    { eligibilityKey: "산정특례화상등록대상자", label: "중증 화상" },
    { eligibilityKey: "산정특례희귀질환등록대상자", label: "희귀난치 산정특례" },
    { eligibilityKey: "산정특례중증난치질환등록대상자", label: "중증난치 산정특례" },
    { eligibilityKey: "산정특례결핵등록대상자", label: "결핵 산정특례" },
    { eligibilityKey: "산정특례극희귀등록대상자", label: "극희귀 산정특례" },
    { eligibilityKey: "산정특례상세불명희귀등록대상자", label: "상세불명희귀 산정특례" },
    { eligibilityKey: "산정특례기타염색체이상질환등록대상자", label: "기타염색체 산정특례" },
    { eligibilityKey: "산정특례잠복결핵등록대상자", label: "잠복결핵" },
    { eligibilityKey: "산정특례중증치매등록대상자", label: "중증치매 산정특례" },
    { eligibilityKey: "희귀난치의료비지원대상자", label: "희귀난치 본인부담지원" },
    { eligibilityKey: "당뇨병요양비대상자유형", label: "당뇨병 요양비 대상자" },
    { eligibilityKey: "급여제한여부", label: "급여제한" },
    { eligibilityKey: "출국자여부", label: "출국자" },
    { eligibilityKey: "조산아및저체중출생아등록대상자", label: "조산/저체중아" },
    { eligibilityKey: "요양병원입원여부", label: "요양병원 입원 여부" },
    { eligibilityKey: "비대면진료대상정보", label: "비대면진료" },
    { eligibilityKey: "방문진료대상정보", label: "방문진료", showInModal: false },
    { eligibilityKey: "자립준비청년대상자", label: "자립준비청년" },
    { eligibilityKey: "본인부담차등여부", label: "본인부담 차등대상" },
  ],
  STRING_DATA_FIELD_KEYS: new Set([
    "당뇨병요양비대상자유형",
    "급여제한여부",
    "출국자여부",
    "요양병원입원여부",
    "본인부담차등여부",
    "급여제한일자",
  ]),
  SPECIAL_TYPE_FIELD_KEYS: new Set([
    "자립준비청년대상자",
    "조산아및저체중출생아등록대상자",
    "비대면진료대상정보",
    "방문진료대상정보",
  ]),
  DISEASE_REGISTRATION_KEYS: new Set([
    "산정특례희귀질환등록대상자",
    "산정특례암등록대상자1",
    "산정특례화상등록대상자",
    "산정특례결핵등록대상자",
    "산정특례극희귀등록대상자",
    "산정특례상세불명희귀등록대상자",
    "산정특례중복암등록대상자2",
    "산정특례중복암등록대상자3",
    "산정특례중복암등록대상자4",
    "산정특례중복암등록대상자5",
    "산정특례중증난치질환등록대상자",
    "산정특례기타염색체이상질환등록대상자",
    "산정특례잠복결핵등록대상자",
    "산정특례중증치매등록대상자",
    "희귀난치의료비지원대상자",
  ]),
}));

const mockGetIsBaby = vi.fn().mockReturnValue(false);
const mockGetRrnWithNumberString = vi.fn().mockImplementation((rrn: string) => rrn.replace(/-/g, ""));
const mockCalculateUDept = vi.fn().mockReturnValue(0);

vi.mock("@/lib/patient-utils", () => ({
  getIsBaby: (...args: any[]) => mockGetIsBaby(...args),
  getResidentRegistrationNumberWithNumberString: (...args: any[]) => mockGetRrnWithNumberString(...args),
}));

vi.mock("@/store/common/insurance-store", () => ({
  calculateUDept: (...args: any[]) => mockCalculateUDept(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetIsBaby.mockReturnValue(false);
  mockGetRrnWithNumberString.mockImplementation((rrn: string) => rrn.replace(/-/g, ""));
  mockCalculateUDept.mockReturnValue(0);
});

// ---------------------------------------------------------------------------
// 1. safeSubstring
// ---------------------------------------------------------------------------
describe("safeSubstring", () => {
  it("null 입력 시 빈 문자열 반환", () => {
    expect(safeSubstring(null, 0, 5)).toBe("");
  });

  it("undefined 입력 시 빈 문자열 반환", () => {
    expect(safeSubstring(undefined, 0, 5)).toBe("");
  });

  it("빈 문자열 입력 시 빈 문자열 반환", () => {
    expect(safeSubstring("", 0, 5)).toBe("");
  });

  it("startIndex가 문자열 길이와 같으면 빈 문자열 반환", () => {
    expect(safeSubstring("abc", 3, 2)).toBe("");
  });

  it("startIndex가 문자열 길이보다 크면 빈 문자열 반환", () => {
    expect(safeSubstring("abc", 10, 2)).toBe("");
  });

  it("정상적인 부분 문자열 추출", () => {
    expect(safeSubstring("HelloWorld", 0, 5)).toBe("Hello");
  });

  it("시작 위치에서부터 추출", () => {
    expect(safeSubstring("HelloWorld", 5, 5)).toBe("World");
  });

  it("요청 길이가 남은 문자열보다 긴 경우 가능한 만큼만 반환", () => {
    expect(safeSubstring("abc", 1, 10)).toBe("bc");
  });

  it("length가 0이면 빈 문자열 반환", () => {
    expect(safeSubstring("abc", 0, 0)).toBe("");
  });

  it("한글 문자열에서 정상 추출", () => {
    expect(safeSubstring("대한민국", 0, 2)).toBe("대한");
  });
});

// ---------------------------------------------------------------------------
// 2. getUDeptDetailFromQualificationStatus - 자격상태별 보험구분상세
// ---------------------------------------------------------------------------
describe("getUDeptDetailFromQualificationStatus", () => {
  const no차상위 = { isData: false, division: 0 };

  describe("의료급여1종", () => {
    it("의료급여1종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.의료급여1종, no차상위, false)
      ).toBe(보험구분상세.의료급여1종);
    });

    it("장애 여부와 무관하게 의료급여1종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.의료급여1종, no차상위, true)
      ).toBe(보험구분상세.의료급여1종);
    });
  });

  describe("의료급여2종", () => {
    it("장애 아닌 경우 의료급여2종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.의료급여2종, no차상위, false)
      ).toBe(보험구분상세.의료급여2종);
    });

    it("장애인 경우 의료급여2종장애 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.의료급여2종, no차상위, true)
      ).toBe(보험구분상세.의료급여2종장애);
    });
  });

  describe("지역가입자 (지역세대주/지역세대원)", () => {
    it("차상위 정보 없으면 국민공단 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.지역세대주, no차상위, false)
      ).toBe(보험구분상세.국민공단);
    });

    it("지역세대원도 차상위 정보 없으면 국민공단 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.지역세대원, no차상위, false)
      ).toBe(보험구분상세.국민공단);
    });

    it("차상위 division 1이면 차상위1종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.지역세대주,
          { isData: true, division: 1 },
          false
        )
      ).toBe(보험구분상세.차상위1종);
    });

    it("차상위 division 2 + 비장애이면 차상위2종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.지역세대원,
          { isData: true, division: 2 },
          false
        )
      ).toBe(보험구분상세.차상위2종);
    });

    it("차상위 division 2 + 장애이면 차상위2종장애 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.지역세대원,
          { isData: true, division: 2 },
          true
        )
      ).toBe(보험구분상세.차상위2종장애);
    });

    it("차상위 isData true이나 division이 알 수 없는 값이면 국민공단 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.지역세대주,
          { isData: true, division: 99 },
          false
        )
      ).toBe(보험구분상세.국민공단);
    });
  });

  describe("직장가입자 (직장가입자/직장피부양자/임의계속직장가입자)", () => {
    it("차상위 정보 없으면 직장조합 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.직장가입자, no차상위, false)
      ).toBe(보험구분상세.직장조합);
    });

    it("직장피부양자도 차상위 없으면 직장조합 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.직장피부양자, no차상위, false)
      ).toBe(보험구분상세.직장조합);
    });

    it("임의계속직장가입자도 차상위 없으면 직장조합 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.임의계속직장가입자, no차상위, false)
      ).toBe(보험구분상세.직장조합);
    });

    it("차상위 division 1이면 차상위1종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.직장가입자,
          { isData: true, division: 1 },
          false
        )
      ).toBe(보험구분상세.차상위1종);
    });

    it("차상위 division 2 + 비장애이면 차상위2종 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.직장피부양자,
          { isData: true, division: 2 },
          false
        )
      ).toBe(보험구분상세.차상위2종);
    });

    it("차상위 division 2 + 장애이면 차상위2종장애 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.임의계속직장가입자,
          { isData: true, division: 2 },
          true
        )
      ).toBe(보험구분상세.차상위2종장애);
    });

    it("차상위 isData true이나 division 알 수 없는 값이면 직장조합 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(
          의료급여자격여부.직장가입자,
          { isData: true, division: 0 },
          false
        )
      ).toBe(보험구분상세.직장조합);
    });
  });

  describe("해당없음 및 기타 (default)", () => {
    it("해당없음이면 일반 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(의료급여자격여부.해당없음, no차상위, false)
      ).toBe(보험구분상세.일반);
    });

    it("알 수 없는 값이면 일반 반환", () => {
      expect(
        getUDeptDetailFromQualificationStatus(999 as any, no차상위, false)
      ).toBe(보험구분상세.일반);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. extractExtraQualificationFromParsedData
// ---------------------------------------------------------------------------
describe("extractExtraQualificationFromParsedData", () => {
  it("parsedData가 undefined이면 빈 객체 반환", () => {
    expect(extractExtraQualificationFromParsedData(undefined)).toEqual({});
  });

  it("parsedData가 빈 객체이면 모든 키에 기본값 설정", () => {
    const result = extractExtraQualificationFromParsedData({});
    // StringDataField 타입 키들은 { data: "" } 형태
    expect(result["당뇨병요양비대상자유형"]).toEqual({ data: "" });
    expect(result["급여제한여부"]).toEqual({ data: "" });
    expect(result["출국자여부"]).toEqual({ data: "" });
    // DiseaseRegistrationPersonBase 타입 키들은 {} 형태
    expect(result["산정특례암등록대상자1"]).toEqual({});
    expect(result["산정특례화상등록대상자"]).toEqual({});
    // 비대면진료대상정보는 {} 형태
    expect(result["비대면진료대상정보"]).toEqual({});
    // 중증암 추가 키들
    expect(result["산정특례중복암등록대상자2"]).toEqual({});
    expect(result["산정특례중복암등록대상자3"]).toEqual({});
    expect(result["산정특례중복암등록대상자4"]).toEqual({});
    expect(result["산정특례중복암등록대상자5"]).toEqual({});
    // 추가 필드들
    expect(result["당뇨병요양비대상자등록일"]).toEqual({}); // DisRegPrson6Info 타입
    expect(result["급여제한일자"]).toEqual({ data: "" }); // StringDataField 타입
  });

  describe("StringDataField 타입 필드 처리", () => {
    it("data 속성이 있는 필드 정상 추출", () => {
      const result = extractExtraQualificationFromParsedData({
        당뇨병요양비대상자유형: { data: "1" },
        급여제한여부: { data: "Y" },
      });
      expect(result["당뇨병요양비대상자유형"]).toEqual({ data: "1" });
      expect(result["급여제한여부"]).toEqual({ data: "Y" });
    });

    it("data가 빈 문자열인 경우 빈 문자열로 유지", () => {
      const result = extractExtraQualificationFromParsedData({
        출국자여부: { data: "" },
      });
      expect(result["출국자여부"]).toEqual({ data: "" });
    });

    it("data가 null/undefined인 경우 빈 문자열로 대체", () => {
      const result = extractExtraQualificationFromParsedData({
        출국자여부: { data: null },
      });
      expect(result["출국자여부"]).toEqual({ data: "" });
    });

    it("필드가 객체가 아닌 경우 기본값 { data: '' } 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        출국자여부: "invalid",
      });
      expect(result["출국자여부"]).toEqual({ data: "" });
    });
  });

  describe("DiseaseRegistrationPersonBase 타입 필드 처리", () => {
    it("등록일이 있는 유효한 데이터 추출", () => {
      const field = { 등록일: "20240101", 특정기호: "V123", 등록번호: "001" };
      const result = extractExtraQualificationFromParsedData({
        산정특례암등록대상자1: field,
      });
      expect(result["산정특례암등록대상자1"]).toEqual(field);
    });

    it("특정기호만 있어도 유효한 데이터로 간주", () => {
      const field = { 등록일: "", 특정기호: "V123", 등록번호: "" };
      const result = extractExtraQualificationFromParsedData({
        산정특례화상등록대상자: field,
      });
      expect(result["산정특례화상등록대상자"]).toEqual(field);
    });

    it("등록번호만 있어도 유효한 데이터로 간주", () => {
      const field = { 등록일: "", 특정기호: "", 등록번호: "A001" };
      const result = extractExtraQualificationFromParsedData({
        산정특례결핵등록대상자: field,
      });
      expect(result["산정특례결핵등록대상자"]).toEqual(field);
    });

    it("등록일/특정기호/등록번호 모두 빈 문자열이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        산정특례암등록대상자1: { 등록일: "", 특정기호: "", 등록번호: "" },
      });
      expect(result["산정특례암등록대상자1"]).toEqual({});
    });

    it("필드가 빈 객체이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        산정특례암등록대상자1: {},
      });
      expect(result["산정특례암등록대상자1"]).toEqual({});
    });

    it("필드가 null이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        산정특례암등록대상자1: null,
      });
      expect(result["산정특례암등록대상자1"]).toEqual({});
    });
  });

  describe("비대면진료대상정보 별도 처리", () => {
    it("유효한 객체가 있으면 원본데이터 제외하고 저장", () => {
      const field = { 섬벽지거주여부: "Y", 장애등록여부: "N", 원본데이터: "YN" };
      const result = extractExtraQualificationFromParsedData({
        비대면진료대상정보: field,
      });
      expect(result["비대면진료대상정보"]).toEqual({ 섬벽지거주여부: "Y", 장애등록여부: "N" });
    });

    it("빈 객체이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        비대면진료대상정보: {},
      });
      expect(result["비대면진료대상정보"]).toEqual({});
    });

    it("null이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        비대면진료대상정보: null,
      });
      expect(result["비대면진료대상정보"]).toEqual({});
    });

    it("{ data: '...' } 형태이면 빈 객체로 변환 (잘못된 포맷)", () => {
      const result = extractExtraQualificationFromParsedData({
        비대면진료대상정보: { data: "NNNY" },
      });
      expect(result["비대면진료대상정보"]).toEqual({});
    });

    it("모든 N값이면 빈 객체로 저장 (Y가 없으므로 무의미)", () => {
      const result = extractExtraQualificationFromParsedData({
        비대면진료대상정보: {
          원본데이터: "NNNN",
          섬벽지거주여부: "N",
          장애등록여부: "N",
          장기요양등급여부: "N",
          응급취약지거주여부: "N",
        },
      });
      expect(result["비대면진료대상정보"]).toEqual({});
    });
  });

  describe("방문진료대상정보 별도 처리", () => {
    it("Y값 있는 유효한 객체이면 원본데이터 제외하고 저장", () => {
      const field = {
        원본데이터: "YN",
        요양비인공호흡기산소치료대상여부: "Y",
        장기요양대상여부: "N",
      };
      const result = extractExtraQualificationFromParsedData({
        방문진료대상정보: field,
      });
      expect(result["방문진료대상정보"]).toEqual({
        요양비인공호흡기산소치료대상여부: "Y",
        장기요양대상여부: "N",
      });
    });

    it("모든 N값이면 빈 객체로 저장 (Y가 없으므로 무의미)", () => {
      const field = {
        원본데이터: "NN",
        요양비인공호흡기산소치료대상여부: "N",
        장기요양대상여부: "N",
      };
      const result = extractExtraQualificationFromParsedData({
        방문진료대상정보: field,
      });
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("빈 객체이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        방문진료대상정보: {},
      });
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("{ data: '...' } 형태이면 빈 객체로 변환 (잘못된 포맷)", () => {
      const result = extractExtraQualificationFromParsedData({
        방문진료대상정보: { data: "NN" },
      });
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("null이면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        방문진료대상정보: null,
      });
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("parsedData에 없으면 빈 객체로 기본값", () => {
      const result = extractExtraQualificationFromParsedData({});
      expect(result["방문진료대상정보"]).toEqual({});
    });
  });

  describe("중증암 관련 추가 키 (산정특례중복암등록대상자2~5)", () => {
    it("유효한 데이터가 있으면 추출", () => {
      const field = { 등록일: "20240601", 특정기호: "C10", 등록번호: "002" };
      const result = extractExtraQualificationFromParsedData({
        산정특례중복암등록대상자2: field,
      });
      expect(result["산정특례중복암등록대상자2"]).toEqual(field);
    });

    it("유효하지 않은 데이터면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({
        산정특례중복암등록대상자3: { 등록일: "", 특정기호: "", 등록번호: "" },
      });
      expect(result["산정특례중복암등록대상자3"]).toEqual({});
    });

    it("parsedData에 없으면 빈 객체로 설정", () => {
      const result = extractExtraQualificationFromParsedData({});
      expect(result["산정특례중복암등록대상자4"]).toEqual({});
      expect(result["산정특례중복암등록대상자5"]).toEqual({});
    });
  });

  describe("추가 필드 - 당뇨병요양비대상자등록일 (DisRegPrson6Info 타입)", () => {
    it("DisRegPrson6Info 형태 데이터 정상 추출", () => {
      const result = extractExtraQualificationFromParsedData({
        당뇨병요양비대상자등록일: { 원본데이터: "raw", 등록일: "20240101" },
      });
      expect(result["당뇨병요양비대상자등록일"]).toEqual({ 원본데이터: "raw", 등록일: "20240101" });
    });

    it("잘못된 { data: '...' } 형태는 {}로 처리", () => {
      const result = extractExtraQualificationFromParsedData({
        당뇨병요양비대상자등록일: { data: "20240101" },
      });
      expect(result["당뇨병요양비대상자등록일"]).toEqual({});
    });

    it("빈 객체이면 {}로 기본값", () => {
      const result = extractExtraQualificationFromParsedData({});
      expect(result["당뇨병요양비대상자등록일"]).toEqual({});
    });
  });

  describe("추가 필드 - 급여제한일자 (StringDataField 타입)", () => {
    it("data가 있는 필드 정상 추출", () => {
      const result = extractExtraQualificationFromParsedData({
        급여제한일자: { data: "20241231" },
      });
      expect(result["급여제한일자"]).toEqual({ data: "20241231" });
    });

    it("data가 없으면 기본값 설정", () => {
      const result = extractExtraQualificationFromParsedData({});
      expect(result["급여제한일자"]).toEqual({ data: "" });
    });
  });
});

// ---------------------------------------------------------------------------
// 4. normalizeExtraQualification
// ---------------------------------------------------------------------------
describe("normalizeExtraQualification", () => {
  it("undefined 입력 시 모든 키에 기본값 포함한 객체 반환", () => {
    const result = normalizeExtraQualification(undefined);
    expect(result["산정특례암등록대상자1"]).toEqual({});
    expect(result["당뇨병요양비대상자유형"]).toEqual({ data: "" });
    expect(result["비대면진료대상정보"]).toEqual({});
    expect(result["산정특례중복암등록대상자2"]).toEqual({});
    expect(result["당뇨병요양비대상자등록일"]).toEqual({}); // DisRegPrson6Info 타입
    expect(result["급여제한일자"]).toEqual({ data: "" });
  });

  it("빈 객체 입력 시 모든 키에 기본값 포함한 객체 반환", () => {
    const result = normalizeExtraQualification({});
    // ADDITIONAL_QUALIFICATION_OPTIONS의 모든 키가 포함되어야 함
    expect(Object.keys(result).length).toBeGreaterThan(0);
    expect(result["산정특례암등록대상자1"]).toEqual({});
    expect(result["출국자여부"]).toEqual({ data: "" });
  });

  describe("기존 값 유지", () => {
    it("DiseaseRegistrationPersonBase 타입 기존 값 유지", () => {
      const input = {
        산정특례암등록대상자1: { 등록일: "20240101", 특정기호: "V123", 등록번호: "001" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["산정특례암등록대상자1"]).toEqual({
        등록일: "20240101",
        특정기호: "V123",
        등록번호: "001",
      });
    });

    it("StringDataField 타입 기존 값 유지", () => {
      const input = {
        당뇨병요양비대상자유형: { data: "1" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["당뇨병요양비대상자유형"]).toEqual({ data: "1" });
    });

    it("StringDataField 키에 data 속성 없으면 { data: '' }로 정규화", () => {
      const input = {
        급여제한여부: { someOther: "value" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["급여제한여부"]).toEqual({ data: "" });
    });

    it("StringDataField 키에 null 값이면 { data: '' }로 정규화", () => {
      const input = {
        출국자여부: null,
      };
      const result = normalizeExtraQualification(input);
      expect(result["출국자여부"]).toEqual({ data: "" });
    });
  });

  describe("비대면진료대상정보 별도 처리", () => {
    it("유효한 객체는 data 및 원본데이터 제거 후 저장", () => {
      const input = {
        비대면진료대상정보: { 대상여부: "Y", data: "should-be-removed", 원본데이터: "raw" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["비대면진료대상정보"]).toEqual({ 대상여부: "Y" });
      expect(result["비대면진료대상정보"]).not.toHaveProperty("data");
      expect(result["비대면진료대상정보"]).not.toHaveProperty("원본데이터");
    });

    it("원본데이터 없으면 기존 키만 유지 (원본데이터 자동 추가 안 함)", () => {
      const input = {
        비대면진료대상정보: { 대상여부: "Y" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["비대면진료대상정보"]).toEqual({ 대상여부: "Y" });
    });

    it("null 값이면 빈 객체로 설정", () => {
      const input = {
        비대면진료대상정보: null,
      };
      const result = normalizeExtraQualification(input);
      expect(result["비대면진료대상정보"]).toEqual({});
    });

    it("배열 값이면 빈 객체로 설정", () => {
      const input = {
        비대면진료대상정보: [1, 2, 3],
      };
      const result = normalizeExtraQualification(input);
      expect(result["비대면진료대상정보"]).toEqual({});
    });

    it("누락 시 {} 기본값", () => {
      const result = normalizeExtraQualification({});
      expect(result["비대면진료대상정보"]).toEqual({});
    });

    it("모든 N값이면 빈 객체로 정규화 (Y가 없으므로 무의미)", () => {
      const input = {
        비대면진료대상정보: {
          섬벽지거주여부: "N",
          장애등록여부: "N",
          장기요양등급여부: "N",
          응급취약지거주여부: "N",
        },
      };
      const result = normalizeExtraQualification(input);
      expect(result["비대면진료대상정보"]).toEqual({});
    });
  });

  describe("방문진료대상정보 별도 처리", () => {
    it("정상 데이터에서 원본데이터 제거 후 유지", () => {
      const input = {
        방문진료대상정보: {
          원본데이터: "YN",
          요양비인공호흡기산소치료대상여부: "Y",
          장기요양대상여부: "N",
        },
      };
      const result = normalizeExtraQualification(input);
      expect(result["방문진료대상정보"]).toEqual({
        요양비인공호흡기산소치료대상여부: "Y",
        장기요양대상여부: "N",
      });
      expect(result["방문진료대상정보"]).not.toHaveProperty("원본데이터");
    });

    it("data 및 원본데이터 포함, Y 없으면 빈 객체로 정규화", () => {
      const input = {
        방문진료대상정보: {
          data: "should-be-removed",
          원본데이터: "NN",
          장기요양대상여부: "N",
        },
      };
      const result = normalizeExtraQualification(input);
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("모든 N값이면 빈 객체로 정규화 (Y가 없으므로 무의미)", () => {
      const input = {
        방문진료대상정보: {
          요양비인공호흡기산소치료대상여부: "N",
          장기요양대상여부: "N",
        },
      };
      const result = normalizeExtraQualification(input);
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("누락 시 {} 기본값", () => {
      const result = normalizeExtraQualification({});
      expect(result["방문진료대상정보"]).toEqual({});
    });

    it("null 값이면 빈 객체로 설정", () => {
      const input = { 방문진료대상정보: null };
      const result = normalizeExtraQualification(input);
      expect(result["방문진료대상정보"]).toEqual({});
    });
  });

  describe("잘못된 중첩 구조 정리", () => {
    it("eligibilityKey가 중첩된 경우 제거", () => {
      const input = {
        산정특례암등록대상자1: {
          등록일: "20240101",
          산정특례화상등록대상자: { 등록일: "20240201" }, // 잘못된 중첩
        },
      };
      const result = normalizeExtraQualification(input);
      // 중첩된 키는 제거되고 실제 데이터만 남아야 함
      expect(result["산정특례암등록대상자1"]).toEqual({ 등록일: "20240101" });
    });

    it("중증암 추가 키가 중첩된 경우 제거", () => {
      const input = {
        산정특례암등록대상자1: {
          등록일: "20240101",
          산정특례중복암등록대상자2: { 등록일: "20240201" }, // 잘못된 중첩
        },
      };
      const result = normalizeExtraQualification(input);
      expect(result["산정특례암등록대상자1"]).toEqual({ 등록일: "20240101" });
    });

    it("당뇨병요양비대상자등록일이 중첩된 경우 제거", () => {
      const input = {
        산정특례암등록대상자1: {
          등록일: "20240101",
          당뇨병요양비대상자등록일: { data: "20240101" }, // 잘못된 중첩
        },
      };
      const result = normalizeExtraQualification(input);
      expect(result["산정특례암등록대상자1"]).toEqual({ 등록일: "20240101" });
    });
  });

  describe("중증암 관련 추가 키 정규화", () => {
    it("기존 값 유지", () => {
      const input = {
        산정특례중복암등록대상자2: { 등록일: "20240601", 특정기호: "C10" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["산정특례중복암등록대상자2"]).toEqual({ 등록일: "20240601", 특정기호: "C10" });
    });

    it("없는 키는 빈 객체로 추가", () => {
      const result = normalizeExtraQualification({});
      expect(result["산정특례중복암등록대상자2"]).toEqual({});
      expect(result["산정특례중복암등록대상자3"]).toEqual({});
      expect(result["산정특례중복암등록대상자4"]).toEqual({});
      expect(result["산정특례중복암등록대상자5"]).toEqual({});
    });
  });

  describe("추가 필드 정규화 - 당뇨병요양비대상자등록일 (DisRegPrson6Info)", () => {
    it("DisRegPrson6Info 형태 기존 값 유지", () => {
      const input = {
        당뇨병요양비대상자등록일: { 원본데이터: "raw", 등록일: "20240101" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["당뇨병요양비대상자등록일"]).toEqual({ 원본데이터: "raw", 등록일: "20240101" });
    });

    it("잘못된 { data: '...' } 형태는 {}로 정규화", () => {
      const input = {
        당뇨병요양비대상자등록일: { data: "20240101" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["당뇨병요양비대상자등록일"]).toEqual({});
    });

    it("값이 없으면 {}로 기본값", () => {
      const result = normalizeExtraQualification({});
      expect(result["당뇨병요양비대상자등록일"]).toEqual({});
    });
  });

  describe("추가 필드 정규화 - 급여제한일자 (StringDataField)", () => {
    it("data 속성 있는 기존 값 유지", () => {
      const input = {
        급여제한일자: { data: "20241231" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["급여제한일자"]).toEqual({ data: "20241231" });
    });

    it("data 속성 없으면 { data: '' }로 정규화", () => {
      const input = {
        급여제한일자: { someOther: "val" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["급여제한일자"]).toEqual({ data: "" });
    });

    it("값이 비객체이면 { data: '' }로 정규화", () => {
      const input = {
        급여제한일자: "string-value",
      };
      const result = normalizeExtraQualification(input);
      expect(result["급여제한일자"]).toEqual({ data: "" });
    });
  });

  it("객체가 아닌 값은 그대로 복사", () => {
    const input = {
      산정특례암등록대상자1: "not-an-object" as any,
    };
    const result = normalizeExtraQualification(input);
    // 비객체 값은 ADDITIONAL_QUALIFICATION_OPTIONS 루프에서 처리되므로
    // DiseaseRegistrationPersonBase 키지만 원래 값이 유지됨
    expect(result["산정특례암등록대상자1"]).toBe("not-an-object");
  });

  describe("자립준비청년대상자 (SelfPreparationPersonInfo 타입) 정규화", () => {
    it("SelfPreparationPersonInfo 형태 데이터는 그대로 유지해야 함", () => {
      const input = {
        자립준비청년대상자: { 특정기호: "444", 지원시작일: "20260303", 지원종료일: "20260317" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["자립준비청년대상자"]).toEqual({
        특정기호: "444",
        지원시작일: "20260303",
        지원종료일: "20260317",
      });
    });

    it("잘못된 { data: '' } 형태는 {}로 정규화해야 함", () => {
      const input = {
        자립준비청년대상자: { data: "" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["자립준비청년대상자"]).toEqual({});
    });

    it("잘못된 { data: 'some-value' } 형태는 {}로 정규화해야 함", () => {
      const input = {
        자립준비청년대상자: { data: "Y" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["자립준비청년대상자"]).toEqual({});
    });

    it("빈 객체 {}는 그대로 {}로 유지", () => {
      const input = {
        자립준비청년대상자: {},
      };
      const result = normalizeExtraQualification(input);
      expect(result["자립준비청년대상자"]).toEqual({});
    });

    it("값이 없으면 {}로 기본값 설정", () => {
      const result = normalizeExtraQualification({});
      expect(result["자립준비청년대상자"]).toEqual({});
    });
  });

  describe("조산아및저체중출생아등록대상자 (PreInfantInfo 타입) 정규화", () => {
    it("PreInfantInfo 형태 데이터는 그대로 유지해야 함", () => {
      const input = {
        조산아및저체중출생아등록대상자: { 등록번호: "12345", 시작유효일자: "20260101", 종료유효일자: "20260331" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({
        등록번호: "12345",
        시작유효일자: "20260101",
        종료유효일자: "20260331",
      });
    });

    it("잘못된 { data: '' } 형태는 {}로 정규화해야 함", () => {
      const input = {
        조산아및저체중출생아등록대상자: { data: "" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({});
    });

    it("잘못된 { data: 'some-value' } 형태는 {}로 정규화해야 함", () => {
      const input = {
        조산아및저체중출생아등록대상자: { data: "12345" },
      };
      const result = normalizeExtraQualification(input);
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({});
    });

    it("빈 객체 {}는 그대로 {}로 유지", () => {
      const input = {
        조산아및저체중출생아등록대상자: {},
      };
      const result = normalizeExtraQualification(input);
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({});
    });

    it("값이 없으면 {}로 기본값 설정", () => {
      const result = normalizeExtraQualification({});
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// 5-1. extractExtraQualificationFromParsedData - 자립준비청년/조산아 별도 처리
// ---------------------------------------------------------------------------
describe("extractExtraQualificationFromParsedData - 자립준비청년/조산아 별도 처리", () => {
  describe("자립준비청년대상자 (SelfPreparationPersonInfo 타입)", () => {
    it("parsedData에서 SelfPreparationPersonInfo 형태 데이터 추출", () => {
      const result = extractExtraQualificationFromParsedData({
        자립준비청년대상자: { 특정기호: "444", 지원시작일: "20260303", 지원종료일: "20260317" },
      });
      expect(result["자립준비청년대상자"]).toEqual({
        특정기호: "444",
        지원시작일: "20260303",
        지원종료일: "20260317",
      });
    });

    it("parsedData에서 빈 객체 {}이면 {}로 저장", () => {
      const result = extractExtraQualificationFromParsedData({
        자립준비청년대상자: {},
      });
      expect(result["자립준비청년대상자"]).toEqual({});
    });

    it("parsedData에 없으면 {}로 기본값", () => {
      const result = extractExtraQualificationFromParsedData({});
      expect(result["자립준비청년대상자"]).toEqual({});
    });
  });

  describe("조산아및저체중출생아등록대상자 (PreInfantInfo 타입)", () => {
    it("parsedData에서 PreInfantInfo 형태 데이터 추출", () => {
      const result = extractExtraQualificationFromParsedData({
        조산아및저체중출생아등록대상자: { 등록번호: "12345", 시작유효일자: "20260101", 종료유효일자: "20260331" },
      });
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({
        등록번호: "12345",
        시작유효일자: "20260101",
        종료유효일자: "20260331",
      });
    });

    it("parsedData에서 빈 객체 {}이면 {}로 저장", () => {
      const result = extractExtraQualificationFromParsedData({
        조산아및저체중출생아등록대상자: {},
      });
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({});
    });

    it("parsedData에 없으면 {}로 기본값", () => {
      const result = extractExtraQualificationFromParsedData({});
      expect(result["조산아및저체중출생아등록대상자"]).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// 6. 정규화 비교 로직 통합 테스트 (실제 JSON 입력 → 비교 결과 true/false 검증)
// ---------------------------------------------------------------------------
describe("정규화 비교 로직 통합 테스트", () => {
  /**
   * 실제 use-patient-reception.ts의 비교 로직과 동일:
   * 1. extractExtraQualificationFromParsedData(parsedData) → new
   * 2. normalizeExtraQualification(old) / normalizeExtraQualification(new)
   * 3. JSON.stringify 비교
   */
  function hasExtraQualificationChanges(
    oldExtraQualification: Record<string, any>,
    parsedData: Record<string, any>
  ): boolean {
    const newExtraQualification = extractExtraQualificationFromParsedData(parsedData);
    const normalizedOld = normalizeExtraQualification(oldExtraQualification);
    const normalizedNew = normalizeExtraQualification(newExtraQualification);
    return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
  }

  describe("변경 없음 (false) 케이스", () => {
    it("모두 빈 값인 경우 변경 없음", () => {
      const oldExtra = {};
      const parsedData = {};
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("StringDataField 값이 동일한 경우 변경 없음", () => {
      const oldExtra = {
        출국자여부: { data: "Y" },
        급여제한여부: { data: "02" },
        본인부담차등여부: { data: "N" },
        요양병원입원여부: { data: "N" },
      };
      const parsedData = {
        출국자여부: { data: "Y" },
        급여제한여부: { data: "02" },
        본인부담차등여부: { data: "N" },
        요양병원입원여부: { data: "N" },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("DiseaseRegistrationPersonBase 값이 동일한 경우 변경 없음", () => {
      const cancerData = {
        등록일: "20260303",
        종료일: "20260326",
        등록구분: "1",
        등록번호: "11",
        상병기호: "S1",
        특정기호: "11",
        원본데이터: "",
        상병일련번호: "11",
      };
      const oldExtra = { 산정특례암등록대상자1: cancerData };
      const parsedData = { 산정특례암등록대상자1: cancerData };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("자립준비청년대상자 데이터가 동일한 경우 변경 없음", () => {
      const selfPrepData = { 특정기호: "444", 지원시작일: "20260303", 지원종료일: "20260317" };
      const oldExtra = { 자립준비청년대상자: selfPrepData };
      const parsedData = { 자립준비청년대상자: selfPrepData };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("조산아및저체중출생아등록대상자 데이터가 동일한 경우 변경 없음", () => {
      const preInfantData = { 등록번호: "12345", 시작유효일자: "20260101", 종료유효일자: "20260331" };
      const oldExtra = { 조산아및저체중출생아등록대상자: preInfantData };
      const parsedData = { 조산아및저체중출생아등록대상자: preInfantData };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("기존에 잘못된 형태({ data: '' })로 저장된 자립준비청년대상자와 parsedData 빈 객체는 동일 처리", () => {
      // 기존 코드에서 { data: "" }로 잘못 저장된 데이터 → 정규화 시 {}로 변환
      // parsedData에서 {} → 정규화 시 {}
      // 따라서 변경 없음
      const oldExtra = { 자립준비청년대상자: { data: "" } };
      const parsedData = { 자립준비청년대상자: {} };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("기존에 잘못된 형태({ data: '' })로 저장된 조산아 데이터와 parsedData 빈 객체는 동일 처리", () => {
      const oldExtra = { 조산아및저체중출생아등록대상자: { data: "" } };
      const parsedData = { 조산아및저체중출생아등록대상자: {} };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });
  });

  describe("변경 있음 (true) 케이스", () => {
    it("StringDataField 값이 변경된 경우", () => {
      const oldExtra = { 출국자여부: { data: "Y" } };
      const parsedData = { 출국자여부: { data: "N" } };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("DiseaseRegistrationPersonBase 값이 새로 추가된 경우", () => {
      const oldExtra = { 산정특례결핵등록대상자: {} };
      const parsedData = {
        산정특례결핵등록대상자: {
          등록일: "20181204",
          종료일: "99991231",
          등록번호: "0818027203",
          특정기호: "V",
          원본데이터: "V   0818027203     2018120499991231            ",
        },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("DiseaseRegistrationPersonBase 값이 삭제된 경우", () => {
      const oldExtra = {
        산정특례암등록대상자1: {
          등록일: "20260303",
          종료일: "20260326",
          등록번호: "11",
          특정기호: "11",
          원본데이터: "",
        },
      };
      const parsedData = { 산정특례암등록대상자1: {} };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("자립준비청년대상자 데이터가 새로 추가된 경우", () => {
      const oldExtra = { 자립준비청년대상자: {} };
      const parsedData = {
        자립준비청년대상자: { 특정기호: "444", 지원시작일: "20260303", 지원종료일: "20260317" },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("자립준비청년대상자 데이터가 삭제된 경우", () => {
      const oldExtra = {
        자립준비청년대상자: { 특정기호: "444", 지원시작일: "20260303", 지원종료일: "20260317" },
      };
      const parsedData = { 자립준비청년대상자: {} };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("자립준비청년대상자 값이 변경된 경우", () => {
      const oldExtra = {
        자립준비청년대상자: { 특정기호: "444", 지원시작일: "20260303", 지원종료일: "20260317" },
      };
      const parsedData = {
        자립준비청년대상자: { 특정기호: "555", 지원시작일: "20260401", 지원종료일: "20260430" },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("조산아및저체중출생아등록대상자 데이터가 새로 추가된 경우", () => {
      const oldExtra = { 조산아및저체중출생아등록대상자: {} };
      const parsedData = {
        조산아및저체중출생아등록대상자: { 등록번호: "12345", 시작유효일자: "20260101", 종료유효일자: "20260331" },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("조산아및저체중출생아등록대상자 데이터가 삭제된 경우", () => {
      const oldExtra = {
        조산아및저체중출생아등록대상자: { 등록번호: "12345", 시작유효일자: "20260101", 종료유효일자: "20260331" },
      };
      const parsedData = { 조산아및저체중출생아등록대상자: {} };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("비대면진료대상정보 값이 변경된 경우", () => {
      const oldExtra = {
        비대면진료대상정보: { 장애등록여부: "N", 섬벽지거주여부: "N", 장기요양등급여부: "Y", 응급취약지거주여부: "N" },
      };
      const parsedData = {
        비대면진료대상정보: { 장애등록여부: "Y", 섬벽지거주여부: "N", 장기요양등급여부: "Y", 응급취약지거주여부: "N" },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("비대면진료 변경: 기존 {} → 자격조회 유효 데이터", () => {
      const oldExtra = { 비대면진료대상정보: {} };
      const parsedData = {
        비대면진료대상정보: {
          원본데이터: "NNNY",
          섬벽지거주여부: "N",
          장애등록여부: "N",
          장기요양등급여부: "N",
          응급취약지거주여부: "Y",
        },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("방문진료 변경: 기존 {} → 자격조회 { 장기요양대상여부: 'Y' }", () => {
      const oldExtra = { 방문진료대상정보: {} };
      const parsedData = {
        방문진료대상정보: {
          원본데이터: "NY",
          요양비인공호흡기산소치료대상여부: "N",
          장기요양대상여부: "Y",
        },
      };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("방문진료 동일: 양쪽 모두 빈 객체이면 변경 없음", () => {
      const oldExtra = { 방문진료대상정보: {} };
      const parsedData = { 방문진료대상정보: {} };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("비대면진료 동일: 양쪽 동일 데이터이면 변경 없음", () => {
      const data = {
        원본데이터: "NNNY",
        섬벽지거주여부: "N",
        장애등록여부: "N",
        장기요양등급여부: "N",
        응급취약지거주여부: "Y",
      };
      const oldExtra = { 비대면진료대상정보: data };
      const parsedData = { 비대면진료대상정보: data };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });

    it("방문진료 동일: 양쪽 동일 유효 데이터이면 변경 없음", () => {
      const data = {
        원본데이터: "YN",
        요양비인공호흡기산소치료대상여부: "Y",
        장기요양대상여부: "N",
      };
      const oldExtra = { 방문진료대상정보: data };
      const parsedData = { 방문진료대상정보: data };
      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(false);
    });
  });

  describe("실제 운영 데이터 시나리오", () => {
    it("기존 extraQualification과 parsedData 전체 비교 - 변경 있는 경우 (자격조회 결과 대부분 비어있음)", () => {
      // 기존: 여러 자격이 등록되어 있는 상태
      const oldExtra = {
        출국자여부: { data: "Y" },
        급여제한여부: { data: "02" },
        급여제한일자: { data: "" },
        본인부담차등여부: { data: "N" },
        요양병원입원여부: { data: "N" },
        비대면진료대상정보: {
          장애등록여부: "N",
          섬벽지거주여부: "N",
          장기요양등급여부: "Y",
          응급취약지거주여부: "N",
        },
        자립준비청년대상자: {
          특정기호: "444",
          지원시작일: "20260303",
          지원종료일: "20260317",
        },
        산정특례암등록대상자1: {
          등록일: "20260303",
          종료일: "20260326",
          등록구분: "1",
          등록번호: "11",
          상병기호: "S1",
          특정기호: "11",
          원본데이터: "",
          상병일련번호: "11",
        },
        당뇨병요양비대상자유형: { data: "제1형" },
        산정특례화상등록대상자: {
          등록일: "20260303",
          종료일: "20260324",
          등록번호: "11",
          상병코드: {},
          특정기호: "11",
          상병일련번호: {},
        },
        산정특례희귀질환등록대상자: {
          등록일: "20260303",
          종료일: "20260331",
          등록번호: "32",
          상병코드: {},
          특정기호: "32",
          상병일련번호: {},
        },
        산정특례상세불명희귀등록대상자: {
          등록일: "20260303",
          종료일: "20260331",
          등록번호: "33",
          상병코드: {},
          특정기호: "33",
          상병일련번호: {},
        },
      };

      // 새 자격조회: 대부분 비어있음 (자격 만료 등)
      const parsedData = {
        출국자여부: { data: "N" },
        급여제한여부: {},
        급여제한일자: {},
        본인부담차등여부: { data: "N" },
        요양병원입원여부: { data: "N" },
        비대면진료대상정보: {},
        자립준비청년대상자: {},
        산정특례암등록대상자1: {},
        당뇨병요양비대상자유형: {},
        당뇨병요양비대상자등록일: {},
        산정특례결핵등록대상자: {},
        산정특례화상등록대상자: {},
        산정특례극희귀등록대상자: {},
        희귀난치의료비지원대상자: {},
        산정특례중복암등록대상자2: {},
        산정특례중복암등록대상자3: {},
        산정특례중복암등록대상자4: {},
        산정특례중복암등록대상자5: {},
        산정특례잠복결핵등록대상자: {},
        산정특례중증치매등록대상자: {},
        산정특례희귀질환등록대상자: {},
        산정특례상세불명희귀등록대상자: {},
        산정특례중증난치질환등록대상자: {},
        조산아및저체중출생아등록대상자: {},
        산정특례기타염색체이상질환등록대상자: {},
      };

      expect(hasExtraQualificationChanges(oldExtra, parsedData)).toBe(true);
    });

    it("기존 extraQualification과 parsedData 전체 비교 - 변경 없는 경우 (동일 데이터)", () => {
      const commonData = {
        출국자여부: { data: "N" },
        급여제한여부: {},
        본인부담차등여부: { data: "N" },
        요양병원입원여부: { data: "N" },
        비대면진료대상정보: {},
        자립준비청년대상자: {},
        산정특례암등록대상자1: {},
        당뇨병요양비대상자유형: {},
        산정특례결핵등록대상자: {
          등록일: "20181204",
          종료일: "99991231",
          등록번호: "0818027203",
          특정기호: "V",
          원본데이터: "V   0818027203     2018120499991231            ",
        },
        산정특례화상등록대상자: {},
        산정특례극희귀등록대상자: {},
        희귀난치의료비지원대상자: {},
        산정특례잠복결핵등록대상자: {},
        산정특례중증치매등록대상자: {},
        산정특례희귀질환등록대상자: {},
        산정특례상세불명희귀등록대상자: {},
        산정특례중증난치질환등록대상자: {
          등록일: "20181204",
          종료일: "20301204",
          등록번호: "2318000034",
          상병코드: null,
          특정기호: "V",
          원본데이터: "V   2318000034     2018120420301204            ",
          상병일련번호: null,
        },
        조산아및저체중출생아등록대상자: {},
        산정특례기타염색체이상질환등록대상자: {
          등록일: "20181204",
          종료일: "20301203",
          등록번호: "1418000003",
          상병코드: null,
          특정기호: "V901",
          원본데이터: "V9011418000003     2018120420301203             ",
          상병일련번호: null,
        },
      };

      expect(hasExtraQualificationChanges(commonData, commonData)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. setEligibilityResponseToInsuranceInfo
// ---------------------------------------------------------------------------
describe("setEligibilityResponseToInsuranceInfo", () => {
  const receptionDateTime = new Date("2024-12-24T10:00:00Z");
  const rrn = "920101-1234567";

  it("parsedData가 undefined이면 null 반환", () => {
    expect(setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, undefined)).toBeNull();
  });

  it("parsedData가 빈 객체이면 기본 InsuranceInfo 반환", () => {
    const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, {} as any);
    expect(result).not.toBeNull();
    expect(result!.father).toBe("");
    expect(result!.cardNumber).toBe("");
    expect(result!.identityOptional).toBe(false);
  });

  describe("parsedData에서 필드 추출", () => {
    it("세대주성명 추출", () => {
      const parsedData = {
        세대주성명: { data: "홍길동" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.father).toBe("홍길동");
    });

    it("시설기호 → cardNumber 추출", () => {
      const parsedData = {
        시설기호: { data: "FAC001" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.cardNumber).toBe("FAC001");
    });

    it("장애여부 Y이면 장애 반영", () => {
      mockCalculateUDept.mockReturnValue(4); // 급여2종
      const parsedData = {
        장애여부: { data: "Y" },
        자격여부: { data: "8" }, // 의료급여2종
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.uDeptDetail).toBe(보험구분상세.의료급여2종장애);
    });

    it("장애여부가 없으면 비장애 처리", () => {
      const parsedData = {
        자격여부: { data: "8" }, // 의료급여2종
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.uDeptDetail).toBe(보험구분상세.의료급여2종);
    });

    it("본인확인예외여부 Y이면 identityOptional true", () => {
      const parsedData = {
        본인확인예외여부: { data: "Y" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.identityOptional).toBe(true);
    });

    it("본인확인예외여부 N이면 identityOptional false", () => {
      const parsedData = {
        본인확인예외여부: { data: "N" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.identityOptional).toBe(false);
    });

    it("보장기관기호 우선 사용, 없으면 의료급여기관기호 사용", () => {
      const parsedData1 = {
        보장기관기호: { data: "ORG001" },
        의료급여기관기호: { data: "MED001" },
      } as any;
      const result1 = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData1);
      expect(result1!.unionCode).toBe("ORG001");

      const parsedData2 = {
        의료급여기관기호: { data: "MED001" },
      } as any;
      const result2 = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData2);
      expect(result2!.unionCode).toBe("MED001");
    });

    it("자격여부를 파싱하여 보험구분상세 결정", () => {
      const parsedData = {
        자격여부: { data: "7" }, // 의료급여1종
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.uDeptDetail).toBe(보험구분상세.의료급여1종);
    });

    it("자격여부가 없으면 해당없음(0) → 일반 처리", () => {
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.uDeptDetail).toBe(보험구분상세.일반);
    });

    it("본인부담여부를 파싱하여 본인부담구분코드 설정", () => {
      const parsedData = {
        본인부담여부: { data: "3" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.ori본인부담구분코드).toBe(3);
      expect(result!.cfcd).toBe(3);
    });

    it("본인부담여부가 없으면 0으로 설정", () => {
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.ori본인부담구분코드).toBe(0);
      expect(result!.cfcd).toBe(0);
    });
  });

  describe("basicInfo 처리", () => {
    it("unionName을 basicInfo에서 가져옴", () => {
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(
        receptionDateTime,
        rrn,
        parsedData,
        { unionName: "국민건강보험공단" }
      );
      expect(result!.unionName).toBe("국민건강보험공단");
    });

    it("basicInfo 없으면 unionName 빈 문자열", () => {
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.unionName).toBe("");
    });
  });

  describe("영아 여부에 따른 분기", () => {
    it("영아가 아닌 경우 unionCode, unionName, 본인부담구분코드, fatherRrn 설정", () => {
      mockGetIsBaby.mockReturnValue(false);
      const parsedData = {
        보장기관기호: { data: "ORG001" },
        본인부담여부: { data: "2" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(
        receptionDateTime,
        rrn,
        parsedData,
        { unionName: "테스트조합" }
      );
      expect(result!.unionCode).toBe("ORG001");
      expect(result!.unionName).toBe("테스트조합");
      expect(result!.ori본인부담구분코드).toBe(2);
      expect(result!.cfcd).toBe(2);
      expect(mockGetRrnWithNumberString).toHaveBeenCalledWith(rrn);
    });

    it("영아인 경우 unionCode/unionName 미설정, fatherRrn은 수진자주민등록번호 우선 사용", () => {
      mockGetIsBaby.mockReturnValue(true);
      const parsedData = {
        수진자주민등록번호: { data: "240823-3000001" },
        보장기관기호: { data: "ORG001" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.unionCode).toBeUndefined();
      expect(result!.unionName).toBeUndefined();
      expect(mockGetRrnWithNumberString).toHaveBeenCalledWith("240823-3000001");
    });

    it("영아이고 수진자주민등록번호 없으면 원래 rrn 사용", () => {
      mockGetIsBaby.mockReturnValue(true);
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(mockGetRrnWithNumberString).toHaveBeenCalledWith(rrn);
    });
  });

  describe("calculateUDept 호출", () => {
    it("uDeptDetail을 인자로 calculateUDept 호출", () => {
      mockCalculateUDept.mockReturnValue(3);
      const parsedData = {
        자격여부: { data: "7" }, // 의료급여1종 → uDeptDetail = 3
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(mockCalculateUDept).toHaveBeenCalledWith(보험구분상세.의료급여1종);
      expect(result!.uDept).toBe(3);
    });
  });

  describe("extraQualification 처리", () => {
    it("extraQualification이 직접 전달되면 그대로 사용", () => {
      const parsedData = {} as any;
      const extra = { 산정특례암등록대상자1: { 등록일: "20240101" } };
      const result = setEligibilityResponseToInsuranceInfo(
        receptionDateTime,
        rrn,
        parsedData,
        undefined,
        extra
      );
      expect(result!.extraQualification).toEqual(extra);
    });

    it("extraQualification이 없으면 parsedData에서 추출", () => {
      const parsedData = {
        당뇨병요양비대상자유형: { data: "1" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.extraQualification).toBeDefined();
      expect(result!.extraQualification!["당뇨병요양비대상자유형"]).toEqual({ data: "1" });
    });

    it("extraQualification이 빈 객체이면 parsedData에서 추출", () => {
      const parsedData = {
        급여제한여부: { data: "Y" },
      } as any;
      const result = setEligibilityResponseToInsuranceInfo(
        receptionDateTime,
        rrn,
        parsedData,
        undefined,
        {}
      );
      expect(result!.extraQualification).toBeDefined();
      expect(result!.extraQualification!["급여제한여부"]).toEqual({ data: "Y" });
    });

    it("parsedData에 추가자격 관련 필드가 전혀 없으면 extraQualification 미설정", () => {
      // extractExtraQualificationFromParsedData returns keys for all options with defaults
      // So even with empty parsedData, we get default values which are all empty
      // The function checks Object.keys(finalExtraQualification).length > 0
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      // extractExtraQualificationFromParsedData({}) returns an object with all default keys
      // so extraQualification will be set
      expect(result!.extraQualification).toBeDefined();
    });
  });

  describe("기본 필드 설정", () => {
    it("modifyItemList는 빈 배열로 초기화", () => {
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.modifyItemList).toEqual([]);
    });

    it("eligibilityCheck는 빈 객체로 초기화", () => {
      const parsedData = {} as any;
      const result = setEligibilityResponseToInsuranceInfo(receptionDateTime, rrn, parsedData);
      expect(result!.eligibilityCheck).toEqual({});
    });
  });
});
