/**
 * 공통 유틸리티 함수 모음
 * 전반적으로 자주 사용되는 Store 접근 및 데이터 조회 함수들
 */

import { useUserStore } from "@/store/user-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useFacilityStore } from "@/store/facility-store";
import { useDepartmentStore } from "@/store/department-store";
import type { AuthUserType } from "@/types/auth-types";
import type { User } from "@/types/user-types";
import type { Hospital } from "@/types/hospital-types";
import type { Registration } from "@/types/registration-types";
import type { ChronicDisease } from "@/types/chart/chronic-disease";
import {
  보험구분상세,
  보험구분상세Label,
  보험구분,
} from "@/constants/common/common-enum";

// ================================ User 관련 유틸리티 ================================

/**
 * 현재 로그인한 사용자 정보 조회
 */
export const getCurrentUser = (): AuthUserType | User => {
  const state = useUserStore.getState();
  return state.user;
};

/**
 * 현재 사용자 ID 조회
 */
export const getCurrentUserId = (): number | string | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

/**
 * 현재 사용자명 조회
 */
export const getCurrentUserName = (): string => {
  const user = getCurrentUser();
  return user?.name || "";
};

// ================================ Hospital 관련 유틸리티 ================================

/**
 * 현재 병원 정보 조회
 */
export const getCurrentHospital = (): Hospital => {
  const state = useHospitalStore.getState();
  return state.hospital;
};

/**
 * 현재 병원 ID 조회
 */
export const getCurrentHospitalId = (): number | null => {
  const hospital = getCurrentHospital();
  return hospital?.id || null;
};

/**
 * 현재 병원명 조회
 */
export const getCurrentHospitalName = (): string => {
  const hospital = getCurrentHospital();
  return hospital?.name || "";
};

// ================================ Facility 관련 유틸리티 ================================

/**
 * facilityId를 기반으로 facility detail name 조회
 */
export const getFacilityNameById = (facilityId: number | string): string => {
  if (!facilityId) return "";

  const state = useFacilityStore.getState();
  const facilities = state.facilities || [];

  const facility = facilities.find((f) => f.id === Number(facilityId));
  if (facility) {
    return facility.name || "";
  }

  return "";
};

/**
 * 모든 facility 조회
 */
export const getFacilityDetailsByHospital = (): Array<{
  id: number;
  name: string;
  facilityId: number;
}> => {
  const state = useFacilityStore.getState();
  const facilities = state.facilities || [];

  const result: Array<{ id: number; name: string; facilityId: number }> = [];

  facilities.forEach((facility) => {
    result.push({
      id: facility.id,
      name: facility.name,
      facilityId: facility.facilityCode,
    });
  });

  return result;
};

// ================================ Department 관련 유틸리티 ================================

/**
 * 부서 이름 조회
 */
export const getDepartmentNameById = (
  departmentId: number,
  hospitalId?: string | number
): string => {
  const targetHospitalId =
    hospitalId?.toString() || getCurrentHospitalId()?.toString();
  if (!targetHospitalId) return "";

  const state = useDepartmentStore.getState();
  const departments = state.departmentsByHospital[targetHospitalId] || [];

  const department = departments.find(
    (dept) => dept.department.id === departmentId
  );
  return department?.department.name || "";
};

/**
 * 직급 이름 조회
 */
export const getPositionNameById = (
  departmentId: number,
  positionId: number,
  hospitalId?: string | number
): string => {
  const targetHospitalId =
    hospitalId?.toString() || getCurrentHospitalId()?.toString();
  if (!targetHospitalId) return "";

  const state = useDepartmentStore.getState();
  const departments = state.departmentsByHospital[targetHospitalId] || [];

  const department = departments.find(
    (dept) => dept.department.id === departmentId
  );
  const position = department?.positions.find((pos) => pos.id === positionId);
  return position?.name || "";
};

/**
 * 부서명과 직급명 함께 조회
 */
export const getDepartmentAndPositionNames = (
  departmentId: number,
  positionId: number,
  hospitalId?: string | number
): {
  departmentName: string;
  positionName: string;
} => {
  const departmentName = getDepartmentNameById(departmentId, hospitalId);
  const positionName = getPositionNameById(
    departmentId,
    positionId,
    hospitalId
  );

  return {
    departmentName,
    positionName,
  };
};

/**
 * 병원별 부서 목록 조회 (간단한 형태)
 */
export const getDepartmentsByHospital = (
  hospitalId?: string | number
): Array<{ id: number; name: string }> => {
  const targetHospitalId =
    hospitalId?.toString() || getCurrentHospitalId()?.toString();
  if (!targetHospitalId) return [];

  const state = useDepartmentStore.getState();
  const departments = state.departmentsByHospital[targetHospitalId] || [];

  return departments.map((dept) => ({
    id: dept.department.id,
    name: dept.department.name,
  }));
};

/**
 * 부서별 직급 목록 조회 (간단한 형태)
 */
export const getPositionsByDepartment = (
  departmentId: number,
  hospitalId?: string | number
): Array<{ id: number; name: string }> => {
  const targetHospitalId =
    hospitalId?.toString() || getCurrentHospitalId()?.toString();
  if (!targetHospitalId) return [];

  const state = useDepartmentStore.getState();
  const departments = state.departmentsByHospital[targetHospitalId] || [];

  const department = departments.find(
    (dept) => dept.department.id === departmentId
  );
  return (
    department?.positions.map((pos) => ({
      id: pos.id,
      name: pos.name,
    })) || []
  );
};

// ================================ 조합 유틸리티 ================================

/**
 * 현재 컨텍스트 정보 한번에 조회
 */
export const getCurrentContext = () => {
  return {
    user: getCurrentUser(),
    userId: getCurrentUserId(),
    userName: getCurrentUserName(),
    hospital: getCurrentHospital(),
    hospitalId: getCurrentHospitalId(),
    hospitalName: getCurrentHospitalName(),
  };
};

/**
 * ID 유효성 검사
 */
export const isValidId = (id: any): boolean => {
  return id != null && id !== "" && id !== 0 && !isNaN(Number(id));
};

/**
 * 안전한 문자열 변환
 */
export const safeToString = (value: any): string => {
  if (value == null) return "";
  return String(value);
};

/**
 * 안전한 숫자 변환
 */
export const safeToNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ================================ 주민등록번호 관련 유틸리티 ================================

/**
 * 주민등록번호 포맷팅 (숫자만 입력받아서 000000-0000000 형태로 변환)
 */
export const formatRrnNumber = (value: string | null | undefined): string => {
  // null이나 undefined인 경우 빈 문자열 반환
  if (!value) {
    return "";
  }
  
  // 이미 마스킹된 값(* 포함)이면 그대로 반환
  if (value.includes('*')) {
    return value;
  }
  
  // 1. 숫자만 남김
  let numbersOnly = value.replace(/[^0-9]/g, "");

  // 2. 13자리로 제한
  if (numbersOnly.length > 13) {
    numbersOnly = numbersOnly.slice(0, 13);
  }

  // 3. 하이픈 추가
  let formatted = numbersOnly;
  if (numbersOnly.length > 6) {
    formatted = numbersOnly.slice(0, 6) + "-" + numbersOnly.slice(6);
  }

  return formatted;
};

/**
 * 주민등록번호에서 생년월일과 성별 추출
 */
export const extractInfoFromRrn = (
  rrn: string
): {
  isValid: boolean;
  birthDate: Date | null;
  gender: number; // 1: 남성, 2: 여성, 0: 미상
  birthString: string; // YYYYMMDD 형태
} => {
  const rrnPattern = /^(\d{6})-?(\d{7})$/;
  const match = rrn.match(rrnPattern);

  if (!match || match.length !== 3) {
    return { isValid: false, birthDate: null, gender: 0, birthString: "" };
  }

  const front = match[1];
  const back = match[2];

  if (!front || !back || !back[0] || back[0] < "1" || back[0] > "8") {
    return { isValid: false, birthDate: null, gender: 0, birthString: "" };
  }

  // 생년월일 추출
  const yy = front.slice(0, 2);
  const mm = front.slice(2, 4);
  const dd = front.slice(4, 6);

  // 연도 계산
  let yearPrefix =
    back[0] === "1" || back[0] === "2" || back[0] === "5" || back[0] === "6"
      ? "19"
      : "20";
  const year = yearPrefix + yy;

  // 날짜 유효성 검사
  const birthDate = new Date(parseInt(year), parseInt(mm) - 1, parseInt(dd));
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, birthDate: null, gender: 0, birthString: "" };
  }

  // 성별 추출
  const gender =
    back[0] === "1" || back[0] === "3" || back[0] === "5" || back[0] === "7"
      ? 1
      : 2;

  // YYYYMMDD 형태 문자열
  const birthString = `${year}${mm}${dd}`;

  return {
    isValid: true,
    birthDate,
    gender,
    birthString,
  };
};

/**
 * KST 기준 오늘 날짜를 YYYYMMDD 문자열로 반환 (비교용, 시간 무시)
 */
function getTodayYyyymmddKst(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kstTime.getUTCFullYear();
  const m = kstTime.getUTCMonth() + 1;
  const d = kstTime.getUTCDate();
  return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
}

/**
 * 주민등록번호 앞 7자리로 생일 YYYYMMDD 반환. 유효하지 않으면 null.
 */
function getBirthYyyymmddFromRrnPrefix(digits: string): string | null {
  const numbersOnly = digits.replace(/[^0-9]/g, "");
  if (numbersOnly.length < 7) return null;
  const front = numbersOnly.slice(0, 6);
  const seventh = numbersOnly[6];
  if (!seventh || seventh < "1" || seventh > "8") return null;
  const yy = front.slice(0, 2);
  const mm = front.slice(2, 4);
  const dd = front.slice(4, 6);
  const yearPrefix =
    seventh === "1" || seventh === "2" || seventh === "5" || seventh === "6"
      ? "19"
      : "20";
  const year = yearPrefix + yy;
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  const utc = new Date(Date.UTC(parseInt(year, 10), month - 1, day));
  if (isNaN(utc.getTime())) return null;
  if (utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day)
    return null;
  return `${year}${mm}${dd}`;
}

/**
 * 주민등록번호 앞 6자리(YYMMDD)로 해석 가능한 두 YYYYMMDD(19YY, 20YY) 반환. 유효하지 않으면 null.
 */
function getBirthYyyymmddsFromFirst6Digits(
  digits: string
): [string, string] | null {
  const numbersOnly = digits.replace(/[^0-9]/g, "");
  if (numbersOnly.length < 6) return null;
  const front = numbersOnly.slice(0, 6);
  const yy = front.slice(0, 2);
  const mm = front.slice(2, 4);
  const dd = front.slice(4, 6);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  const year19 = "19" + yy;
  const year20 = "20" + yy;
  const utc1 = new Date(Date.UTC(parseInt(year19, 10), month - 1, day));
  const utc2 = new Date(Date.UTC(parseInt(year20, 10), month - 1, day));
  if (isNaN(utc1.getTime()) || isNaN(utc2.getTime())) return null;
  if (
    utc1.getUTCMonth() !== month - 1 ||
    utc1.getUTCDate() !== day ||
    utc2.getUTCMonth() !== month - 1 ||
    utc2.getUTCDate() !== day
  )
    return null;
  return [`${year19}${mm}${dd}`, `${year20}${mm}${dd}`];
}

/**
 * KST 기준 생년월일이 오늘 이후인지 여부 (YYYYMMDD 문자열만 비교, 시간 무시)
 */
export const isRrnBirthDateAfterTodayKst = (digits: string): boolean => {
  const today = getTodayYyyymmddKst();
  const len = digits.replace(/[^0-9]/g, "").length;
  if (len >= 7) {
    const birth = getBirthYyyymmddFromRrnPrefix(digits);
    return birth !== null && birth > today;
  }
  if (len === 6) {
    const pair = getBirthYyyymmddsFromFirst6Digits(digits);
    if (!pair) return false;
    return pair[0] > today && pair[1] > today;
  }
  return false;
};

// ================================ 날짜 관련 유틸리티 ================================

/**
 * 다양한 형태의 생년월일을 YYYYMMDD 문자열로 변환
 */
export const formatBirthDate = (birthday: any): string => {
  if (!birthday) return "";

  // YYYYMMDD 형식의 문자열인지 확인
  if (
    typeof birthday === "string" &&
    birthday.length === 8 &&
    /^\d{8}$/.test(birthday)
  ) {
    return birthday;
  }

  // Date 객체이거나 다른 형식인 경우
  const birthDate = new Date(birthday);
  if (!isNaN(birthDate.getTime())) {
    return `${birthDate.getFullYear()}${String(birthDate.getMonth() + 1).padStart(2, "0")}${String(birthDate.getDate()).padStart(2, "0")}`;
  }

  return "";
};

/**
 * YYYYMMDD 문자열을 Date 객체로 변환 (YYYYMMDD 형식 지원)
 */
export const parseBirthDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  if (
    typeof dateStr === "string" &&
    dateStr.length === 8 &&
    /^\d{8}$/.test(dateStr)
  ) {
    // "19930101" → "1993-01-01"
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime()) ? null : date;
  }

  // 기타 형식 처리
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// ================================ 보험 관련 유틸리티 ================================
export function getUdeptDetailToUdept(udeptDetail: number): 보험구분 {
  switch (udeptDetail) {
    case 보험구분상세.국민공단:
      return 보험구분.국민공단;
    case 보험구분상세.직장조합:
      return 보험구분.직장조합;
    case 보험구분상세.의료급여1종:
      return 보험구분.급여1종;
    case 보험구분상세.의료급여2종:
      return 보험구분.급여2종;
    case 보험구분상세.의료급여2종장애:
      return 보험구분.급여2종;
    case 보험구분상세.차상위1종:
      return 보험구분.국민공단;
    case 보험구분상세.차상위2종:
      return 보험구분.국민공단;
    case 보험구분상세.차상위2종장애:
      return 보험구분.국민공단;
    default:
      return 보험구분.일반;
  }
}

// ================================ 만성질환 관련 유틸리티 ================================

/**
 * ChronicDiseaseType에서 true인 질환들을 한글명으로 반환
 */
export function getChronicDiseaseLabels(
  chronicDisease: ChronicDisease
): string {
  const diseases: string[] = [];

  if (chronicDisease.hypertension) diseases.push("고혈압");
  if (chronicDisease.diabetes) diseases.push("당뇨");
  if (chronicDisease.highCholesterol) diseases.push("이상지혈");

  return diseases.length > 0 ? diseases.join(", ") : "";
}
