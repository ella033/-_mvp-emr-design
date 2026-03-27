import { DisRegType, DisRegTypeLabel, MinDate, 의료급여자격여부, 의료급여자격여부Label, 본인부담구분코드, 본인부담구분코드Label, 급여제한여부, 급여제한여부Label, 국적구분, 국적구분Label } from "@/constants/common/common-enum";
import type { components } from "@/generated/api/types";
import type { EtcInfo } from "@/types/nhic-response-model";
import {
  parseDateString,
  parseDateStringOrNull,
  formatDateToString,
  formatDateTimeString,
} from "@/lib/date-utils";

type EligibilityCheckResponseDto = components["schemas"]["EligibilityCheckResponseDto"];

/**
 * StringDataField에서 문자열 추출
 * 빈 json인 경우 {} 또는 { data: undefined } 형태로 올 수 있음
 */
export function getStringData(
  field: { data?: string } | Record<string, never> | undefined
): string {
  if (!field) return "";
  // 빈 json인 경우 ({} 또는 { data: undefined })
  if (Object.keys(field).length === 0) return "";
  // data 필드가 있는 경우 data 값을 반환
  const dataValue = (field as { data?: string }).data;
  return dataValue !== undefined ? dataValue : "";
}

/**
 * 숫자 데이터 추출 (undefined인 경우 0 반환)
 */
export function getNumberData(value: number | undefined): number {
  return value || 0;
}

/**
 * 본인부담구분코드(code string: "M001", "B014" 등)를 Label(설명) 문자열로 변환
 * - enum은 숫자값 기반이므로, 문자열 코드를 enum 값으로 먼저 변환한 뒤 Label을 조회한다.
 * - 매칭 실패 시에는 빈 문자열(또는 원본 코드)을 반환하도록 fallback 처리한다.
 */
export function get본인부담구분코드ToString(
  code: string | null | undefined,
  options?: { fallbackToCode?: boolean }
): string {
  if (!code) return "";
  // 일부 응답이 0/00 같은 값으로 올 수 있는 경우를 방어
  if (code === "0" || code === "00") return "";

  const enumValue = (본인부담구분코드 as unknown as Record<string, number>)[
    code
  ];
  if (typeof enumValue !== "number") {
    return options?.fallbackToCode ? code : "";
  }
  return (
    본인부담구분코드Label[enumValue as 본인부담구분코드] ??
    (options?.fallbackToCode ? code : "")
  );
}


/**
 * DiseaseRegistrationPersonBase 필드 매핑 정보
 */
export const DISEASE_REGISTRATION_FIELDS: Array<{
  key: string;
  disRegType: DisRegType;
}> = [
    { key: "산정특례희귀질환등록대상자", disRegType: DisRegType.산정특례New },
    { key: "산정특례암등록대상자1", disRegType: DisRegType.중증암 },
    { key: "산정특례화상등록대상자", disRegType: DisRegType.중증화상 },
    { key: "산정특례결핵등록대상자", disRegType: DisRegType.결핵환자산정특례 },
    { key: "산정특례극희귀등록대상자", disRegType: DisRegType.극희귀난치산정특례 },
    { key: "산정특례상세불명희귀등록대상자", disRegType: DisRegType.상세불명희귀난치산정특례New },
    { key: "산정특례중복암등록대상자2", disRegType: DisRegType.중증암 },
    { key: "산정특례중복암등록대상자3", disRegType: DisRegType.중증암 },
    { key: "산정특례중복암등록대상자4", disRegType: DisRegType.중증암 },
    { key: "산정특례중복암등록대상자5", disRegType: DisRegType.중증암 },
    { key: "산정특례중증난치질환등록대상자", disRegType: DisRegType.중증난치산정특례 },
    { key: "산정특례기타염색체이상질환등록대상자", disRegType: DisRegType.기타염색체산정특례 },
    { key: "산정특례잠복결핵등록대상자", disRegType: DisRegType.잠복결핵 },
    { key: "산정특례중증치매등록대상자", disRegType: DisRegType.치매 },
  ];

/**
 * EligibilityCheckResponseDto에서 etcInfoList 추출
 * @param eligibilityCheckResponse EligibilityCheckResponseDto 객체
 * @returns EtcInfo 배열
 */
export function extractEtcInfoListFromEligibilityCheckResponse(
  eligibilityCheckResponse: EligibilityCheckResponseDto
): EtcInfo[] {
  const etcInfoList: EtcInfo[] = [];

  DISEASE_REGISTRATION_FIELDS.forEach(({ key, disRegType }) => {
    const field = eligibilityCheckResponse[
      key as keyof EligibilityCheckResponseDto
    ] as any;
    if (field && typeof field === "object") {
      const fieldKeys = Object.keys(field);
      if (fieldKeys.length === 0) return;

      const fieldAny = field as any;
      const 특정기호 = (fieldAny["특정기호"] as string) || "";
      const 등록번호 = (fieldAny["등록번호"] as string) || "";
      const 등록일 = (fieldAny["등록일"] as string) || "";
      const 종료일 = (fieldAny["종료일"] as string) || "";
      const 상병코드 = (fieldAny["상병코드"] as string) || "";
      const 상병일련번호 = (fieldAny["상병일련번호"] as string) || "";

      if (등록일 || 특정기호 || 등록번호) {
        const registeredDate = 등록일 ? parseDateStringOrNull(등록일) : null;
        const endDate = 종료일 ? parseDateStringOrNull(종료일) : null;

        etcInfoList.push({
          disRegType,
          disRegTypeToString: DisRegTypeLabel[disRegType] || "",
          specificCode: 특정기호,
          registeredCode: 등록번호,
          registeredDate,
          registeredDateToString: formatDateToString(registeredDate),
          endDate,
          endDateToString: formatDateToString(endDate),
          corporalCode: 상병코드,
          corporalSerialNumber: 상병일련번호,
        });
      }
    }
  });

  return etcInfoList;
}

/**
 * EligibilityCheckResponseDto에서 선택요양기관 리스트 추출
 * @param eligibilityCheckResponse EligibilityCheckResponseDto 객체
 * @returns 선택요양기관 리스트
 */
export function extractChoiceHospitalListFromEligibilityCheckResponse(
  eligibilityCheckResponse: EligibilityCheckResponseDto
): Array<{ id: number; code: string; name: string }> {
  const choiceHospitalList: Array<{
    id: number;
    code: string;
    name: string;
  }> = [];

  const 선택기관기호1 = getStringData(eligibilityCheckResponse["선택기관기호1"]);
  const 선택기관기호2 = getStringData(eligibilityCheckResponse["선택기관기호2"]);
  const 선택기관기호3 = getStringData(eligibilityCheckResponse["선택기관기호3"]);
  const 선택기관기호4 = getStringData(eligibilityCheckResponse["선택기관기호4"]);
  const 선택기관이름1 = getStringData(eligibilityCheckResponse["선택기관이름1"]);
  const 선택기관이름2 = getStringData(eligibilityCheckResponse["선택기관이름2"]);
  const 선택기관이름3 = getStringData(eligibilityCheckResponse["선택기관이름3"]);
  const 선택기관이름4 = getStringData(eligibilityCheckResponse["선택기관이름4"]);

  [
    { code: 선택기관기호1, name: 선택기관이름1 },
    { code: 선택기관기호2, name: 선택기관이름2 },
    { code: 선택기관기호3, name: 선택기관이름3 },
    { code: 선택기관기호4, name: 선택기관이름4 },
  ].forEach((hospital, index) => {
    if (hospital.code) {
      choiceHospitalList.push({
        id: index + 1,
        code: hospital.code,
        name: hospital.name,
      });
    }
  });

  return choiceHospitalList;
}

/**
 * parsedData에서 직접 computedFields 계산
 * nhic-response-store를 사용하지 않고 parsedData만으로 모든 computedFields를 계산
 * @param parsedData EligibilityCheckResponseDto 객체
 * @param rawData rawData 객체 (선택적, parsedData가 빈 값일 때 사용)
 * @returns computedFields 객체
 */
export function calculateComputedFieldsFromParsedData(
  parsedData: EligibilityCheckResponseDto,
  rawData?: Record<string, never> | null
): {
  조회기준일: string;
  주민등록번호: string;
  의료급여여부: boolean;
  의료급여자격여부: string;
  선택요양기관제도선택: string;
  선택요양기관여부: string;
  선택요양기관지정일: string;
  출국자여부: string;
  자격취득일: string;
  급여제한여부: string;
  급여제한일자: string;
  본인부담구분코드: string;
  기타자격정보여부: boolean;
  건강보험자격상실처리일자: string;
  요양병원입원여부: string;
  본인확인예외: string;
  본인부담차등여부: string;
  비대면진료여부: string;
  자립준비청년여부: string;
  국적구분: string;
  방문진료본인부담경감대상자여부: string;
  산정특례환자여부: boolean;
  // 추가 필드들
  수진자성명: string;
  세대주성명: string;
  보장기관명: string;
  보장기관기호: string;
  시설기호: string;
  건강생활유지비지원금: string;
  선택요양기관목록: Array<{ id: number; code: string; name: string }>;
  기타자격정보목록: EtcInfo[];
} {
  // Date 유효성 검사 헬퍼 함수
  const isValidDate = (date: Date | undefined | null): boolean => {
    return !!(
      date &&
      !isNaN(date.getTime()) &&
      date.getTime() !== MinDate.getTime()
    );
  };

  const formatDateSafely = (date: Date | undefined | null): string => {
    if (!isValidDate(date)) return "";
    try {
      const year = date!.getFullYear();
      const month = String(date!.getMonth() + 1).padStart(2, "0");
      const day = String(date!.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // 기본 필드 추출
  const name = getStringData(parsedData["수진자성명"]);
  const residentRegistrationNumber = getStringData(parsedData["수진자주민등록번호"]);
  const 자격여부Str = getStringData(parsedData["자격여부"]);
  const 자격여부Num = parseInt(자격여부Str) || 0;
  const 자격취득일Str = getStringData(parsedData["자격취득일"]);
  const 세대주성명 = getStringData(parsedData["세대주성명"]);
  const 보장기관기호 = getStringData(parsedData["보장기관기호"]);
  const 시설기호 = getStringData(parsedData["시설기호"]);
  const 급여제한일자Str = getStringData(parsedData["급여제한일자"]);
  const 본인부담여부 = getStringData(parsedData["본인부담여부"]);
  const 건강생활유지비잔액 = getNumberData(parsedData["건강생활유지비잔액"]);
  const 출국자여부Str = getStringData(parsedData["출국자여부"]);
  const 건강보험수진자의자격상실처리일자 = getStringData(
    parsedData["건강보험수진자의자격상실처리일자"]
  );
  const 급여제한여부Str = getStringData(parsedData["급여제한여부"]);
  const 요양병원입원여부Str = getStringData(parsedData["요양병원입원여부"]);
  const 요양병원기관기호 = getStringData(parsedData["요양병원기관기호"]);
  const 국적구분Str = getStringData(parsedData["국적구분"]) || "";
  const 국적구분Num = parseInt(국적구분Str) || 0;
  // 본인확인예외여부 추출 (parsedData가 빈 객체인 경우 rawData에서 직접 확인)
  let 본인확인예외여부 = getStringData(parsedData["본인확인예외여부"]);
  // parsedData가 빈 객체이고 rawData가 있는 경우 rawData에서 직접 추출 시도
  if (!본인확인예외여부 && parsedData["본인확인예외여부"] && Object.keys(parsedData["본인확인예외여부"]).length === 0 && rawData) {
    // rawData에서 idCfrExcepYn 필드 확인 (영문 필드명)
    const rawValue = (rawData as any)?.["idCfrExcepYn"];
    if (rawValue && typeof rawValue === "string") {
      본인확인예외여부 = rawValue;
    } else if (rawValue && typeof rawValue === "object" && rawValue.data) {
      본인확인예외여부 = rawValue.data;
    }
  }
  const 본인부담차등여부 = getStringData(parsedData["본인부담차등여부"]);
  const 비대면진료대상정보 = parsedData["비대면진료대상정보"];
  const 자립준비청년대상자 = parsedData["자립준비청년대상자"];
  const 데이터입력일자 = getStringData(parsedData["데이터입력일자"]);
  const 선택기관기호1 = getStringData(parsedData["선택기관기호1"]);

  // 선택요양기관 리스트 생성
  const choiceHospitalList = extractChoiceHospitalListFromEligibilityCheckResponse(parsedData);

  // etcInfoList 생성
  const etcInfoList = extractEtcInfoListFromEligibilityCheckResponse(parsedData);

  // 급여제한여부 추출
  const 급여제한여부Num =
    급여제한여부Str === "00" ? 0 : parseInt(급여제한여부Str) || 0;

  // 날짜 변환
  const qualDate = parseDateString(자격취득일Str);
  const 급여제한일자Date = parseDateString(급여제한일자Str);
  const 건강보험자격상실처리일자Date = parseDateString(건강보험수진자의자격상실처리일자);

  // 주민등록번호 포맷팅
  const 주민등록번호 = residentRegistrationNumber
    ? residentRegistrationNumber.includes("-")
      ? residentRegistrationNumber
      : residentRegistrationNumber.slice(0, 6) +
      "-" +
      residentRegistrationNumber.slice(6)
    : "";

  // 조회기준일
  const 조회기준일 = `조회기준일 : ${formatDateTimeString(데이터입력일자)}`;

  // 의료급여 여부
  const 의료급여여부 =
    자격여부Num === 의료급여자격여부.의료급여1종 ||
    자격여부Num === 의료급여자격여부.의료급여2종;

  // 의료급여자격여부 (enum과 충돌 방지를 위해 변수명 사용)
  const 의료급여자격여부표시 =
    자격여부Num !== undefined
      ? 의료급여자격여부Label[자격여부Num as 의료급여자격여부] || ""
      : "";

  // 선택요양기관제도선택
  const 선택요양기관제도선택 = 선택기관기호1 ? "예" : "아니오";

  // 선택요양기관여부
  const 선택요양기관여부 = 선택기관기호1 ? "예" : "아니오";

  // 선택요양기관지정일 (parsedData에 직접 필드가 없음 - 빈 문자열 반환)
  const 선택요양기관지정일 = "";

  // 출국자 여부
  const 출국자여부 = 출국자여부Str === "Y" ? "예" : "아니오";

  // 자격취득일
  const 자격취득일 = formatDateSafely(qualDate);

  // 급여제한여부
  const 급여제한여부 =
    급여제한여부Num === 0
      ? "아니오"
      : 급여제한여부Label[급여제한여부Num as 급여제한여부] || "";

  // 급여제한일자
  const 급여제한일자 = formatDateSafely(급여제한일자Date);

  // 본인부담구분코드
  const 본인부담구분코드 = 본인부담여부;
  // 기타자격정보 여부
  const 기타자격정보여부 = etcInfoList.length > 0;

  // 건강보험자격상실처리일자
  const 건강보험자격상실처리일자 = formatDateSafely(건강보험자격상실처리일자Date);

  // 요양병원입원여부
  const 요양병원입원여부 =
    요양병원입원여부Str === "Y"
      ? `예(${요양병원기관기호 || ""})`
      : "아니오";

  // 본인확인필요여부 (본인확인예외여부가 "Y"이면 "예", 아니면 "아니오")
  // parsedData에서 직접 접근하여 data 필드 확인
  const 본인확인예외여부직접 = parsedData["본인확인예외여부"] as { data?: string } | undefined;
  const 본인확인예외여부값 = 본인확인예외여부직접?.data || 본인확인예외여부;
  const 본인확인예외 = 본인확인예외여부값 === "Y" ? "예" : "아니오";

  // 본인부담차등여부
  const 본인부담차등여부표시 = 본인부담차등여부 === "Y" ? "예" : "아니오";

  // 비대면진료 여부
  // 빈 객체 {}인 경우도 체크해야 함
  const 비대면진료대상정보유효 = 비대면진료대상정보 &&
    typeof 비대면진료대상정보 === "object" &&
    Object.keys(비대면진료대상정보).length > 0;
  const 비대면진료여부 = 비대면진료대상정보유효 ? "예" : "아니오";

  // 자립준비청년 여부
  // 빈 객체 {}인 경우도 체크해야 함
  const 자립준비청년대상자유효 = 자립준비청년대상자 &&
    typeof 자립준비청년대상자 === "object" &&
    Object.keys(자립준비청년대상자).length > 0;
  const 자립준비청년여부 = 자립준비청년대상자유효 ? "예" : "아니오";

  // 국적구분
  const 국적구분 = 국적구분Num !== undefined
    ? 국적구분Label[국적구분Num as 국적구분] || ""
    : "";

  // 방문진료본인부담경감대상자 (parsedData에 직접 필드가 없음 - "아니오" 반환)
  const 방문진료본인부담경감대상자여부 = "아니오";

  // 산정특례환자 여부
  const 산정특례환자여부 = etcInfoList.length > 0;

  return {
    조회기준일,
    주민등록번호,
    의료급여여부,
    의료급여자격여부: 의료급여자격여부표시,
    선택요양기관제도선택,
    선택요양기관여부,
    선택요양기관지정일,
    출국자여부,
    자격취득일,
    급여제한여부,
    급여제한일자,
    본인부담구분코드,
    기타자격정보여부,
    건강보험자격상실처리일자,
    요양병원입원여부,
    본인확인예외,
    본인부담차등여부: 본인부담차등여부표시,
    비대면진료여부,
    자립준비청년여부,
    국적구분,
    방문진료본인부담경감대상자여부,
    산정특례환자여부,
    // 추가 필드들
    수진자성명: name,
    세대주성명,
    보장기관명: 보장기관기호, // 보장기관기호로 대체
    보장기관기호,
    시설기호,
    건강생활유지비지원금: String(건강생활유지비잔액),
    선택요양기관목록: choiceHospitalList,
    기타자격정보목록: etcInfoList,
  };
}

/**
 * parsedData에서 EtcInfo의 computedFields 계산
 * @param parsedData EligibilityCheckResponseDto 객체
 * @returns EtcInfo의 computedFields 배열
 */
export function getAllEtcInfoComputedFieldsFromParsedData(
  parsedData: EligibilityCheckResponseDto
): Array<{
  산정특례유형: DisRegType;
  산정특례유형명: string;
  특정기호?: string;
  등록번호?: string;
  등록일?: Date;
  등록일표시: string;
  종료일?: Date;
  종료일표시: string;
  상병코드?: string;
  상병일련번호?: string;
}> {
  const etcInfoList = extractEtcInfoListFromEligibilityCheckResponse(parsedData);

  return etcInfoList.map((etcInfo) => {
    const formatDateSafely = (date: Date | null | undefined): string => {
      if (!date) return "";
      // MinDate (1970-01-01)인지 확인
      if (
        date.getTime() === MinDate.getTime() ||
        date.getFullYear() === 1970
      )
        return "";
      try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch {
        return "";
      }
    };

    return {
      산정특례유형: etcInfo.disRegType,
      산정특례유형명: etcInfo.disRegTypeToString || "",
      특정기호: etcInfo.specificCode,
      등록번호: etcInfo.registeredCode,
      등록일: etcInfo.registeredDate || undefined,
      등록일표시: formatDateSafely(etcInfo.registeredDate),
      종료일: etcInfo.endDate || undefined,
      종료일표시: formatDateSafely(etcInfo.endDate),
      상병코드: etcInfo.corporalCode,
      상병일련번호: etcInfo.corporalSerialNumber,
    };
  });
}

/**
 * extraQualification에서 추가자격 필드들을 필터링하여 반환
 * @param extraQualification InsuranceInfo의 extraQualification 필드
 * @returns 필터링된 추가자격 필드들의 키-값 쌍
 */
export function getDiseaseRegistrationFieldsFromExtraQualification(
  extraQualification?: Record<string, any>
): Record<string, any> {
  if (!extraQualification || Object.keys(extraQualification).length === 0) {
    return {};
  }

  // EligibilityCheckResponseDto의 모든 추가자격 관련 필드 키들
  const additionalQualificationKeys = [
    // DiseaseRegistrationPersonBase 타입 필드들
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
    // 기타 추가자격 필드들
    "희귀난치의료비지원대상자",
    "당뇨병요양비대상자등록일",
    "당뇨병요양비대상자유형",
    "급여제한일자",
    "급여제한여부",
    "출국자여부",
    "조산아및저체중출생아등록대상자",
    "요양병원입원여부",
    "비대면진료대상정보",
    "자립준비청년대상자",
    "본인부담차등여부",
  ];

  const result: Record<string, any> = {};
  additionalQualificationKeys.forEach((key) => {
    if (extraQualification[key]) {
      result[key] = extraQualification[key];
    }
  });

  return result;
}

/**
 * extraQualification에서 추가자격 목록(extraQualificationStrList)을 생성
 * getDiseaseRegistrationFieldsFromExtraQualification를 내부적으로 사용하여 통합
 * @param extraQualification InsuranceInfo의 extraQualification 필드
 * @returns 추가자격 목록 문자열 배열
 */
export function getExtraQualificationStrListFromExtraQualification(
  extraQualification?: Record<string, any>
): string[] {
  if (!extraQualification || Object.keys(extraQualification).length === 0) {
    return [];
  }

  // 먼저 필터링된 필드들을 가져옴
  const filteredFields = getDiseaseRegistrationFieldsFromExtraQualification(extraQualification);

  const result: string[] = [];

  // extraQualification의 키를 DisRegType으로 매핑
  const diseaseRegistrationMapping: Record<string, DisRegType> = {
    "산정특례희귀질환등록대상자": DisRegType.산정특례New,
    "산정특례암등록대상자1": DisRegType.중증암,
    "산정특례화상등록대상자": DisRegType.중증화상,
    "산정특례결핵등록대상자": DisRegType.결핵환자산정특례,
    "산정특례극희귀등록대상자": DisRegType.극희귀난치산정특례,
    "산정특례상세불명희귀등록대상자": DisRegType.상세불명희귀난치산정특례New,
    "산정특례중복암등록대상자2": DisRegType.중증암,
    "산정특례중복암등록대상자3": DisRegType.중증암,
    "산정특례중복암등록대상자4": DisRegType.중증암,
    "산정특례중복암등록대상자5": DisRegType.중증암,
    "산정특례중증난치질환등록대상자": DisRegType.중증난치산정특례,
    "산정특례기타염색체이상질환등록대상자": DisRegType.기타염색체산정특례,
    "산정특례잠복결핵등록대상자": DisRegType.잠복결핵,
    "당뇨병요양비대상자유형": DisRegType.당뇨병,
    "산정특례중증치매등록대상자": DisRegType.치매,
    "급여제한여부": DisRegType.급여제한,
    "출국자여부": DisRegType.출국자,
    "조산아및저체중출생아등록대상자": DisRegType.조산아,
    "요양병원입원여부": DisRegType.요양병원입원,
    "비대면진료대상정보": DisRegType.비대면대상자,
    "자립준비청년대상자": DisRegType.자립준비청년,
    "본인부담차등여부": DisRegType.본인부담차등여부,
  };

  // 필터링된 필드들의 각 키를 확인하여 해당하는 DisRegType의 Label을 추가
  Object.keys(filteredFields).forEach((key) => {
    const disRegType = diseaseRegistrationMapping[key];

    // disRegType이 0일 수도 있으므로 !== undefined로 체크해야 함
    if (disRegType !== undefined && DisRegTypeLabel[disRegType]) {
      // 실제 데이터가 있는지 확인 (빈 객체가 아닌지 체크)
      const field = filteredFields[key];

      if (field && typeof field === "object") {
        // 빈 json 체크
        const fieldKeys = Object.keys(field);

        if (fieldKeys.length === 0) {
          // 빈 json인 경우 스킵
          return;
        }

        const fieldAny = field as any;

        // NonFaceToFaceDiagnosisInfo 타입 필드 처리 (비대면진료대상정보) - 먼저 확인
        // 섬벽지거주여부, 장애등록여부, 장기요양등급여부, 응급취약지거주여부 중 하나라도 "Y"인 값이 있으면 유효한 데이터로 간주
        if (key === "비대면진료대상정보") {
          const 섬벽지거주여부 = (fieldAny["섬벽지거주여부"] as any);
          const 장애등록여부 = (fieldAny["장애등록여부"] as any);
          const 장기요양등급여부 = (fieldAny["장기요양등급여부"] as any);
          const 응급취약지거주여부 = (fieldAny["응급취약지거주여부"] as any);

          // 각 필드가 문자열 "Y"인지 확인 (data 속성이 아닌 직접 문자열)
          const hasValid섬벽지 = 섬벽지거주여부 === "Y";
          const hasValid장애 = 장애등록여부 === "Y";
          const hasValid장기요양 = 장기요양등급여부 === "Y";
          const hasValid응급취약지 = 응급취약지거주여부 === "Y";

          // 하나라도 유효한 값이 있으면 유효한 데이터로 간주
          if (hasValid섬벽지 || hasValid장애 || hasValid장기요양 || hasValid응급취약지) {
            const label = DisRegTypeLabel[disRegType];
            if (!result.includes(label)) {
              result.push(label);
            }
          }
          return;
        }

        // StringDataField 타입 필드 처리 ({ data: "..." } 형태)
        // data 속성이 있고, 등록일/특정기호/등록번호가 없으면 StringDataField로 간주
        if ("data" in field && !("등록일" in field) && !("특정기호" in field) && !("등록번호" in field)) {
          const data = (fieldAny["data"] as string) || "";
          // data가 있고 비어있지 않으며 "N"이 아니면 유효한 데이터로 간주
          if (data && data.trim() !== "" && data.trim() !== "N") {
            const label = DisRegTypeLabel[disRegType];
            if (!result.includes(label)) {
              result.push(label);
            }
          }
          return;
        }

        // DiseaseRegistrationPersonBase 타입 필드 처리
        // 등록일이나 특정기호나 등록번호가 있으면 유효한 데이터로 간주
        const 등록일 = (fieldAny["등록일"] as string) || "";
        const 특정기호 = (fieldAny["특정기호"] as string) || "";
        const 등록번호 = (fieldAny["등록번호"] as string) || "";

        if (등록일 || 특정기호 || 등록번호) {
          // 중복 제거 (같은 DisRegType이 여러 번 나타날 수 있음)
          const label = DisRegTypeLabel[disRegType];
          if (!result.includes(label)) {
            result.push(label);
          }
        }
      }
    }
  });

  return result;
}

/**
 * DiseaseRegistrationPersonBase 데이터를 Date로 변환
 * @param dateStr YYYYMMDD 형식의 문자열
 * @returns Date 객체 또는 null
 */
function parseDiseaseRegistrationDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr.length !== 8) return null;
  try {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * BaseDisReg 타입 데이터를 DiseaseRegistrationPersonBase 형식으로 변환
 * @param data BaseDisReg 타입 데이터
 * @returns DiseaseRegistrationPersonBase 형식 데이터
 */
export function convertBaseDisRegToDiseaseRegistration(data: {
  specificCode: string;
  registeredCode: string;
  registeredDate: Date | null;
  validity: Date | null;
  corporalCode?: string;
  corporalSerialNumber?: string;
}): Record<string, any> {
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  return {
    특정기호: data.specificCode || "",
    등록번호: data.registeredCode || "",
    등록일: formatDate(data.registeredDate),
    종료일: formatDate(data.validity),
    상병코드: data.corporalCode || "",
    상병일련번호: data.corporalSerialNumber || "",
  };
}

/**
 * DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
 * @param data DisRegPrsonOtherInfo 데이터
 * @returns BaseDisReg 타입 데이터
 */
export function convertDisRegPrsonOtherInfoToBaseDisReg(data: Record<string, any>): {
  isData: boolean;
  division: number;
  specificCode: string;
  registeredCode: string;
  registeredDate: Date | null;
  validity: Date | null;
  corporalCode?: string;
  corporalSerialNumber?: string;
} {
  const 특정기호 = (data["특정기호"] as string) || "";
  const 등록번호 = (data["등록번호"] as string) || "";
  const 등록일 = (data["등록일"] as string) || "";
  const 종료일 = (data["종료일"] as string) || "";
  const 상병코드 = (data["상병코드"] as string) || "";
  const 상병일련번호 = (data["상병일련번호"] as string) || "";

  return {
    isData: !!(등록일 || 특정기호 || 등록번호),
    division: 0, // DisRegPrsonOtherInfo에는 division이 없으므로 기본값 0
    specificCode: 특정기호,
    registeredCode: 등록번호,
    registeredDate: parseDiseaseRegistrationDate(등록일),
    validity: parseDiseaseRegistrationDate(종료일),
    corporalCode: 상병코드 || undefined,
    corporalSerialNumber: 상병일련번호 || undefined,
  };
}

