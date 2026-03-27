import { FAMILY_OPTIONS } from "@/constants/form-options";
import { convertDate } from "./date-utils";
import { ConsentPrivacyType } from "@/constants/common/common-enum";
import type { Patient } from "@/types/patient-types";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";

export function getAgeOrMonth(
  birth: string | undefined | null,
  lang: "ko" | "en" = "ko"
): string {
  if (!birth) return "";
  const birthStr = String(birth).trim();
  let birthDate: Date;

  // convertDate는 YYYYMMDD(8자리)만 지원하므로, 그 외 형식(YYYY-MM-DD/ISO 등)은 별도 처리
  if (/^\d{8}$/.test(birthStr)) {
    birthDate = convertDate(birthStr);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) {
    const match = birthStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    birthDate = new Date(y, m - 1, d);
  } else {
    birthDate = new Date(birthStr);
  }

  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();

  // 일수 계산
  const timeDiff = today.getTime() - birthDate.getTime();
  const days = Math.floor(timeDiff / (1000 * 3600 * 24));

  // 개월 수 계산
  let months =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());
  if (today.getDate() < birthDate.getDate()) months--;

  // 만 나이 계산
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  // 0일-1개월까지는 일수로만 표시 (ex: 17d)
  if (months < 1) {
    return lang === "ko" ? `${days}일` : `${days}d`;
  }

  // 1개월-12개월까지는 개월+일수 병용 (ex: 3m 17d)
  if (months < 12) {
    const remainingDays = days % 30; // 대략적인 계산
    return lang === "ko"
      ? `${months}개월 ${remainingDays}일`
      : `${months}m ${remainingDays}d`;
  }

  // 12개월 초과-36개월: 개월수만 표시 (ex: 28m)
  if (months < 36) {
    return lang === "ko" ? `${months}개월` : `${months}m`;
  }

  // 36개월 초과~8세: 연 단위+개월수로 표시 (ex: 4y 9m)
  if (age < 8) {
    const remainingMonths = months % 12;
    return lang === "ko"
      ? `${age}세 ${remainingMonths}개월`
      : `${age}y ${remainingMonths}m`;
  }

  // 8세 초과: 연단위 생략, 나이만 표시 (ex: 13)
  return lang === "ko" ? `${age}세` : `${age}`;
}

export function getGender(
  gender: number | undefined | null,
  lang: "ko" | "en" = "ko"
): string {
  if (gender === 1) {
    return lang === "ko" ? "남" : "M";
  } else if (gender === 2) {
    return lang === "ko" ? "여" : "F";
  } else {
    return "";
  }
}

export function getRelationType(relationType: number): string {
  return FAMILY_OPTIONS.find((opt) => opt.value === relationType)?.label ?? "";
}

export function toKRW(
  value: number | string | null | undefined,
  withUnit = true
): string {
  if (value === null || value === undefined) return "";

  // string인 경우 숫자로 변환
  let numValue: number;
  if (typeof value === "string") {
    numValue = parseFloat(value);
  } else {
    numValue = value;
  }

  if (isNaN(numValue)) return "";
  return `${numValue.toLocaleString("ko-KR")}${withUnit ? "원" : ""}`;
}

// 전화번호 포맷팅 함수들
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";

  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, "");

  // 길이에 따라 포맷팅
  if (numbers.length === 10) {
    // 지역번호 (02, 03x, 04x, 05x, 06x) 또는 휴대폰 (01x)
    const firstTwo = numbers.slice(0, 2);
    if (firstTwo === "02") {
      // 서울: 02-1234-5678
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      // 지역번호: 031-234-5678
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
  } else if (numbers.length === 11) {
    const firstTwo = numbers.slice(0, 2);
    if (firstTwo === "02") {
      // 서울: 02-1234-5678
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (firstTwo === "01") {
      // 휴대폰: 010-1234-5678
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      // 지역번호: 031-234-5678
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
  }

  // 포맷팅할 수 없는 경우 원본 반환
  return phoneNumber;
};

/**
 * 전화번호 유효성 검사 (formatPhoneNumber와 동일한 한국 번호 규칙 기준)
 * - 10자리: 02(서울), 03x/04x/05x/06x(지역번호)
 * - 11자리: 02(서울), 01x(휴대폰), 03x/04x/05x/06x(지역번호)
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber || typeof phoneNumber !== "string") return false;

  const numbers = phoneNumber.replace(/\D/g, "");
  if (numbers.length !== 10 && numbers.length !== 11) return false;

  const firstTwo = numbers.slice(0, 2);
  const firstThree = numbers.slice(0, 3);

  if (numbers.length === 10) {
    if (firstTwo === "02") return true; // 서울 02-XXXX-XXXX
    if (["03", "04", "05", "06"].includes(firstTwo)) return true; // 지역번호 XXX-XXX-XXXX
    return false;
  }

  // 11자리
  if (firstTwo === "02") return true; // 서울
  if (firstTwo === "01" && firstThree >= "010" && firstThree <= "019") return true; // 휴대폰 010~019
  if (["03", "04", "05", "06"].includes(firstTwo)) return true; // 지역번호
  return false;
};

export const unformatPhoneNumber = (formattedPhone: string): string => {
  if (!formattedPhone) return "";

  // 대시 제거하고 숫자만 반환
  return formattedPhone.replace(/\D/g, "");
};

export const unformatRrn = (formattedRrn: string): string => {
  if (!formattedRrn) return "";
  return formattedRrn.replace(/-/g, "");
};

export const formatRrn = (rrn: string): string => {
  if (!rrn) return "";
  const digits = rrn.replace(/-/g, "");
  if (digits.length >= 6) {
    const front = digits.slice(0, 6);
    const back = digits.length > 6 ? digits.slice(6, 13) : "";
    return back ? `${front}-${back}` : `${front}-`;
  }
  return digits;
};
// 실시간 전화번호 포맷팅 함수
export const formatPhoneNumberRealtime = (value: string): string => {
  // 지역번호 배열
  const areaCodes = [
    "02",
    "031",
    "032",
    "033",
    "041",
    "042",
    "043",
    "044",
    "051",
    "052",
    "053",
    "054",
    "055",
    "061",
    "062",
    "063",
    "064",
  ];

  let phoneValue = value.replace(/[^0-9\-]/g, "");
  let raw = phoneValue.replace(/\-/g, "");

  if (phoneValue.startsWith("010")) {
    if (raw.length > 11) raw = raw.slice(0, 11);
    if (raw.length > 7) {
      phoneValue = raw.slice(0, 3) + "-" + raw.slice(3, 7) + "-" + raw.slice(7);
    } else if (raw.length > 3) {
      phoneValue = raw.slice(0, 3) + "-" + raw.slice(3);
    } else {
      phoneValue = raw;
    }
  } else if (areaCodes.some((code) => raw.startsWith(code))) {
    let code = areaCodes.find((code) => raw.startsWith(code)) || "";
    let codeLen = code.length;
    let maxLen = code === "02" ? 10 : 11;
    if (raw.length > maxLen) raw = raw.slice(0, maxLen);
    if (raw.length > codeLen + 4) {
      phoneValue =
        raw.slice(0, codeLen) +
        "-" +
        raw.slice(codeLen, raw.length - 4) +
        "-" +
        raw.slice(raw.length - 4);
    } else if (raw.length > codeLen) {
      phoneValue = raw.slice(0, codeLen) + "-" + raw.slice(codeLen);
    } else {
      phoneValue = raw;
    }
  }

  return phoneValue;
};

/**
 * 주민등록번호에서 생년월일 추출
 */
export function getBirthdayFromRrn(residentRegistrationNumber: string): Date {
  if (!residentRegistrationNumber || residentRegistrationNumber.length !== 14) {
    return new Date(0);
  }

  const year = residentRegistrationNumber.substring(0, 2);
  const month = residentRegistrationNumber.substring(2, 4);
  const day = residentRegistrationNumber.substring(4, 6);
  const gender = residentRegistrationNumber.substring(6, 7);

  // 성별 코드로 1900년대/2000년대 판단
  let fullYear: number;
  if (gender === "1" || gender === "2" || gender === "5" || gender === "6") {
    fullYear = 1900 + parseInt(year);
  } else {
    fullYear = 2000 + parseInt(year);
  }

  return new Date(fullYear, parseInt(month) - 1, parseInt(day));
}

/**
 * 문자열 안전한 부분 문자열 추출
 */
function safeSubstring(str: string, start: number, length: number): string {
  if (!str || start < 0 || length < 0 || start >= str.length) {
    return "";
  }
  const end = Math.min(start + length, str.length);
  return str.substring(start, end);
}

/**
 * 영아 여부 판단
 * @param residentRegistrationNumber 주민등록번호
 * @returns 영아 여부
 */
export function getIsBaby(
  residentRegistrationNumber: string | null | undefined
): boolean {
  if (!residentRegistrationNumber) return false;

  // ex 230823-(3/4/7/8/)00000(0/1/2)
  // 3 남아 4 여아 7 외국인남아 8 외국인여아
  // 1 쌍둥이 첫째 2 쌍둥이 둘째
  if (residentRegistrationNumber.length !== 14) return false;

  const birthday = getBirthdayFromRrn(residentRegistrationNumber);
  if ((new Date().getTime() - birthday.getTime()) / (1000 * 60 * 60 * 24) > 30)
    return false;

  if (safeSubstring(residentRegistrationNumber, 9, 5) !== "00000") return false;

  const validSex = ["3", "4", "7", "8"];
  if (!validSex.includes(residentRegistrationNumber[7] || "")) return false;

  const validTwin = ["0", "1", "2"];
  return validTwin.includes(residentRegistrationNumber[13] || "");
}

export function getResidentRegistrationNumberWithNumberString(
  residentRegistrationNumber: string
): string {
  if (!residentRegistrationNumber) return "";
  return residentRegistrationNumber.replace(/-/g, "");
}

/**
 * rrnView 값을 화면 표기용으로 변경
 * @param rrnView - 7자리 주민등록번호 앞부분 (예: "920101")
 * @returns 마스킹된 주민등록번호 (예: "920101-2******")
 */
export function makeRrnView(rrnView: string): string {
  if (!rrnView || rrnView.length < 7) return "";

  const front6 = rrnView.substring(0, 6); // 생년월일 6자리
  const genderDigit = rrnView.substring(6, 7); // 성별 코드 1자리
  const masked = "******"; // 나머지 6자리 마스킹

  return `${front6}-${genderDigit}${masked}`;
}

// 생년월일에서 나이 계산
export function calculateAge(birthDate: string) {
  if (!birthDate) return undefined;

  try {
    let birth: Date;

    // YYYYMMDD 형식 처리 (예: "19230901")
    if (/^\d{8}$/.test(birthDate)) {
      const year = birthDate.substring(0, 4);
      const month = birthDate.substring(4, 6);
      const day = birthDate.substring(6, 8);
      birth = new Date(`${year}-${month}-${day}`);
    } else {
      birth = new Date(birthDate);
    }

    if (isNaN(birth.getTime())) {
      return undefined;
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("오류:", error);
    return undefined;
  }
}

/**
 * API 응답의 patient 객체를 Patient 타입으로 매핑
 * @param patientData - API 응답의 patient 객체 (partial 가능)
 * @returns Patient 타입 객체
 */
export const mapToPatient = (patientData: any): Patient => {
  return {
    id: patientData?.id ?? 0,
    patientNo: patientData?.patientNo ?? 0,
    uuid: patientData?.uuid ?? "",
    loginId: patientData?.loginId ?? null,
    password: patientData?.password ?? null,
    name: patientData?.name ?? "",
    rrn: patientData?.rrn ?? "",
    rrnView: patientData?.rrnView ?? "",
    rrnHash: patientData?.rrnHash ?? null,
    gender: patientData?.gender ?? 0,
    phone1: patientData?.phone1 ?? "",
    phone2: patientData?.phone2 ?? "",
    birthDate: patientData?.birthDate ?? "",
    address1: patientData?.address1 ?? "",
    address2: patientData?.address2 ?? "",
    zipcode: patientData?.zipcode ?? "",
    chronicDisease: patientData?.chronicDisease ?? {
      diabetes: false,
      hypertension: false,
      highCholesterol: false,
    },
    consent: patientData?.consent ?? {
      privacy: ConsentPrivacyType.미동의,
      message: false,
      marketing: false,
    },
    identityVerifiedAt: patientData?.identityVerifiedAt ?? null,
    idNumber: patientData?.idNumber ?? null,
    idType: patientData?.idType ?? null,
    lastEncounterDate: patientData?.lastEncounterDate ?? null,
    vitalSignMeasurements: patientData?.vitalSignMeasurements ?? [],
    createId: patientData?.createId ?? 0,
    createDateTime: patientData?.createDateTime ?? "",
    updateId: patientData?.updateId ?? null,
    updateDateTime: patientData?.updateDateTime ?? null,
    isActive: patientData?.isActive ?? true,
    isTemporary: patientData?.isTemporary ?? false,
    fatherRrn: patientData?.fatherRrn ?? "",
    eligibilityCheck: patientData?.eligibilityCheck ?? {} as EligibilityCheck,
    groupId: patientData?.groupId ?? null,
    memo: patientData?.memo ?? "",
    hospitalId: patientData?.hospitalId ?? 0,
    patientType: patientData?.patientType ?? null,
    nextAppointmentDateTime: patientData?.nextAppointmentDateTime ?? null,
  };
};
