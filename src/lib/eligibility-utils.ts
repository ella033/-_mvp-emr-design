import { 의료급여자격여부, 보험구분상세 } from "@/constants/common/common-enum";
import {
  ADDITIONAL_QUALIFICATION_OPTIONS,
  STRING_DATA_FIELD_KEYS,
  SPECIAL_TYPE_FIELD_KEYS,
} from "@/constants/common/additional-qualification-options";
import { getIsBaby, getResidentRegistrationNumberWithNumberString } from "@/lib/patient-utils";
import { calculateUDept } from "@/store/common/insurance-store";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import type { components } from "@/generated/api/types";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";

/**
 * 안전한 문자열 자르기 함수 (C# SafeSubstring과 동일)
 */
export function safeSubstring(
  str: string | null | undefined,
  startIndex: number,
  length: number
): string {
  if (!str || str.length <= startIndex) return "";
  return str.substring(startIndex, Math.min(startIndex + length, str.length));
}

/**
 * 자격상태로부터 보험구분상세 반환
 */
export function getUDeptDetailFromQualificationStatus(
  qualificationStatus: 의료급여자격여부,
  차상위정보: { isData: boolean; division?: number },
  is장애: boolean
): 보험구분상세 {
  switch (qualificationStatus) {
    case 의료급여자격여부.의료급여1종:
      return 보험구분상세.의료급여1종;

    case 의료급여자격여부.지역세대원:
    case 의료급여자격여부.지역세대주:
      if (!차상위정보.isData) return 보험구분상세.국민공단;
      switch (차상위정보.division) {
        case 1:
          return 보험구분상세.차상위1종;
        case 2:
          return is장애 ? 보험구분상세.차상위2종장애 : 보험구분상세.차상위2종;
        default:
          return 보험구분상세.국민공단;
      }

    case 의료급여자격여부.의료급여2종:
      return is장애 ? 보험구분상세.의료급여2종장애 : 보험구분상세.의료급여2종;

    case 의료급여자격여부.직장가입자:
    case 의료급여자격여부.직장피부양자:
    case 의료급여자격여부.임의계속직장가입자:
      if (!차상위정보.isData) return 보험구분상세.직장조합;
      switch (차상위정보.division) {
        case 1:
          return 보험구분상세.차상위1종;
        case 2:
          return is장애 ? 보험구분상세.차상위2종장애 : 보험구분상세.차상위2종;
        default:
          return 보험구분상세.직장조합;
      }

    default:
      return 보험구분상세.일반;
  }
}

/**
 * parsedData에서 extraQualification 관련 필드만 추출하여 반환
 * 모든 eligibilityKey에 대해 빈 값이라도 포함 (빈 객체 {} 또는 { data: "" })
 * @param parsedData EligibilityCheckResponseDto 타입의 parsedData
 * @returns extraQualification 형태의 JSON 객체
 */
export function extractExtraQualificationFromParsedData(
  parsedData?: Record<string, any>
): Record<string, any> {
  if (!parsedData) {
    return {};
  }

  const result: Record<string, any> = {};

  // 자립준비청년대상자 유효성 검사 (SelfPreparationPersonInfo)
  const hasMeaningfulSelfPrepData = (field: any): boolean => {
    if (!field || typeof field !== "object") return false;
    const 특정기호 = (field["특정기호"] as string) || "";
    const 지원시작일 = (field["지원시작일"] as string) || "";
    const 지원종료일 = (field["지원종료일"] as string) || "";
    return !!(특정기호 || 지원시작일 || 지원종료일);
  };

  // 조산아및저체중출생아등록대상자 유효성 검사 (PreInfantInfo)
  const hasMeaningfulPreInfantData = (field: any): boolean => {
    if (!field || typeof field !== "object") return false;
    const 등록번호 = (field["등록번호"] as string) || "";
    const 시작유효일자 = (field["시작유효일자"] as string) || "";
    const 종료유효일자 = (field["종료유효일자"] as string) || "";
    return !!(등록번호 || 시작유효일자 || 종료유효일자);
  };

  // 비대면진료대상정보 유효성 검사 (NonFaceToFaceDiagnosisInfo)
  // Y가 하나라도 있어야 유효, 모두 N이면 빈 객체 처리
  const hasMeaningfulNonFaceToFaceData = (field: any): boolean => {
    if (!field || typeof field !== "object") return false;
    return field["섬벽지거주여부"] === "Y" ||
      field["장애등록여부"] === "Y" ||
      field["장기요양등급여부"] === "Y" ||
      field["응급취약지거주여부"] === "Y";
  };

  // 방문진료대상정보 유효성 검사 (VisitMedicalCareTargetInfo)
  // Y가 하나라도 있어야 유효, 모두 N이면 빈 객체 처리
  const hasMeaningfulVisitMedicalCareData = (field: any): boolean => {
    if (!field || typeof field !== "object") return false;
    return field["요양비인공호흡기산소치료대상여부"] === "Y" ||
      field["장기요양대상여부"] === "Y";
  };

  // 원본데이터 필드 제거 유틸
  const stripRawData = (obj: any): Record<string, any> => {
    const cleaned: Record<string, any> = {};
    Object.keys(obj).forEach((k) => {
      if (k !== "원본데이터") {
        cleaned[k] = obj[k];
      }
    });
    return cleaned;
  };

  // ADDITIONAL_QUALIFICATION_OPTIONS의 모든 키 처리
  ADDITIONAL_QUALIFICATION_OPTIONS.forEach((option) => {
    const key = option.eligibilityKey;
    const field = parsedData[key as keyof typeof parsedData];

    // SPECIAL_TYPE_FIELD_KEYS: 자립준비/조산아/비대면/방문진료 별도 처리
    if (SPECIAL_TYPE_FIELD_KEYS.has(key)) {
      if (field && typeof field === "object" && Object.keys(field).length > 0) {
        // { data: "..." } 형태인 경우 빈 객체로 처리 (잘못된 포맷)
        if ("data" in field) {
          result[key] = {};
          return;
        }
        // 원본데이터 제거 후 타입별 유효성 검사
        const cleaned = stripRawData(field);
        if (key === "자립준비청년대상자") {
          result[key] = hasMeaningfulSelfPrepData(cleaned) ? cleaned : {};
        } else if (key === "조산아및저체중출생아등록대상자") {
          result[key] = hasMeaningfulPreInfantData(cleaned) ? cleaned : {};
        } else if (key === "비대면진료대상정보") {
          result[key] = hasMeaningfulNonFaceToFaceData(cleaned) ? cleaned : {};
        } else if (key === "방문진료대상정보") {
          result[key] = hasMeaningfulVisitMedicalCareData(cleaned) ? cleaned : {};
        } else {
          result[key] = cleaned;
        }
      } else {
        result[key] = {};
      }
      return;
    }

    // StringDataField 타입 필드 처리
    if (STRING_DATA_FIELD_KEYS.has(key)) {
      if (field && typeof field === "object" && "data" in field) {
        const data = (field["data"] as string) || "";
        // data가 있으면 해당 값 사용, 없으면 빈 문자열로 설정
        result[key] = { data: data };
      } else {
        // parsedData에 없으면 빈 문자열로 설정
        result[key] = { data: "" };
      }
    }
    // DiseaseRegistrationPersonBase 타입 필드 처리
    else {
      if (field && typeof field === "object" && Object.keys(field).length > 0) {
        // 등록일이나 특정기호나 등록번호가 있으면 유효한 데이터로 간주
        const fieldAny = field as any;
        const 등록일 = (fieldAny["등록일"] as string) || "";
        const 특정기호 = (fieldAny["특정기호"] as string) || "";
        const 등록번호 = (fieldAny["등록번호"] as string) || "";

        if (등록일 || 특정기호 || 등록번호) {
          result[key] = field;
        } else {
          // 데이터가 없으면 빈 객체로 설정
          result[key] = {};
        }
      } else {
        // parsedData에 없으면 빈 객체로 설정
        result[key] = {};
      }
    }
  });

  // 중증암 관련 추가 키들 처리 (산정특례중복암등록대상자2~5)
  const cancerKeys = [
    "산정특례중복암등록대상자2",
    "산정특례중복암등록대상자3",
    "산정특례중복암등록대상자4",
    "산정특례중복암등록대상자5",
  ];

  cancerKeys.forEach((key) => {
    if (!(key in result)) {
      const field = parsedData[key as keyof typeof parsedData];
      if (field && typeof field === "object" && Object.keys(field).length > 0) {
        const fieldAny = field as any;
        const 등록일 = (fieldAny["등록일"] as string) || "";
        const 특정기호 = (fieldAny["특정기호"] as string) || "";
        const 등록번호 = (fieldAny["등록번호"] as string) || "";

        if (등록일 || 특정기호 || 등록번호) {
          result[key] = field;
        } else {
          result[key] = {};
        }
      } else {
        result[key] = {};
      }
    }
  });

  // 추가 필드: 당뇨병요양비대상자등록일 (DisRegPrson6Info: { 원본데이터?, 등록일? })
  if (!("당뇨병요양비대상자등록일" in result)) {
    const field = parsedData["당뇨병요양비대상자등록일" as keyof typeof parsedData];
    if (field && typeof field === "object" && Object.keys(field).length > 0) {
      // { data: "..." } 형태인 경우 빈 객체로 처리 (잘못된 포맷)
      if ("data" in field) {
        result["당뇨병요양비대상자등록일"] = {};
      } else {
        const fieldAny = field as any;
        const 등록일 = (fieldAny["등록일"] as string) || "";
        const 원본데이터 = (fieldAny["원본데이터"] as string) || "";
        if (등록일 || 원본데이터) {
          result["당뇨병요양비대상자등록일"] = field;
        } else {
          result["당뇨병요양비대상자등록일"] = {};
        }
      }
    } else {
      result["당뇨병요양비대상자등록일"] = {};
    }
  }

  // 추가 필드: 급여제한일자 (StringDataField: { data: "..." })
  if (!("급여제한일자" in result)) {
    const field = parsedData["급여제한일자" as keyof typeof parsedData];
    if (field && typeof field === "object" && "data" in field) {
      const data = (field["data"] as string) || "";
      result["급여제한일자"] = { data: data };
    } else {
      result["급여제한일자"] = { data: "" };
    }
  }

  return result;
}

/**
 * extraQualification 객체를 정규화하여 모든 eligibilityKey를 포함하도록 함
 * 빈 값도 {} 또는 { data: "" } 형태로 포함
 * @param extraQualification InsuranceInfo의 extraQualification 필드
 * @returns 정규화된 extraQualification 객체
 */
export function normalizeExtraQualification(
  extraQualification?: Record<string, any>
): Record<string, any> {
  if (!extraQualification) {
    extraQualification = {};
  }

  // 깊은 복사 및 잘못된 중첩 구조 정리 (임시 저장소)
  const tempResult: Record<string, any> = {};

  // 모든 최상위 키를 순회하면서 정리
  Object.keys(extraQualification).forEach((key) => {
    const value = extraQualification[key];

    // SPECIAL_TYPE_FIELD_KEYS: 비대면/방문진료/자립준비/조산아 별도 처리
    if (SPECIAL_TYPE_FIELD_KEYS.has(key)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // data 속성 및 원본데이터 제거 (과거 잘못된 포맷 정리)
        const cleanedValue: Record<string, any> = {};
        Object.keys(value).forEach(subKey => {
          if (subKey !== "data" && subKey !== "원본데이터") {
            cleanedValue[subKey] = value[subKey];
          }
        });
        tempResult[key] = cleanedValue;
      } else {
        tempResult[key] = {};
      }
      return;
    }

    // 값이 객체인 경우
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // 잘못된 중첩 구조 확인: DiseaseRegistrationPersonBase 타입 객체 안에 다른 eligibilityKey가 있는지 확인
      const nestedKeys = Object.keys(value);
      const hasNestedEligibilityKey = nestedKeys.some(nestedKey => {
        // ADDITIONAL_QUALIFICATION_OPTIONS에 있는 키인지 확인
        return ADDITIONAL_QUALIFICATION_OPTIONS.some(opt => opt.eligibilityKey === nestedKey) ||
          nestedKey === "산정특례중복암등록대상자2" ||
          nestedKey === "산정특례중복암등록대상자3" ||
          nestedKey === "산정특례중복암등록대상자4" ||
          nestedKey === "산정특례중복암등록대상자5" ||
          nestedKey === "당뇨병요양비대상자등록일" ||
          nestedKey === "급여제한일자";
      });

      if (hasNestedEligibilityKey) {
        // 잘못된 중첩 구조: 최상위 키의 값만 복사하고, 중첩된 eligibilityKey는 제거
        const cleanedValue: Record<string, any> = {};
        nestedKeys.forEach(nestedKey => {
          const isEligibilityKey = ADDITIONAL_QUALIFICATION_OPTIONS.some(opt => opt.eligibilityKey === nestedKey) ||
            nestedKey === "산정특례중복암등록대상자2" ||
            nestedKey === "산정특례중복암등록대상자3" ||
            nestedKey === "산정특례중복암등록대상자4" ||
            nestedKey === "산정특례중복암등록대상자5" ||
            nestedKey === "당뇨병요양비대상자등록일" ||
            nestedKey === "급여제한일자";

          if (!isEligibilityKey) {
            cleanedValue[nestedKey] = value[nestedKey];
          }
        });
        tempResult[key] = cleanedValue;
      } else {
        // 정상적인 구조: 그대로 복사
        tempResult[key] = { ...value };
      }
    } else {
      // 객체가 아닌 경우 그대로 복사
      tempResult[key] = value;
    }
  });

  // 정규화된 결과 (키 순서를 일관되게 유지)
  const result: Record<string, any> = {};

  // 1. ADDITIONAL_QUALIFICATION_OPTIONS의 순서대로 키 추가 (키 순서 일관성 유지)
  ADDITIONAL_QUALIFICATION_OPTIONS.forEach((option) => {
    const key = option.eligibilityKey;

    // SPECIAL_TYPE_FIELD_KEYS: 비대면/방문진료/자립준비/조산아 별도 처리
    if (SPECIAL_TYPE_FIELD_KEYS.has(key)) {
      if (key in tempResult) {
        const value = tempResult[key];
        // 비대면/방문진료: Y가 하나도 없으면 빈 객체로 정규화
        if (key === "비대면진료대상정보" || key === "방문진료대상정보") {
          if (value && typeof value === "object" && Object.values(value).some(v => v === "Y")) {
            result[key] = value;
          } else {
            result[key] = {};
          }
        } else {
          result[key] = value || {};
        }
      } else {
        result[key] = {};
      }
      return;
    }

    if (key in tempResult) {
      // 기존 값이 있는 경우
      const value = tempResult[key];
      // StringDataField 타입인데 data 속성이 없는 경우 정규화
      if (STRING_DATA_FIELD_KEYS.has(key)) {
        if (!value || typeof value !== "object" || !("data" in value)) {
          result[key] = { data: "" };
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    } else {
      // 기존 값이 없는 경우 기본값 설정
      if (STRING_DATA_FIELD_KEYS.has(key)) {
        result[key] = { data: "" };
      } else {
        result[key] = {};
      }
    }
  });

  // 2. 중증암 관련 추가 키들 처리
  const cancerKeys = [
    "산정특례중복암등록대상자2",
    "산정특례중복암등록대상자3",
    "산정특례중복암등록대상자4",
    "산정특례중복암등록대상자5",
  ];

  cancerKeys.forEach((key) => {
    if (key in tempResult) {
      result[key] = tempResult[key];
    } else {
      result[key] = {};
    }
  });

  // 3. 추가 필드: 당뇨병요양비대상자등록일 (DisRegPrson6Info: { 원본데이터?, 등록일? })
  if ("당뇨병요양비대상자등록일" in tempResult) {
    const value = tempResult["당뇨병요양비대상자등록일"];
    // { data: "..." } 형태(과거 잘못된 포맷)인 경우 {}로 정규화
    if (value && typeof value === "object" && "data" in value) {
      result["당뇨병요양비대상자등록일"] = {};
    } else {
      result["당뇨병요양비대상자등록일"] = value || {};
    }
  } else {
    result["당뇨병요양비대상자등록일"] = {};
  }

  // 4. 추가 필드: 급여제한일자 (StringDataField: { data: "..." })
  if ("급여제한일자" in tempResult) {
    const value = tempResult["급여제한일자"];
    if (!value || typeof value !== "object" || !("data" in value)) {
      result["급여제한일자"] = { data: "" };
    } else {
      result["급여제한일자"] = value;
    }
  } else {
    result["급여제한일자"] = { data: "" };
  }

  return result;
}

/**
 * 자격조회 응답을 보험정보로 변환
 * @param receptionDateTime 접수 일시
 * @param rrn 주민등록번호
 * @param parsedData EligibilityCheckResponseDto - parsedData에서 직접 정보 추출
 * @param basicInfo 기본 정보 (unionName만 선택적, 나머지는 parsedData에서 추출)
 * @param extraQualification extraQualification (선택적) - 이미 생성된 extraQualification 사용
 * @returns InsuranceInfo 객체 또는 null
 */
export function setEligibilityResponseToInsuranceInfo(
  receptionDateTime: Date,
  rrn: string,
  parsedData?: components["schemas"]["EligibilityCheckResponseDto"],
  basicInfo?: {
    unionName?: string; // parsedData에 없는 필드만 유지
  },
  extraQualification?: Record<string, any>
): Partial<InsuranceInfo> | null {
  if (!parsedData) return null;

  // parsedData에서 정보 추출
  const dataToUse = parsedData;

  // 장애여부는 parsedData에서 추출
  const isObstacle = dataToUse?.["장애여부"]?.data === "Y" || false;

  // 차상위 정보는 parsedData에서 직접 추출할 수 없으므로 기본값 사용
  // TODO: 차상위 정보를 parsedData에서 어떻게 추출할지 확인 필요
  // 현재는 차상위 정보 없음으로 처리
  const 차상위정보 = { isData: false, division: 0 };

  // 본인확인예외여부는 parsedData에서 추출
  // Y: 본인확인 예외 대상
  // (의료급여 대상자는 공란, 그 외 대상자는 N)
  const finalIdentityOptional = dataToUse?.["본인확인예외여부"]?.data === "Y" || false;

  // parsedData에서 직접 추출
  const father = dataToUse?.["세대주성명"]?.data || "";
  const cardNumber = dataToUse?.["시설기호"]?.data || "";
  const unionCode = dataToUse?.["보장기관기호"]?.data || dataToUse?.["의료급여기관기호"]?.data || "";
  const unionName = basicInfo?.unionName || "";
  const qualificationStatus: 의료급여자격여부 = dataToUse?.["자격여부"]?.data
    ? parseInt(dataToUse["자격여부"].data)
    : 의료급여자격여부.해당없음;
  const 본인부담구분코드 = dataToUse?.["본인부담여부"]?.data
    ? parseInt(dataToUse["본인부담여부"].data)
    : 0;
  const finalResidentRegistrationNumber = dataToUse?.["수진자주민등록번호"]?.data || "";

  const newInsuranceInfo: Partial<InsuranceInfo> = {
    father,
    uDeptDetail: getUDeptDetailFromQualificationStatus(
      qualificationStatus,
      차상위정보,
      isObstacle
    ),
    cardNumber,
    modifyItemList: [],
    identityOptional: finalIdentityOptional,
    eligibilityCheck: {} as EligibilityCheck
  };

  if (!getIsBaby(rrn)) {
    newInsuranceInfo.unionCode = unionCode;
    newInsuranceInfo.unionName = unionName;
    newInsuranceInfo.ori본인부담구분코드 = 본인부담구분코드;
    newInsuranceInfo.cfcd = 본인부담구분코드;

    newInsuranceInfo.fatherRrn =
      getResidentRegistrationNumberWithNumberString(rrn);
  } else {
    //TODO: 확인 필요
    newInsuranceInfo.fatherRrn =
      getResidentRegistrationNumberWithNumberString(
        finalResidentRegistrationNumber || rrn
      );
  }

  newInsuranceInfo.uDept = calculateUDept(newInsuranceInfo.uDeptDetail as 보험구분상세);

  // 차상위 정보 설정 (parsedData에서 추출 불가능하므로 기본값 사용)
  // TODO: 차상위 정보를 parsedData에서 어떻게 추출할지 확인 필요
  // 차상위 정보는 별도로 관리되거나 다른 방법으로 추출해야 할 수 있음

  // extraQualification 생성 또는 사용
  let finalExtraQualification: Record<string, any> = {};

  // extraQualification이 직접 전달된 경우 사용
  if (extraQualification && Object.keys(extraQualification).length > 0) {
    finalExtraQualification = extraQualification;
  } else if (dataToUse) {
    // parsedData에서 extraQualification 관련 필드 추출
    finalExtraQualification = extractExtraQualificationFromParsedData(dataToUse);
  }

  // extraQualification을 newInsuranceInfo에 포함
  if (Object.keys(finalExtraQualification).length > 0) {
    newInsuranceInfo.extraQualification = finalExtraQualification;
  }

  return newInsuranceInfo;
}

