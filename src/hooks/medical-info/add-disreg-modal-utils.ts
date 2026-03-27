import { components } from '@/generated/api/types';
import { ADDITIONAL_QUALIFICATION_OPTIONS, STRING_DATA_FIELD_KEYS } from '@/constants/common/additional-qualification-options';
import { 급여제한여부 } from "@/constants/common/common-enum";

type DisRegPrsonCancerInfo = components["schemas"]["DisRegPrsonCancerInfo"];
type DisRegPrson1Info = components["schemas"]["DisRegPrson1Info"];
type DisRegPrsonOtherInfo = components["schemas"]["DisRegPrsonOtherInfo"];
type NonFaceToFaceDiagnosisInfo = components["schemas"]["NonFaceToFaceDiagnosisInfo"];
type SelfPreparationPersonInfo = components["schemas"]["SelfPreparationPersonInfo"];
type PreInfantInfo = components["schemas"]["PreInfantInfo"];


/**
 * 서버 DTO 타입 DisRegPrsonCancerInfo의 기본값 생성
 */
export function createDefaultDisRegPrsonCancerInfo(): DisRegPrsonCancerInfo {
  return {
    원본데이터: "",
    특정기호: {},
    등록번호: {},
    등록일: {},
    종료일: {},
    상병기호: {},
    상병일련번호: {},
    등록구분: {},
  };
}

/**
 * 서버 DTO 타입 DisRegPrson1Info의 기본값 생성
 */
export function createDefaultDisRegPrson1Info(): DisRegPrson1Info {
  return {
    원본데이터: "",
    특정기호: {},
    승인일: {},
    종료일: {},
  };
}

/**
 * 서버 DTO 타입 DisRegPrsonOtherInfo의 기본값 생성
 */
export function createDefaultDisRegPrsonOtherInfo(): DisRegPrsonOtherInfo {
  return {
    원본데이터: "",
    특정기호: {},
    등록번호: {},
    등록일: {},
    종료일: {},
    상병코드: {},
    상병일련번호: {},
  };
}

/**
 * 필드가 유효한 값인지 확인 (숫자, 비지 않은 문자열, 키가 있는 객체)
 */
function hasMeaningfulFieldValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number" && !Number.isNaN(value)) return true;
  if (typeof value === "string" && value.trim() !== "") return true;
  if (typeof value === "object" && Object.keys(value as object).length > 0) return true;
  return false;
}

/**
 * PreInfantInfo에 실제 데이터가 있는지 확인 (빈 객체 {}만 있으면 false)
 * 등록번호는 숫자/문자열/객체 모두 유효 값으로 처리
 */
function hasMeaningfulPreInfantData(data: Record<string, any>): boolean {
  if (hasMeaningfulFieldValue(data["등록번호"])) return true;
  if (hasMeaningfulFieldValue(data["시작유효일자"])) return true;
  if (hasMeaningfulFieldValue(data["종료유효일자"])) return true;
  return false;
}

/**
 * SelfPreparationPersonInfo에 실제 데이터가 있는지 확인 (빈 객체 {}만 있으면 false)
 * 특정기호 등은 숫자/문자열/객체 모두 유효 값으로 처리
 */
function hasMeaningfulSelfPrepData(data: Record<string, any>): boolean {
  if (hasMeaningfulFieldValue(data["특정기호"])) return true;
  if (hasMeaningfulFieldValue(data["지원시작일"])) return true;
  if (hasMeaningfulFieldValue(data["지원종료일"])) return true;
  return false;
}

/**
 * extraQualification에서 선택된 eligibilityKey 목록 추출
 * 중증암의 경우 "산정특례암등록대상자1"만 체크 (중복암2~5는 별도로 표시하지 않음)
 */
export function getSelectedEligibilityKeys(extraQualification?: Record<string, any>): string[] {
  if (!extraQualification || Object.keys(extraQualification).length === 0) {
    return [];
  }

  const selectedKeys: string[] = [];

  ADDITIONAL_QUALIFICATION_OPTIONS.forEach(option => {
    // 중증암의 경우: "산정특례암등록대상자1" 또는 중복암2~5 중 하나라도 있으면 선택된 것으로 간주
    if (option.eligibilityKey === "산정특례암등록대상자1") {
      const hasCancerData =
        (extraQualification["산정특례암등록대상자1"] &&
          typeof extraQualification["산정특례암등록대상자1"] === "object" &&
          Object.keys(extraQualification["산정특례암등록대상자1"]).length > 0) ||
        (extraQualification["산정특례중복암등록대상자2"] &&
          typeof extraQualification["산정특례중복암등록대상자2"] === "object" &&
          Object.keys(extraQualification["산정특례중복암등록대상자2"]).length > 0) ||
        (extraQualification["산정특례중복암등록대상자3"] &&
          typeof extraQualification["산정특례중복암등록대상자3"] === "object" &&
          Object.keys(extraQualification["산정특례중복암등록대상자3"]).length > 0) ||
        (extraQualification["산정특례중복암등록대상자4"] &&
          typeof extraQualification["산정특례중복암등록대상자4"] === "object" &&
          Object.keys(extraQualification["산정특례중복암등록대상자4"]).length > 0) ||
        (extraQualification["산정특례중복암등록대상자5"] &&
          typeof extraQualification["산정특례중복암등록대상자5"] === "object" &&
          Object.keys(extraQualification["산정특례중복암등록대상자5"]).length > 0);

      if (hasCancerData) {
        selectedKeys.push(option.eligibilityKey);
      }
    } else {
      // 다른 항목들은 데이터 타입에 따라 처리
      const data = extraQualification[option.eligibilityKey];

      // 비대면진료대상정보는 NonFaceToFaceDiagnosisInfo 타입으로 별도 처리
      if (option.eligibilityKey === "비대면진료대상정보") {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          const 섬벽지거주여부 = (data["섬벽지거주여부"] as any);
          const 장애등록여부 = (data["장애등록여부"] as any);
          const 장기요양등급여부 = (data["장기요양등급여부"] as any);
          const 응급취약지거주여부 = (data["응급취약지거주여부"] as any);

          // 각 필드가 문자열 "Y"인지 확인 (data 속성이 아닌 직접 문자열)
          const hasValid섬벽지 = 섬벽지거주여부 === "Y";
          const hasValid장애 = 장애등록여부 === "Y";
          const hasValid장기요양 = 장기요양등급여부 === "Y";
          const hasValid응급취약지 = 응급취약지거주여부 === "Y";

          // 하나라도 유효한 값이 있으면 선택된 것으로 간주
          if (hasValid섬벽지 || hasValid장애 || hasValid장기요양 || hasValid응급취약지) {
            selectedKeys.push(option.eligibilityKey);
          }
        }
      } else if (STRING_DATA_FIELD_KEYS.has(option.eligibilityKey)) {
        // StringDataField 타입: { data: "값" } 형태
        // 모달에서도 data가 "N"이거나 빈 문자열인 경우는 체크박스에 표시하지 않음 (하지만 extraQualification에는 데이터로 유지)
        if (data && typeof data === "object" && "data" in data && data.data) {
          const dataValue = (data.data as string) || "";
          // data가 있고 비어있지 않으며 "N"이 아니면 선택된 것으로 간주 (모달에서 표시)
          if (dataValue.trim() !== "" && dataValue.trim() !== "N") {
            selectedKeys.push(option.eligibilityKey);
          }
        }
      } else if (option.eligibilityKey === "조산아및저체중출생아등록대상자") {
        // PreInfantInfo: {} 또는 원본데이터/등록번호/시작유효일자/종료유효일자에 실제 값이 있을 때만 선택
        if (data && typeof data === "object" && !("data" in data) && hasMeaningfulPreInfantData(data)) {
          selectedKeys.push(option.eligibilityKey);
        }
      } else if (option.eligibilityKey === "자립준비청년대상자") {
        // SelfPreparationPersonInfo: {} 또는 원본데이터/특정기호/지원시작일/지원종료일에 실제 값이 있을 때만 선택
        if (data && typeof data === "object" && !("data" in data) && hasMeaningfulSelfPrepData(data)) {
          selectedKeys.push(option.eligibilityKey);
        }
      } else if (option.eligibilityKey === "방문진료대상정보") {
        // VisitMedicalCareTargetInfo: 요양비인공호흡기산소치료대상여부/장기요양대상여부 중 "Y"가 있으면 선택
        if (data && typeof data === "object" && !("data" in data)) {
          const has요양비 = (data["요양비인공호흡기산소치료대상여부"] as any) === "Y";
          const has장기요양 = (data["장기요양대상여부"] as any) === "Y";
          if (has요양비 || has장기요양) {
            selectedKeys.push(option.eligibilityKey);
          }
        }
      } else {
        // DiseaseRegistrationPersonBase 타입: { 특정기호: "", 등록일: "", ... } 형태
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          selectedKeys.push(option.eligibilityKey);
        }
      }
    }
  });

  return selectedKeys;
}

/**
 * extraQualification에서 DisRegPrsonCancerInfo 배열 추출 (중증암)
 * 중증암 관련 키들(산정특례암등록대상자1, 산정특례중복암등록대상자2~5)을 모두 수집하여 하나의 배열로 반환
 * 서버 DTO 타입 그대로 반환
 */
export function getCancerDataFromExtraQualification(
  extraQualification?: Record<string, any>
): DisRegPrsonCancerInfo[] {
  if (!extraQualification) return [];

  const cancerKeys = [
    "산정특례암등록대상자1",
    "산정특례중복암등록대상자2",
    "산정특례중복암등록대상자3",
    "산정특례중복암등록대상자4",
    "산정특례중복암등록대상자5",
  ];

  const cancerData: DisRegPrsonCancerInfo[] = [];
  cancerKeys.forEach((key) => {
    const data = extraQualification[key];
    if (data && typeof data === "object" && Object.keys(data).length > 0 && !("data" in data)) {
      // 서버 DTO 타입 그대로 사용
      cancerData.push(data as DisRegPrsonCancerInfo);
    }
  });

  return cancerData;
}

/**
 * DisRegPrsonCancerInfo 배열을 extraQualification 형식으로 변환
 * 첫 번째는 "산정특례암등록대상자1", 나머지는 "산정특례중복암등록대상자2~5"에 저장
 * 서버 DTO 타입 그대로 저장
 */
export function convertCancerDataToExtraQualification(
  cancerData: DisRegPrsonCancerInfo[]
): Record<string, DisRegPrsonCancerInfo> {
  const result: Record<string, DisRegPrsonCancerInfo> = {};
  const cancerKeys = [
    "산정특례암등록대상자1",
    "산정특례중복암등록대상자2",
    "산정특례중복암등록대상자3",
    "산정특례중복암등록대상자4",
    "산정특례중복암등록대상자5",
  ];

  // 유효한 데이터만 저장 (빈 객체가 아닌 경우)
  const validCancers = cancerData.filter(cancer => {
    const keys = Object.keys(cancer);
    return keys.length > 0 && (cancer.등록일 || cancer.특정기호 || cancer.등록번호);
  });

  validCancers.forEach((cancer, index) => {
    if (index < cancerKeys.length) {
      // 서버 DTO 타입 그대로 저장
      result[cancerKeys[index]!] = cancer;
    }
  });

  return result;
}

/**
 * extraQualification에서 DiseaseRegistration 타입 데이터를 직접 읽기
 * - StringDataField(예: { data: "값" }) 형태는 null 반환
 * - eligibilityKey에 따라 서버 DTO 타입을 좁혀 반환
 */
export function getDiseaseRegistrationFromExtraQualification(
  extraQualification: Record<string, any> | undefined,
  eligibilityKey: string
): DisRegPrsonOtherInfo | DisRegPrson1Info | DisRegPrsonCancerInfo | null {
  if (!extraQualification) return null;

  const field = extraQualification[eligibilityKey];
  if (!field || typeof field !== "object" || Object.keys(field).length === 0) {
    return null;
  }

  // StringDataField 타입인지 확인 (data 속성이 있으면 StringDataField)
  if ("data" in field) {
    return null;
  }

  if (
    eligibilityKey === "산정특례암등록대상자1" ||
    eligibilityKey.startsWith("산정특례중복암등록대상자")
  ) {
    return field as DisRegPrsonCancerInfo;
  }

  if (eligibilityKey === "희귀난치의료비지원대상자") {
    return field as DisRegPrson1Info;
  }

  return field as DisRegPrsonOtherInfo;
}

/**
 * extraQualification에서 중증암 데이터 배열 추출 (폼 표시용)
 */
export function getCancerDataFromExtraQualificationForForm(
  extraQualification: Record<string, any> | undefined
): DisRegPrsonCancerInfo[] {
  if (!extraQualification) return [];
  return getCancerDataFromExtraQualification(extraQualification);
}

/**
 * extraQualification에서 중증치매 데이터(산정특례중증치매등록대상자) 추출
 * - DiseaseRegistrationPersonBase 계열(DisRegPrsonOtherInfo)로 반환
 */
export function getDementiaMainDataFromExtraQualification(
  extraQualification: Record<string, any> | undefined
): DisRegPrsonOtherInfo | null {
  return getDiseaseRegistrationFromExtraQualification(
    extraQualification,
    "산정특례중증치매등록대상자"
  ) as DisRegPrsonOtherInfo | null;
}

/**
 * extraQualification에서 급여제한 데이터 추출
 */
export function getQualRestrictDataFromExtraQualification(
  extraQualification: Record<string, any> | undefined
): 급여제한여부 | null {
  if (!extraQualification) return null;

  const qualRestrictTypeField = extraQualification["급여제한여부"];
  if (qualRestrictTypeField && typeof qualRestrictTypeField === "object" && qualRestrictTypeField.data) {
    return parseInt(qualRestrictTypeField.data) as 급여제한여부;
  }
  return null;
}

/**
 * StringDataField 타입(예: { data: "..." })인 key의 data 값을 추출
 * - key가 stringFieldKeys 목록에 없으면 null
 * - data가 빈 문자열/undefined이면 null
 */
export function getStringFieldKeysDataFromExtraQualification(
  extraQualification: Record<string, any> | undefined,
  key: string
): string | null {
  if (!extraQualification) return null;

  const stringFieldKeys = new Set([
    "당뇨병요양비대상자유형",
    "급여제한여부",
    "출국자여부",
    "요양병원입원여부",
    "본인부담차등여부",
  ]);

  if (!stringFieldKeys.has(key)) return null;

  const field = extraQualification[key];
  if (!field || typeof field !== "object" || !("data" in field)) return null;

  const raw = (field as any).data;
  const value = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  return value === "" ? null : value;
}

/**
 * NonFaceToFaceDiagnosisInfo의 기본값 생성
 */
export function createDefaultNonFaceToFaceDiagnosisInfo(): NonFaceToFaceDiagnosisInfo {
  return {
    섬벽지거주여부: {},
    장애등록여부: {},
    장기요양등급여부: {},
    응급취약지거주여부: {},
  };
}

/**
 * extraQualification에서 비대면진료대상정보 추출
 * - { data: "..." } 형태가 끼어들면 제거
 */
export function getNonFaceToFaceDiagnosisInfoFromExtraQualification(
  extraQualification: Record<string, any> | undefined
): NonFaceToFaceDiagnosisInfo | null {
  if (!extraQualification) return null;

  const data = extraQualification["비대면진료대상정보"];
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null;
  }

  // data 속성이 있으면 제거하고 올바른 형태로 변환
  const cleanedData: Record<string, any> = {};
  Object.keys(data).forEach((k) => {
    if (k !== "data") cleanedData[k] = data[k];
  });

  return cleanedData as NonFaceToFaceDiagnosisInfo;
}

/**
 * SelfPreparationPersonInfo의 기본값 생성
 */
export function createDefaultSelfPreparationPersonInfo(): SelfPreparationPersonInfo {
  return {
    특정기호: {},
    지원시작일: {},
    지원종료일: {},
  };
}

/**
 * PreInfantInfo의 기본값 생성 (조산아및저체중출생아등록대상자)
 * 실제 런타임 데이터는 string이므로 빈 문자열로 초기화
 */
export function createDefaultPreInfantInfo(): PreInfantInfo {
  return {
    등록번호: {},
    시작유효일자: {},
    종료유효일자: {},
  };
}

/**
 * extraQualification에서 조산아및저체중출생아등록대상자 추출
 * - 객체 형태이고 StringDataField({ data: ... })가 아니면 그대로 반환
 * - 없거나 형태가 다르면 null 반환
 */
export function getPreInfantInfoFromExtraQualification(
  extraQualification: Record<string, any> | undefined
): PreInfantInfo | null {
  if (!extraQualification) return null;

  const field = extraQualification["조산아및저체중출생아등록대상자"];
  if (!field || typeof field !== "object" || "data" in field || Object.keys(field).length === 0) {
    return null;
  }

  return field as PreInfantInfo;
}

/**
 * extraQualification에서 자립준비청년대상자 추출
 * - 객체 형태이고 StringDataField({ data: ... })가 아니면 그대로 반환
 * - 없거나 형태가 다르면 null 반환
 */
export function getSelfPreparationPersonInfoFromExtraQualification(
  extraQualification: Record<string, any> | undefined
): SelfPreparationPersonInfo | null {
  if (!extraQualification) return null;

  const field = extraQualification["자립준비청년대상자"];
  if (!field || typeof field !== "object" || "data" in field || Object.keys(field).length === 0) {
    return null;
  }

  return field as SelfPreparationPersonInfo;
}