/**
 * 공통 Enum 정의
 * C# enum들을 TypeScript로 변환
 * nhmp-literal-types를 통합하여 중복 제거
 */

export const MaxDate = new Date(9999, 11, 31, 23, 59, 59, 999); // 9999-12-31T23:59:59.999Z
export const MinDate = new Date(0); // 1970-01-01T00:00:00.000Z
export const DefaultDate = new Date(); // Current date

/**
 * 접수 상세 화면에서 사용하는 탭 식별자
 */
export enum ReceptionInitialTab {
  환자정보 = "patientInfo",
  처방조회 = "patientChart",
  보험이력변경 = "insuranceHistory",
  수납정보 = "paymentInfo",
  미수환불 = "notPaid",
  예약현황 = "appointmentHistory",
  출력센터 = "printCenter",
}

/**
 * 진료형태 Enum
 */
export enum 진료형태 {
  입원 = 1,
  외래 = 2,
  약국처방조제 = 3,
  약국직접조제 = 4,
}

/**
 * 진료형태 Label
 */
export const 진료형태Label: Record<진료형태, string> = {
  [진료형태.입원]: "입원",
  [진료형태.외래]: "외래",
  [진료형태.약국처방조제]: "약국처방조제",
  [진료형태.약국직접조제]: "약국직접조제",
};

/**
 * 퇴원구분코드 Enum
 */
export enum 퇴원구분코드 {
  입원중 = 1,
  퇴원 = 2,
  기타 = 9,
}

/**
 * 퇴원구분코드 Label
 */
export const 퇴원구분코드Label: Record<퇴원구분코드, string> = {
  [퇴원구분코드.입원중]: "입원중",
  [퇴원구분코드.퇴원]: "퇴원",
  [퇴원구분코드.기타]: "기타",
};

/**
 * 의료급여자격여부 Enum
 */
export enum 의료급여자격여부 {
  해당없음 = 0,
  지역세대주 = 1,
  지역세대원 = 2,
  임의계속직장가입자 = 4,
  직장가입자 = 5,
  직장피부양자 = 6,
  의료급여1종 = 7,
  의료급여2종 = 8,
}

/**
 * 의료급여자격여부 Label
 */
export const 의료급여자격여부Label: Record<의료급여자격여부, string> = {
  [의료급여자격여부.해당없음]: "",
  [의료급여자격여부.지역세대주]: "지역세대주",
  [의료급여자격여부.지역세대원]: "지역세대원",
  [의료급여자격여부.임의계속직장가입자]: "임의계속직장가입자",
  [의료급여자격여부.직장가입자]: "직장가입자",
  [의료급여자격여부.직장피부양자]: "직장피부양자",
  [의료급여자격여부.의료급여1종]: "의료급여1종",
  [의료급여자격여부.의료급여2종]: "의료급여2종",
};

/**
 * 본인부담구분코드 Enum
 */
export enum 본인부담구분코드 {
  // 수진자자격조회
  해당없음 = 0,
  M001 = 1, // 선택기관적용자(조건부연장 승인자) 1종
  M002 = 2, // 선택기관자발적참여자 1종
  M003 = 3, // 18세 미만인자 1종
  M004 = 4, // 임신부 1종
  M005 = 5, // (구)희귀난치성질환자 1종
  M006 = 6, // 장기이식 환자 1종
  M007 = 7, // 20세 이하인자로 중 고등학교재학중인자 1종
  M008 = 8, // 가정간호대상자 1종
  M011 = 11, // 행려환자 1종
  M012 = 12, // 노숙인 진료시설을 이용하는 노숙인 1종
  M015 = 15, // 등록 희귀난치성질환자1종
  M016 = 16, // 등록 중증질환자 1종
  M017 = 17, // 등록 결핵질환자 1종
  M018 = 18, // 등록 희귀질환자 1종
  M019 = 19, // 등록 중증난치질환자1종

  B001 = 101, // 선택기관 적용자(조건부연장 승인자) 2종
  B002 = 102, // 선택기관 자발적참여자 2종
  B011 = 111, // 등록 조산아 및 저체중 출생아 2종
  B014 = 114, // 연장승인(선택의료급여기관) 미신청자(불승인자) 1,2종

  // 건생비 승인차감 요청
  M009 = 9, // 응급환자 선택의료급여기관 이용자 1종
  M099 = 99, // 코로나19 국비지원 진단검사 시 동시 진료한 진단검사 외 외래진료 1종
  M010 = 10, // 장애인 보조기기 지급받는 선택의료급여기관 이용자 1종
  M013 = 13, // 응급 분만으로 노숙인 진료시설 이외의 의료급여기관을 이용하는 노숙인 1종
  M014 = 14, // 노숙인진료시설에서 의뢰되어 제3차 의료급여기관을 이용하는 노숙인 1종

  B003 = 103, // 응급환자 선택의료급여기관 이용자 2종
  B004 = 104, // 장애인 보조기기 지급받는 선택의료급여기관 이용자 2종
  B005 = 105, // 선택의료급여기관에서 의뢰된 자 1.2종
  B006 = 106, // 선택의료급여기관에서 의뢰되어 재의뢰된 이용자 1.2종
  B007 = 107, // 장기요양기관에서 진료받은 자 1.2종
  B008 = 108, // 제 3선택 또는 제 4선택기관에서 진료받은 자
  B009 = 109, // 경과규정 적용자 등 의뢰서 제출 같음 대상자 1.2종
  B010 = 110, // 임신부 2종
  B012 = 112, // 정신질환자가 조현병외의 정신질환으로 관련 진료를 받은 당일 외래진료 2종
  B013 = 113, // 별표4의2 구분6 과 구분7에 해당하는 치매질환으로 진료받은 외래진료
  B015 = 115, // 1세 미만 수급권자 중 만성질환자의 외래진료 2종
  B030 = 130, // 잠복결핵 치료 관련 진료 1,2종
  B099 = 199, // 전염병확산등 긴급사유로 급여를 받은 선택기관적용자
}

export enum 잠복결핵타입 {
  없음 = 0,
  검진 = 1,
  진료 = 2,
}
/**
 * 본인부담구분코드 Label
 */
export const 본인부담구분코드Label: Record<본인부담구분코드, string> = {
  [본인부담구분코드.해당없음]: "",
  [본인부담구분코드.M001]: "선택기관적용자(조건부연장 승인자) 1종",
  [본인부담구분코드.M002]: "선택기관자발적참여자 1종",
  [본인부담구분코드.M003]: "18세 미만인자 1종",
  [본인부담구분코드.M004]: "임신부 1종",
  [본인부담구분코드.M005]: "(구)희귀난치성질환자 1종",
  [본인부담구분코드.M006]: "장기이식 환자 1종",
  [본인부담구분코드.M007]: "20세 이하인자로 중 고등학교재학중인자 1종",
  [본인부담구분코드.M008]: "가정간호대상자 1종",
  [본인부담구분코드.M011]: "행려환자 1종",
  [본인부담구분코드.M012]: "노숙인 진료시설을 이용하는 노숙인 1종",
  [본인부담구분코드.M015]: "등록 희귀난치성질환자1종",
  [본인부담구분코드.M016]: "등록 중증질환자 1종",
  [본인부담구분코드.M017]: "등록 결핵질환자 1종",
  [본인부담구분코드.M018]: "등록 희귀질환자 1종",
  [본인부담구분코드.M019]: "등록 중증난치질환자1종",
  [본인부담구분코드.B001]: "선택기관 적용자(조건부연장 승인자) 2종",
  [본인부담구분코드.B002]: "선택기관 자발적참여자 2종",
  [본인부담구분코드.B011]: "등록 조산아 및 저체중 출생아 2종",
  [본인부담구분코드.B014]: "연장승인(선택의료급여기관) 미신청자(불승인자) 1,2종",
  [본인부담구분코드.M009]: "응급환자 선택의료급여기관 이용자 1종",
  [본인부담구분코드.M099]: "코로나19 국비지원 진단검사 시 동시 진료한 진단검사 외 외래진료 1종",
  [본인부담구분코드.M010]: "장애인 보조기기 지급받는 선택의료급여기관 이용자 1종",
  [본인부담구분코드.M013]:
    "응급 분만으로 노숙인 진료시설 이외의 의료급여기관을 이용하는 노숙인 1종",
  [본인부담구분코드.M014]: "노숙인진료시설에서 의뢰되어 제3차 의료급여기관을 이용하는 노숙인 1종",
  [본인부담구분코드.B003]: "응급환자 선택의료급여기관 이용자 2종",
  [본인부담구분코드.B004]: "장애인 보조기기 지급받는 선택의료급여기관 이용자 2종",
  [본인부담구분코드.B005]: "선택의료급여기관에서 의뢰된 자 1.2종",
  [본인부담구분코드.B006]: "선택의료급여기관에서 의뢰되어 재의뢰된 이용자 1.2종",
  [본인부담구분코드.B007]: "장기요양기관에서 진료받은 자 1.2종",
  [본인부담구분코드.B008]: "제 3선택 또는 제 4선택기관에서 진료받은 자",
  [본인부담구분코드.B009]: "경과규정 적용자 등 의뢰서 제출 같음 대상자 1.2종",
  [본인부담구분코드.B010]: "임신부 2종",
  [본인부담구분코드.B012]:
    "정신질환자가 조현병외의 정신질환으로 관련 진료를 받은 당일 외래진료 2종",
  [본인부담구분코드.B013]: "별표4의2 구분6 과 구분7에 해당하는 치매질환으로 진료받은 외래진료",
  [본인부담구분코드.B015]: "1세 미만 수급권자 중 만성질환자의 외래진료 2종",
  [본인부담구분코드.B030]: "잠복결핵 치료 관련 진료 1,2종",
  [본인부담구분코드.B099]: "전염병확산등 긴급사유로 급여를 받은 선택기관적용자",
};

/**
 * 급여제한여부 Enum
 */
export enum 급여제한여부 {
  해당없음 = 0,
  무자격자 = 1,
  보험료체납자 = 2,
  재외국인보험료체납자 = 3,
  사망자 = 4,
  국외이민자 = 5,
}

/**
 * 급여제한여부 Label
 */
export const 급여제한여부Label: Record<급여제한여부, string> = {
  [급여제한여부.해당없음]: "",
  [급여제한여부.무자격자]: "무자격자",
  [급여제한여부.보험료체납자]: "6회 이상 체납에 의한 급여제한",
  [급여제한여부.재외국인보험료체납자]: "외국인, 재외국민 보험료 체납에 의한 급여제한",
  [급여제한여부.사망자]: "사망자",
  [급여제한여부.국외이민자]: "국외이민자",
};

/**
 * 내원경로 Enum
 */
export enum 내원경로 {
  해당없음 = 0,
  검색네이버 = 1,
  검색다음 = 2,
  검색기타 = 3,
  카페네이버 = 4,
  카페다음 = 5,
  카페기타 = 6,
  블로그 = 7,
  광고 = 8,
  지인소개 = 9,
}

/**
 * 내원경로 Label
 */
export const 내원경로Label: Record<내원경로, string> = {
  [내원경로.해당없음]: "해당없음",
  [내원경로.검색네이버]: "검색(네이버)",
  [내원경로.검색다음]: "검색(다음)",
  [내원경로.검색기타]: "검색(기타)",
  [내원경로.카페네이버]: "카페(네이버)",
  [내원경로.카페다음]: "카페(다음)",
  [내원경로.카페기타]: "카페(기타)",
  [내원경로.블로그]: "병원 블로그",
  [내원경로.광고]: "광고(옥외,버스,지역)",
  [내원경로.지인소개]: "지인소개",
};

/**
 * 의료급여메시지타입 Enum
 */
export enum 의료급여메시지타입 {
  해당없음 = 0,
  수진자자격조회 = 1,
  수진자자격조회결과 = 2,
  의료급여승인요청 = 3,
  의료급여승인요청결과 = 4,
  의료급여승인취소요청 = 5,
  의료급여승인취소요청결과 = 6,
}

/**
 * 의료급여메시지타입 Label
 */
export const 의료급여메시지타입Label: Record<의료급여메시지타입, string> = {
  [의료급여메시지타입.해당없음]: "",
  [의료급여메시지타입.수진자자격조회]: "M1",
  [의료급여메시지타입.수진자자격조회결과]: "M2",
  [의료급여메시지타입.의료급여승인요청]: "M3",
  [의료급여메시지타입.의료급여승인요청결과]: "M4",
  [의료급여메시지타입.의료급여승인취소요청]: "M5",
  [의료급여메시지타입.의료급여승인취소요청결과]: "M6",
};

/**
 * 당뇨병요양비대상자유형 Enum
 */
export enum 당뇨병요양비대상자유형 {
  해당없음 = 0,
  DMType1 = 1,
  DMType2 = 2,
}

/**
 * 당뇨병요양비대상자유형 Label
 */
export const 당뇨병요양비대상자유형Label: Record<당뇨병요양비대상자유형, string> = {
  [당뇨병요양비대상자유형.해당없음]: "",
  [당뇨병요양비대상자유형.DMType1]: "제1형",
  [당뇨병요양비대상자유형.DMType2]: "제2형",
};

/**
 * 잠복결핵구분 Enum
 */
export enum 잠복결핵구분 {
  없음 = 0,
  검진 = 1,
  진료 = 2,
}

/**
 * 잠복결핵구분 Label
 */
export const 잠복결핵구분Label: Record<잠복결핵구분, string> = {
  [잠복결핵구분.없음]: "",
  [잠복결핵구분.검진]: "잠복결핵 검진",
  [잠복결핵구분.진료]: "잠복결핵 진료",
};

export enum HardSickDivision {
  해당없음 = 0,
  신규 = 1,
  재등록 = 2,
  중복암 = 3,
  중복암재등록 = 4,
}

export const hardSickDivisionLabel: Record<HardSickDivision, string> = {
  [HardSickDivision.해당없음]: "해당없음",
  [HardSickDivision.신규]: "신규",
  [HardSickDivision.재등록]: "재등록",
  [HardSickDivision.중복암]: "중복암",
  [HardSickDivision.중복암재등록]: "중복암 재등록",
};
export enum 중증등록구분 {
  해당없음 = 0,
  신규 = 1,
  재등록 = 2,
  중복암 = 3,
  중복암재등록 = 4,
}
export const 중증등록구분Label: Record<중증등록구분, string> = {
  [중증등록구분.해당없음]: "해당없음",
  [중증등록구분.신규]: "신규",
  [중증등록구분.재등록]: "재등록",
  [중증등록구분.중복암]: "중복암",
  [중증등록구분.중복암재등록]: "중복암 재등록",
};
/**
 * 국적구분 Enum
 */
export enum 국적구분 {
  해당없음 = 0,
  내국인 = 1,
  외국인 = 2,
  재외국민 = 3,
}

/**
 * 국적구분 Label
 */
export const 국적구분Label: Record<국적구분, string> = {
  [국적구분.해당없음]: "",
  [국적구분.내국인]: "내국인",
  [국적구분.외국인]: "외국인",
  [국적구분.재외국민]: "재외국인",
};

/**
 * 의료급여승인여부 Enum
 */
export enum 의료급여승인여부 {
  해당없음 = 0,
  승인 = 3,
  미승인 = 4,
}

/**
 * 의료급여승인여부 Label
 */
export const 의료급여승인여부Label: Record<의료급여승인여부, string> = {
  [의료급여승인여부.해당없음]: "",
  [의료급여승인여부.승인]: "03",
  [의료급여승인여부.미승인]: "04",
};

/**
 * 의료급여취소여부 Enum
 */
export enum 의료급여취소여부 {
  해당없음 = 0,
  취소 = 6,
  미취소 = 7,
}

/**
 * 의료급여취소여부 Label
 */
export const 의료급여취소여부Label: Record<의료급여취소여부, string> = {
  [의료급여취소여부.해당없음]: "",
  [의료급여취소여부.취소]: "06",
  [의료급여취소여부.미취소]: "07",
};

/**
 * 의료급여프로그램구분 Enum
 */
export enum 의료급여프로그램구분 {
  해당없음 = 0,
  프로그램1 = 1,
  프로그램2 = 2,
  프로그램3 = 3,
}

/**
 * 의료급여프로그램구분 Label
 */
export const 의료급여프로그램구분Label: Record<의료급여프로그램구분, string> = {
  [의료급여프로그램구분.해당없음]: "",
  [의료급여프로그램구분.프로그램1]: "1",
  [의료급여프로그램구분.프로그램2]: "2",
  [의료급여프로그램구분.프로그램3]: "3",
};

/**
 * Enum 유틸리티 함수들
 */

/**
 * Enum 값으로부터 Label을 가져오는 함수
 */
export function getEnumLabel<T extends Record<string, string | number>>(
  labelObj: Record<T[keyof T], string>,
  value: T[keyof T]
): string;
export function getEnumLabel<T extends Record<string, string | number>>(
  _enumObj: T,
  labelObj: Record<T[keyof T], string>,
  value: T[keyof T]
): string;
export function getEnumLabel<T extends Record<string, string | number>>(
  arg1: T | Record<T[keyof T], string>,
  arg2: Record<T[keyof T], string> | T[keyof T],
  arg3?: T[keyof T]
): string {
  const labelObj =
    arg3 === undefined
      ? (arg1 as Record<T[keyof T], string>)
      : (arg2 as Record<T[keyof T], string>);
  const value = (arg3 === undefined ? arg2 : arg3) as T[keyof T];
  return labelObj[value] || "";
}

/**
 * 의료급여자격여부 Label 가져오기
 */
export function get의료급여자격여부Label(value: 의료급여자격여부): string {
  return getEnumLabel(의료급여자격여부Label, value as 의료급여자격여부);
}

/**
 * 본인부담구분코드 Label 가져오기
 */
export function get본인부담구분코드Label(value: 본인부담구분코드): string {
  return getEnumLabel(본인부담구분코드, 본인부담구분코드Label, value);
}

/**
 * 급여제한여부 Label 가져오기
 */
export function get급여제한여부Label(value: 급여제한여부): string {
  return getEnumLabel(급여제한여부, 급여제한여부Label, value);
}

/**
 * 내원경로 Label 가져오기
 */
export function get내원경로Label(value: 내원경로): string {
  return getEnumLabel(내원경로, 내원경로Label, value);
}

/**
 * 의료급여메시지타입 Label 가져오기
 */
export function get의료급여메시지타입Label(value: 의료급여메시지타입): string {
  return getEnumLabel(의료급여메시지타입, 의료급여메시지타입Label, value);
}

/**
 * 당뇨병요양비대상자유형 Label 가져오기
 */
export function get당뇨병요양비대상자유형Label(value: 당뇨병요양비대상자유형): string {
  return getEnumLabel(당뇨병요양비대상자유형, 당뇨병요양비대상자유형Label, value);
}

/**
 * 국적구분 Label 가져오기
 */
export function get국적구분Label(value: 국적구분): string {
  return getEnumLabel(국적구분, 국적구분Label, value);
}

/**
 * 의료급여승인여부 Label 가져오기
 */
export function get의료급여승인여부Label(value: 의료급여승인여부): string {
  return getEnumLabel(의료급여승인여부, 의료급여승인여부Label, value);
}

/**
 * 의료급여취소여부 Label 가져오기
 */
export function get의료급여취소여부Label(value: 의료급여취소여부): string {
  return getEnumLabel(의료급여취소여부, 의료급여취소여부Label, value);
}

/**
 * 의료급여프로그램구분 Label 가져오기
 */
export function get의료급여프로그램구분Label(value: 의료급여프로그램구분): string {
  return getEnumLabel(의료급여프로그램구분, 의료급여프로그램구분Label, value);
}

/**
 * 진료형태 Label 가져오기
 */
export function get진료형태Label(value: 진료형태): string {
  return getEnumLabel(진료형태, 진료형태Label, value);
}

/**
 * 퇴원구분코드 Label 가져오기
 */
export function get퇴원구분코드Label(value: 퇴원구분코드): string {
  return getEnumLabel(퇴원구분코드, 퇴원구분코드Label, value);
}

/**
 * 예약상태 Label 가져오기
 */
export function getAppointmentStatusLabel(value: AppointmentStatus): string {
  return getEnumLabel(AppointmentStatus, AppointmentStatusLabel, value);
}

/**
 * Enum을 Label로 변환하는 유틸리티 함수들
 */

/**
 * 의료급여자격여부를 Label로 변환
 */
export function 의료급여자격여부ToLabel(value: 의료급여자격여부): string {
  return get의료급여자격여부Label(value);
}

/**
 * 본인부담구분코드를 Label로 변환
 */
export function 본인부담구분코드ToLabel(value: 본인부담구분코드): string {
  return get본인부담구분코드Label(value);
}

/**
 * 급여제한여부를 Label로 변환
 */
export function 급여제한여부ToLabel(value: 급여제한여부): string {
  return get급여제한여부Label(value);
}

/**
 * 당뇨병요양비대상자유형을 Label로 변환
 */
export function 당뇨병요양비대상자유형ToLabel(value: 당뇨병요양비대상자유형): string {
  return get당뇨병요양비대상자유형Label(value);
}

/**
 * 국적구분을 Label로 변환
 */
export function 국적구분ToLabel(value: 국적구분): string {
  return get국적구분Label(value);
}

/**
 * 의료급여승인여부를 Label로 변환
 */
export function 의료급여승인여부ToLabel(value: 의료급여승인여부): string {
  return get의료급여승인여부Label(value);
}

/**
 * 의료급여취소여부를 Label로 변환
 */
export function 의료급여취소여부ToLabel(value: 의료급여취소여부): string {
  return get의료급여취소여부Label(value);
}

/**
 * 의료급여프로그램구분을 Label로 변환
 */
export function 의료급여프로그램구분ToLabel(value: 의료급여프로그램구분): string {
  return get의료급여프로그램구분Label(value);
}

/**
 * 진료형태를 Label로 변환
 */
export function 진료형태ToLabel(value: 진료형태): string {
  return get진료형태Label(value);
}

/**
 * 퇴원구분코드를 Label로 변환
 */
export function 퇴원구분코드ToLabel(value: 퇴원구분코드): string {
  return get퇴원구분코드Label(value);
}

/**
 * 의료급여인증경로 Enum
 */
export enum 의료급여인증경로 {
  인터넷 = 0,
  ARS = 1,
  사후처리 = 3,
}

/**
 * 의료급여인증경로 Label
 */
export const 의료급여인증경로Label: Record<의료급여인증경로, string> = {
  [의료급여인증경로.인터넷]: "인터넷",
  [의료급여인증경로.ARS]: "ARS",
  [의료급여인증경로.사후처리]: "사후처리",
};

/**
 * 의료급여전송상태 Enum
 */
export enum 의료급여전송상태 {
  실패 = 0,
  완료 = 1,
}

/**
 * 의료급여전송상태 Label
 */
export const 의료급여전송상태Label: Record<의료급여전송상태, string> = {
  [의료급여전송상태.실패]: "실패",
  [의료급여전송상태.완료]: "완료",
};

/**
 * 의료급여취소이유 Enum
 */
export enum 의료급여취소이유 {
  없음 = 0,
  수납취소 = 1,
  기타 = 2,
  입원으로변경 = 3,
  내원일삭제 = 4,
}

/**
 * 의료급여취소이유 Label
 */
export const 의료급여취소이유Label: Record<의료급여취소이유, string> = {
  [의료급여취소이유.없음]: "없음",
  [의료급여취소이유.수납취소]: "수납취소",
  [의료급여취소이유.기타]: "기타",
  [의료급여취소이유.입원으로변경]: "입원으로변경",
  [의료급여취소이유.내원일삭제]: "내원일삭제",
};

/**
 * 의료급여퇴원구분코드 Enum
 */
export enum 의료급여퇴원구분코드 {
  입원중 = 1,
  퇴원 = 2,
  /// <summary>
  /// 외래 등
  /// </summary>
  기타 = 9,
}

/**
 * 의료급여퇴원구분코드 Label
 */
export const 의료급여퇴원구분코드Label: Record<의료급여퇴원구분코드, string> = {
  [의료급여퇴원구분코드.입원중]: "입원중",
  [의료급여퇴원구분코드.퇴원]: "퇴원",
  [의료급여퇴원구분코드.기타]: "기타",
};

/**
 * 지원금발생사유 Enum
 */
export enum 지원금발생사유 {
  없음 = 0,
  희귀난치 = 1,
  차상위 = 2,
  결핵 = 3,
  유두종바이러스 = 4,
  잠복결핵감염 = 5,
}

/**
 * 지원금발생사유 Label
 */
export const 지원금발생사유Label: Record<지원금발생사유, string> = {
  [지원금발생사유.없음]: "없음",
  [지원금발생사유.희귀난치]: "희귀난치",
  [지원금발생사유.차상위]: "차상위",
  [지원금발생사유.결핵]: "결핵",
  [지원금발생사유.유두종바이러스]: "NIP",
  [지원금발생사유.잠복결핵감염]: "잠복결핵",
};

/**
 * 환자구분 Enum
 */
export enum 환자구분 {
  입원 = 0,
  외래 = 1,
}

/**
 * 환자구분 Label
 */
export const 환자구분Label: Record<환자구분, string> = {
  [환자구분.입원]: "입원",
  [환자구분.외래]: "외래",
};

/**
 * 진료과목 Enum
 */
export enum 진료과목 {
  내과 = 1,
  신경과 = 2,
  정신건강의학과 = 3,
  외과 = 4,
  정형외과 = 5,
  신경외과 = 6,
  흉부외과 = 7,
  성형외과 = 8,
  마취통증의학과 = 9,
  산부인과 = 10,
  소아청소년과 = 11,
  안과 = 12,
  이비인후과 = 13,
  피부과 = 14,
  비뇨기과 = 15,
  영상의학과 = 16,
  방사선종양학과 = 17,
  병리과 = 18,
  진단검사의학과 = 19,
  결핵과 = 20,
  재활의학과 = 21,
  핵의학과 = 22,
  가정의학과 = 23,
  응급의학과 = 24,
  산업및일반의과 = 25,
  응급실 = 28,
  치과 = 55,
  한방 = 80,
  기타 = 99,
}

/**
 * 진료과목 Label
 */
export const 진료과목Label: Record<진료과목, string> = {
  [진료과목.내과]: "내과",
  [진료과목.신경과]: "신경과",
  [진료과목.정신건강의학과]: "정신건강의학과",
  [진료과목.외과]: "외과",
  [진료과목.정형외과]: "정형외과",
  [진료과목.신경외과]: "신경외과",
  [진료과목.흉부외과]: "흉부외과",
  [진료과목.성형외과]: "성형외과",
  [진료과목.마취통증의학과]: "마취통증의학과",
  [진료과목.산부인과]: "산부인과",
  [진료과목.소아청소년과]: "소아청소년과",
  [진료과목.안과]: "안과",
  [진료과목.이비인후과]: "이비인후과",
  [진료과목.피부과]: "피부과",
  [진료과목.비뇨기과]: "비뇨기과",
  [진료과목.영상의학과]: "영상의학과",
  [진료과목.방사선종양학과]: "방사선종양학과",
  [진료과목.병리과]: "병리과",
  [진료과목.진단검사의학과]: "진단검사의학과",
  [진료과목.결핵과]: "결핵과",
  [진료과목.재활의학과]: "재활의학과",
  [진료과목.핵의학과]: "핵의학과",
  [진료과목.가정의학과]: "가정의학과",
  [진료과목.응급의학과]: "응급의학과",
  [진료과목.산업및일반의과]: "산업및일반의과",
  [진료과목.응급실]: "응급실",
  [진료과목.치과]: "치과",
  [진료과목.한방]: "한방",
  [진료과목.기타]: "기타",
};

/**
 * 초재진 Enum
 */
export enum 초재진 {
  없음 = 0,
  초진 = 1,
  재진 = 2,
  보호자 = 3,
  미산정 = 4,
  물치재진 = 5,
  촉탁의 = 6,
}

/**
 * 초재진 Label
 */
export const 초재진Label: Record<초재진, string> = {
  [초재진.없음]: "없음",
  [초재진.초진]: "초진",
  [초재진.재진]: "재진",
  [초재진.보호자]: "보호자",
  [초재진.미산정]: "미산정",
  [초재진.물치재진]: "물치재진",
  [초재진.촉탁의]: "촉탁의",
};

/**
 * 주간야간휴일구분 Enum
 */
export enum 주간야간휴일구분 {
  없음 = 0,
  주간 = 1,
  야간 = 2,
  휴일 = 3,
  야간토요공휴 = 4,
}

/**
 * 주간야간휴일구분 Label
 */
export const 주간야간휴일구분Label: Record<주간야간휴일구분, string> = {
  [주간야간휴일구분.없음]: "없음",
  [주간야간휴일구분.주간]: "주간",
  [주간야간휴일구분.야간]: "야간",
  [주간야간휴일구분.휴일]: "공휴일",
  [주간야간휴일구분.야간토요공휴]: "야간토요공휴",
};

/**
 * 진료구분 Enum
 */
export enum DetailCategoryType {
  없음 = 0,
  공상 = 1,
  행려 = 2,
  긴급복지의료지원 = 3,
  노숙인 = 4,
}

/**
 * 진료구분 Label
 */
export const DetailCategoryTypeLabel: Record<DetailCategoryType, string> = {
  [DetailCategoryType.없음]: "없음",
  [DetailCategoryType.공상]: "공상",
  [DetailCategoryType.행려]: "행려",
  [DetailCategoryType.긴급복지의료지원]: "긴급복지의료지원",
  [DetailCategoryType.노숙인]: "노숙인",
};

/**
 * 정률정액구분 Enum
 */
export enum 정률정액구분 {
  없음 = 0,
  산정특례 = 1,
  정률 = 2,
  정액 = 3,
  정액나이기준 = 4,
}

/**
 * 정률정액구분 Label
 */
export const 정률정액구분Label: Record<정률정액구분, string> = {
  [정률정액구분.없음]: "없음",
  [정률정액구분.산정특례]: "산정특례",
  [정률정액구분.정률]: "정률",
  [정률정액구분.정액]: "정액",
  [정률정액구분.정액나이기준]: "정액나이기준",
};

/**
 * 진료결과 Enum
 */
export enum 진료결과 {
  계속 = 1,
  이송 = 2,
  회송 = 3,
  사망 = 4,
  외래치료종결 = 5,
}

/**
 * 진료결과 Label
 */
export const 진료결과Label: Record<진료결과, string> = {
  [진료결과.계속]: "계속",
  [진료결과.이송]: "이송",
  [진료결과.회송]: "회송",
  [진료결과.사망]: "사망",
  [진료결과.외래치료종결]: "외래치료종결",
};

/**
 * 보훈등급 Enum
 */
export enum 보훈등급 {
  보훈없음 = 0,
  국가유공자 = 1,
  고엽제등급환자 = 2,
  고엽제등외환자 = 3,
  경상이자 = 4,
  상이등급7급 = 5,
  보훈60퍼센트감면 = 6,
  보훈90퍼센트감면 = 7,
}

/**
 * 보훈등급 Label
 */
export const 보훈등급Label: Record<보훈등급, string> = {
  [보훈등급.보훈없음]: "없음",
  [보훈등급.국가유공자]: "국가유공자",
  [보훈등급.고엽제등급환자]: "고엽제등급환자",
  [보훈등급.고엽제등외환자]: "고엽제등외환자",
  [보훈등급.경상이자]: "경상이자",
  [보훈등급.상이등급7급]: "상이등급7급",
  [보훈등급.보훈60퍼센트감면]: "보훈 60%감면",
  [보훈등급.보훈90퍼센트감면]: "보훈 90%감면",
};

export enum 청구 {
  청구 = 1,
  비청구 = 2,
}

export const 청구구분Label: Record<청구, string> = {
  [청구.청구]: "청구",
  [청구.비청구]: "비청구",
};

/**
 * 보훈청구 Enum
 */
export enum 보훈청구 {
  전액보험 = 0,
  일부보훈 = 1,
  전액보훈 = 2,
}

/**
 * 보훈청구 Label
 */
export const 보훈청구Label: Record<보훈청구, string> = {
  [보훈청구.전액보험]: "전액보험",
  [보훈청구.일부보훈]: "일부보훈",
  [보훈청구.전액보훈]: "전액보훈",
};

/**
 * 차상위 Enum
 */
export enum 차상위 {
  없음 = 0,
  일차 = 1,
  이차 = 2,
}

/**
 * 차상위 Label
 */
export const 차상위Label: Record<차상위, string> = {
  [차상위.없음]: "없음",
  [차상위.일차]: "일차",
  [차상위.이차]: "이차",
};

/**
 * 만성질환관리제 Enum
 */
export enum 만성질환관리제 {
  해당없음 = 0,
  의원급만성질환관리 = 1,
  일차의료만성질환관리 = 2,
}

/**
 * 만성질환관리제 Label
 */
export const 만성질환관리제Label: Record<만성질환관리제, string> = {
  [만성질환관리제.해당없음]: "만성질환 제도 선택",
  [만성질환관리제.의원급만성질환관리]: "만성질환 관리제",
  [만성질환관리제.일차의료만성질환관리]: "일차의료 만성질환 관리",
};

/**
 * 결핵구분 Enum
 */
export enum 결핵구분 {
  없음 = 0,
  결핵 = 1,
  입원명령결핵 = 2,
  본인부담금면제 = 3,
}

/**
 * 결핵구분 Label
 */
export const 결핵구분Label: Record<결핵구분, string> = {
  [결핵구분.없음]: "없음",
  [결핵구분.결핵]: "결핵",
  [결핵구분.입원명령결핵]: "입원명령결핵",
  [결핵구분.본인부담금면제]: "본인부담금면제",
};

/**
 * 병원구분 Enum
 * TODO: 병원구분 -> 의료기관종별구분으로 변경 예정
 */
export enum 병원구분 {
  의원 = 0,
  병원 = 1,
  종합병원 = 2,
  삼차병원 = 3,
}

/**
 * 병원구분 Label
 */
export const 병원구분Label: Record<병원구분, string> = {
  [병원구분.의원]: "의원",
  [병원구분.병원]: "병원",
  [병원구분.종합병원]: "종합병원",
  [병원구분.삼차병원]: "삼차병원",
};

/**
 * ChronicTypes Enum
 */
export enum ChronicTypes {
  고혈압 = 0,
  당뇨 = 1,
  이상지질혈증 = 2,
}

/**
 * ChronicTypes Label
 */
export const ChronicTypesLabel: Record<ChronicTypes, string> = {
  [ChronicTypes.고혈압]: "고혈압",
  [ChronicTypes.당뇨]: "당뇨",
  [ChronicTypes.이상지질혈증]: "이상지질혈증",
};

/**
 * 성별 Enum
 */
export enum 성별 {
  중성 = 0,
  남 = 1,
  여 = 2,
}

/**
 * 성별 Label
 */
export const 성별Label: Record<성별, string> = {
  [성별.중성]: "성별구분없음",
  [성별.남]: "남성",
  [성별.여]: "여성",
};

export enum 접수상태 {
  대기 = 0,
  진료중 = 1,
  수납대기 = 2,
  수납완료 = 3,
  취소 = 4,
  응급 = 5,
  보류 = 6,
}

export const 접수상태Label: Record<접수상태, string> = {
  [접수상태.대기]: "대기",
  [접수상태.진료중]: "진료중",
  [접수상태.수납대기]: "수납대기",
  [접수상태.수납완료]: "수납완료",
  [접수상태.취소]: "취소",
  [접수상태.응급]: "응급",
  [접수상태.보류]: "보류",
};

/**
 * 보험구분 Enum
 */
export enum 보험구분 {
  일반 = 0,
  직장조합 = 1,
  국민공단 = 2,
  급여1종 = 3,
  급여2종 = 4,
  자보 = 5,
  산재 = 6,
  재해 = 7,
}

/**
 * 보험구분 Label
 */
export const 보험구분Label: Record<보험구분, string> = {
  [보험구분.일반]: "일반",
  [보험구분.직장조합]: "직장조합",
  [보험구분.국민공단]: "국민공단",
  [보험구분.급여1종]: "급여1종",
  [보험구분.급여2종]: "급여2종",
  [보험구분.자보]: "자보",
  [보험구분.산재]: "산재",
  [보험구분.재해]: "재해",
};

/**
 * 보험구분상세 Enum
 */
export enum 보험구분상세 {
  일반 = 0,
  직장조합 = 1,
  국민공단 = 2,
  의료급여1종 = 3,
  의료급여2종 = 4,
  의료급여2종장애 = 5,
  차상위1종 = 6,
  차상위2종 = 7,
  차상위2종장애 = 8,
  자보 = 9,
  산재 = 10,
  재해 = 11,
}

/**
 * 보험구분상세 Label
 */
export const 보험구분상세Label: Record<보험구분상세, string> = {
  [보험구분상세.일반]: "일반",
  [보험구분상세.직장조합]: "직장",
  [보험구분상세.국민공단]: "공단",
  [보험구분상세.의료급여1종]: "급여1",
  [보험구분상세.의료급여2종]: "급여2",
  [보험구분상세.의료급여2종장애]: "급여2장애",
  [보험구분상세.차상위1종]: "차상1",
  [보험구분상세.차상위2종]: "차상2",
  [보험구분상세.차상위2종장애]: "차상2장애",
  [보험구분상세.자보]: "자보",
  [보험구분상세.산재]: "산재",
  [보험구분상세.재해]: "재해",
};

/**
 * 보험구분상세 Label
 */
export const 보험구분상세FullLabel: Record<보험구분상세, string> = {
  [보험구분상세.일반]: "일반",
  [보험구분상세.직장조합]: "직장조합",
  [보험구분상세.국민공단]: "국민공단",
  [보험구분상세.의료급여1종]: "의료급여1종",
  [보험구분상세.의료급여2종]: "의료급여2종",
  [보험구분상세.의료급여2종장애]: "의료급여2종장애",
  [보험구분상세.차상위1종]: "차상위1종",
  [보험구분상세.차상위2종]: "차상위2종",
  [보험구분상세.차상위2종장애]: "차상위2종장애",
  [보험구분상세.자보]: "자동차보험",
  [보험구분상세.산재]: "산업재해",
  [보험구분상세.재해]: "일반재해",
};

/**
 * 차상위보험구분 Enum
 */
export enum 차상위보험구분 {
  직장조합 = 0,
  국민공단 = 1,
}

/**
 * 차상위보험구분 Label
 */
export const 차상위보험구분Label: Record<차상위보험구분, string> = {
  [차상위보험구분.직장조합]: "직장조합",
  [차상위보험구분.국민공단]: "국민공단",
};

/**
 * 피보험자와의관계 Enum
 */
export enum 피보험자와의관계 {
  해당없음 = 0,
  본인 = 1,
  배우자 = 2,
  자녀 = 3,
  부모 = 4,
  기타 = 5,
}

/**
 * 피보험자와의관계 Label
 */
export const 피보험자와의관계Label: Record<피보험자와의관계, string> = {
  [피보험자와의관계.해당없음]: "해당없음",
  [피보험자와의관계.본인]: "본인",
  [피보험자와의관계.배우자]: "배우자",
  [피보험자와의관계.자녀]: "자녀",
  [피보험자와의관계.부모]: "부모",
  [피보험자와의관계.기타]: "기타",
};

/**
 * DisRegType Enum
 */
export enum DisRegType {
  중증암 = 0,
  희귀난치 = 1,
  차상위 = 2,
  산정특례Old = 3,
  당뇨병 = 4,
  치료재료경감 = 5,
  만성질환 = 6,
  급여제한 = 7,
  조산아 = 8,
  임신부 = 9,
  잠복결핵 = 10,
  치매 = 11,
  난임 = 12,
  극희귀난치산정특례 = 13,
  상세불명희귀난치산정특례Old = 14,
  요양병원입원 = 15,
  중증난치산정특례 = 16,
  결핵환자산정특례 = 17,
  기타염색체산정특례 = 18,
  중증화상 = 19,
  산정특례New = 20,
  상세불명희귀난치산정특례New = 21,
  장애여부 = 22,
  출국자 = 23,
  비대면대상자 = 24,
  자립준비청년 = 25,
  통합만성질환 = 26,
  외래365초과 = 27,
  방문진료본인부담경감 = 28,
  본인부담차등여부 = 29,
}

/**
 * DisRegType Label
 */
export const DisRegTypeLabel: Record<DisRegType, string> = {
  [DisRegType.중증암]: "중증 암 산정특례",
  [DisRegType.희귀난치]: "희귀난치 본인부담 지원",
  [DisRegType.차상위]: "차상위",
  [DisRegType.산정특례Old]: "산정특례Old",
  [DisRegType.당뇨병]: "당뇨병 요양비 대상자",
  [DisRegType.치료재료경감]: "치료재료/행위 감경",
  [DisRegType.만성질환]: "만성질환",
  [DisRegType.급여제한]: "급여제한",
  [DisRegType.조산아]: "조산/저체중아",
  [DisRegType.임신부]: "임신부",
  [DisRegType.잠복결핵]: "잠복결핵",
  [DisRegType.치매]: "중증 치매 산정특례",
  [DisRegType.난임]: "난임",
  [DisRegType.극희귀난치산정특례]: "극희귀 산정특례",
  [DisRegType.상세불명희귀난치산정특례Old]: "상세불명희귀난치산정특례Old",
  [DisRegType.요양병원입원]: "요양병원 입원",
  [DisRegType.중증난치산정특례]: "중증 난치 산정특례",
  [DisRegType.결핵환자산정특례]: "결핵 산정특례",
  [DisRegType.기타염색체산정특례]: "기타염색체 산정특례",
  [DisRegType.중증화상]: "중증 화상 산정특례",
  [DisRegType.산정특례New]: "희귀질환 산정특례",
  [DisRegType.상세불명희귀난치산정특례New]: "상세불명 희귀 산정특례",
  [DisRegType.장애여부]: "장애여부",
  [DisRegType.출국자]: "출국자",
  [DisRegType.비대면대상자]: "비대면대상자",
  [DisRegType.자립준비청년]: "자립준비청년",
  [DisRegType.통합만성질환]: "통합만성질환",
  [DisRegType.외래365초과]: "본인부담 차등대상(본인부담 90%)",
  [DisRegType.방문진료본인부담경감]: "방문진료 경감",
  [DisRegType.본인부담차등여부]: "본인부담차등",
};

/**
 * 당뇨병등급 Enum
 */
export enum DiabetesGrade {
  없음 = 0,
  제1형 = 1,
  제2형 = 2,
}

/**
 * 당뇨병등급 Label
 */
export const DiabetesGradeLabel: Record<DiabetesGrade, string> = {
  [DiabetesGrade.없음]: "없음",
  [DiabetesGrade.제1형]: "제1형",
  [DiabetesGrade.제2형]: "제2형",
};

/**
 * 수진자 자격조회 메시지 포맷
 */
export const 수진자자격조회메시지 = {
  수진자자격조회결과메세지: "{0}",
  의료급여대상환자: "<b>{0}</b> <b>수진자는 <color=#4F29E5>의료급여 대상환자</color> 입니다.</b>",
  의료급여대상환자선택의료기관:
    "<b>{0}</b> <b>수진자는 <color=#4F29E5>의료급여 대상환자</color> 입니다.</b>\n다른 요양기관을 선택 의료기관으로 선택한 환자입니다.\n진료의뢰서 없이 진료를 하게 되면 진료비 전액을 환자가 부담하게 됩니다.",
  건강보험가입자:
    "<b>{0}</b> <b>수진자는 <color=#4F29E5>건강보험(직장,지역) 가입자</color> 입니다.</b>\n접수를 하시면 (건강보험) 환자로 접수 됩니다.",
  장애환자: "\n<color=#70737C>{0} 수진자는 장애환자 입니다.</color>",
  출국환자: "\n<color=#70737C>{0} 수진자는 출국 등으로 급여정지 대상자입니다.</color>",
  급여제한대상자: "\n<color=#70737C>{0} 수진자는 급여제한대상자입니다.</color>",
  선택의료기관아닌환자:
    "\n<color=#70737C>{0} 수진자는 다른 요양기관을 선택의료기관으로 선택한 환자입니다.\n진료의뢰서 없이 진료를 하게 되면 진료비 전액을 환자가 부담해야 합니다.</color>",
  선택의료기관아닌환자Alert:
    "<color=#70737C>선택요양기관이 다른 요양기관으로 지정되어있습니다.\n진료의뢰서 제출 여부에 따라 진료비 계산이 달라집니다.\n진료의뢰서 제출을 확인하셨습니까?\n확인 : B005(본인일부부담)\n미확인 : 전액본인부담</color>",
  본인부담차등환자Alert:
    "<color=#70737C>{0} 수진자는 <b>외래진료 본인부담 차등대상자</b>이므로 \n본인부담률 90%로 적용됩니다.\n\n※ 외래진료 본인부담 차등 대상자: 연 365회 초과 외래진료자\n(건강보험 고객센터: 1577-1000)\n</color>",
  본인부담차등및산정특례환자Alert:
    "<color=#70737C>{0} 수진자는 <b>외래진료 본인부담 차등대상자</b> 및\n<b>산정특례대상자</b> 입니다.\n산정특례질환 진료가 아닌경우 본인부담률 90%로 적용됩니다.\n\n※ 외래진료 본인부담 차등 대상자: 연 365회 초과 외래진료자\n(건강보험 고객센터: 1577-1000)\n</color>",
  본인부담차등환자물리치료Alert:
    "<color=#70737C>{0} 수진자는 <b>외래진료 본인부담 차등대상자</b>이므로 \n본인부담률 90%로 적용됩니다.\n\n<color=red>※ 물리치료 환자의 경우 수진자 조회를 통해 본인부담 차등\n대상자 여부를 꼭 확인 하시기 바랍니다.(매년1월1일 재산정)</color>\n※ 외래진료 본인부담 차등 대상자: 연 365회 초과 외래진료자\n(건강보험 고객센터: 1577-1000)\n</color>",
  본인부담차등및산정특례환자물리치료Alert:
    "<color=#70737C>{0} 수진자는 외래진료 본인부담 차등대상자 및\n<b>산정특례대상자</b> 입니다.\n산정특례질환 진료가 아닌경우 본인부담률 90%로 적용됩니다.\n\n<color=red>※ 물리치료 환자의 경우 수진자 조회를 통해 본인부담 차등\n대상자 여부를 꼭 확인 하시기 바랍니다.(매년1월1일 재산정)</color>\n※ 외래진료 본인부담 차등 대상자: 연 365회 초과 외래진료자\n(건강보험 고객센터: 1577-1000)\n</color>",
  산전지원금대상자:
    "\n<color=#70737C>{0} 수진자는 산전지원금 대상자입니다. (잔액 : {1} 원)</color>",
  행려환자: "\n<color=#70737C>{0} 수진자는 행려환자 입니다.</color>",
  방문진료본인부담경감환자:
    "\n<color=#70737C>{0} 수진자는 방문진료 본인부담 경감 대상자 입니다. (본인부담금 15%)</color>",
  본인부담차등제환자:
    "\n<color=#70737C>{0} 수진자는 외래진료 본인부담 차등 대상자 입니다. (본인부담금 90%)</color>",
};

export enum HolidayMasterType {
  fixed = 0,
  lunar = 1,
  flexible = 2,
}

export enum HolidayType {
  national = 0,
  custom = 1,
}

/**
 * 휴무 반복 유형
 * - 0: 없음
 * - 1: 매주
 * - 2: 격주
 * - 3: 매월
 * - 4: 매년
 */
export enum HolidayRecurrenceType {
  없음 = 0,
  매주 = 1,
  격주 = 2,
  매월 = 3,
  매년 = 4,
}

export const HolidayRecurrenceTypeLabel: Record<HolidayRecurrenceType, string> = {
  [HolidayRecurrenceType.없음]: "없음",
  [HolidayRecurrenceType.매주]: "매주",
  [HolidayRecurrenceType.격주]: "격주",
  [HolidayRecurrenceType.매월]: "매월",
  [HolidayRecurrenceType.매년]: "매년",
};

/**
 * 휴무 반복 주차 (매월인 경우 사용)
 * - 1: 첫째주
 * - 2: 둘째주
 * - 3: 셋째주
 * - 4: 넷째주
 * - 5: 마지막주
 */
export enum HolidayRecurrenceWeek {
  첫째주 = 1,
  둘째주 = 2,
  셋째주 = 3,
  넷째주 = 4,
  마지막주 = 5,
}

export const HolidayRecurrenceWeekLabel: Record<HolidayRecurrenceWeek, string> = {
  [HolidayRecurrenceWeek.첫째주]: "첫째주",
  [HolidayRecurrenceWeek.둘째주]: "둘째주",
  [HolidayRecurrenceWeek.셋째주]: "셋째주",
  [HolidayRecurrenceWeek.넷째주]: "넷째주",
  [HolidayRecurrenceWeek.마지막주]: "마지막주",
};

export const HolidayRecurrenceWeekMonthlyLabel: Record<HolidayRecurrenceWeek, string> = {
  [HolidayRecurrenceWeek.첫째주]: "매월 첫째주",
  [HolidayRecurrenceWeek.둘째주]: "매월 둘째주",
  [HolidayRecurrenceWeek.셋째주]: "매월 셋째주",
  [HolidayRecurrenceWeek.넷째주]: "매월 넷째주",
  [HolidayRecurrenceWeek.마지막주]: "매월 마지막주",
};

// 요일 ENUM 정의
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum AppointmentStatus {
  PENDING = 0,
  CONFIRMED = 1,
  VISITED = 4,
  NOSHOW = 3,
  CANCELED = 2,
}

/**
 * 예약상태 Label
 */
export const AppointmentStatusLabel: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: "요청",
  [AppointmentStatus.CONFIRMED]: "예약",
  [AppointmentStatus.VISITED]: "내원",
  [AppointmentStatus.NOSHOW]: "노쇼",
  [AppointmentStatus.CANCELED]: "취소",
};

export enum PaymentStatus {
  PENDING = 0,
  COMPLETED = 1,
}

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "대기",
  [PaymentStatus.COMPLETED]: "완료",
};
export enum 공간코드 {
  진료 = 0,
  접수수납 = 1,
  상담 = 2,
  시술 = 3,
  관리 = 4,
  기타 = 99,
}

export const 공간코드라벨: Record<공간코드, string> = {
  [공간코드.진료]: "진료",
  [공간코드.접수수납]: "접수/수납",
  [공간코드.상담]: "상담",
  [공간코드.시술]: "시술",
  [공간코드.관리]: "관리",
  [공간코드.기타]: "기타",
};

export enum PatientIdType {
  PASSPORT = 0,
  SSN = 1,
  FACILITY_ID = 2,
  ANONYMOUS_MALE = 3,
  ANONYMOUS_FEMALE = 4,
  OTHER = 5,
}

export const PatientIdTypeLabel: Record<PatientIdType, string> = {
  [PatientIdType.PASSPORT]: "여권번호",
  [PatientIdType.SSN]: "사회보장번호",
  [PatientIdType.FACILITY_ID]: "시설관리번호",
  [PatientIdType.ANONYMOUS_MALE]: "무명남",
  [PatientIdType.ANONYMOUS_FEMALE]: "무명녀",
  [PatientIdType.OTHER]: "기타",
};

export enum ConsentPrivacyType {
  미동의 = 0,
  동의 = 1,
  거부 = 2,
}

export const ConsentPrivacyTypeLabel: Record<ConsentPrivacyType, string> = {
  [ConsentPrivacyType.미동의]: "미동의",
  [ConsentPrivacyType.동의]: "동의",
  [ConsentPrivacyType.거부]: "거부",
};

/**
 * marketing 필드가 동의 상태인지 판별
 * DB JSON에서 1(number) 또는 true(boolean)로 저장될 수 있음
 */
export function isMarketingAgreed(marketing: unknown): boolean {
  return marketing === 1 || marketing === true;
}

export enum ServiceType {
  없음 = 0,
  일반 = 1,
  영유아 = 2,
  생애전환기 = 3,
  암 = 4,
  확진 = 5,
  만성질환바우처 = 6,
  보건증발급 = 7,
  장애인바우처 = 8,
}
export const ServiceTypeLabel: Record<ServiceType, string> = {
  [ServiceType.없음]: "없음",
  [ServiceType.일반]: "일반",
  [ServiceType.영유아]: "영유아",
  [ServiceType.생애전환기]: "생애전환기",
  [ServiceType.암]: "암",
  [ServiceType.확진]: "확진",
  [ServiceType.만성질환바우처]: "만성질환바우처",
  [ServiceType.보건증발급]: "보건증발급",
  [ServiceType.장애인바우처]: "장애인바우처",
};

// 예약 이동 실패 에러 코드
export enum AppointmentMoveErrorCode {
  ROOM_NOT_FOUND = "ROOM_NOT_FOUND",
  NOT_OPERATING_DAY = "NOT_OPERATING_DAY",
  HOLIDAY = "HOLIDAY",
  BREAK_TIME = "BREAK_TIME",
  SLOT_CLOSED = "SLOT_CLOSED",
  OUTSIDE_OPERATING_HOURS = "OUTSIDE_OPERATING_HOURS",
  SLOT_FULL = "SLOT_FULL",
}

// 예약 이동 실패 에러 메시지
export const APPOINTMENT_MOVE_ERROR_MESSAGES: Record<AppointmentMoveErrorCode, string> = {
  [AppointmentMoveErrorCode.ROOM_NOT_FOUND]: "예약실을 찾을 수 없습니다",
  [AppointmentMoveErrorCode.NOT_OPERATING_DAY]: "해당 날짜는 운영하지 않습니다",
  [AppointmentMoveErrorCode.HOLIDAY]: "휴무일입니다",
  [AppointmentMoveErrorCode.BREAK_TIME]: "휴게시간입니다",
  [AppointmentMoveErrorCode.SLOT_CLOSED]: "예약 마감 시간입니다",
  [AppointmentMoveErrorCode.OUTSIDE_OPERATING_HOURS]: "운영시간 외입니다",
  [AppointmentMoveErrorCode.SLOT_FULL]: "해당 시간대의 최대 예약 수를 초과했습니다",
};

export enum UserType {
  의사 = 1,
  간호사 = 2,
}

export enum PaymentMethod {
  수납없음 = 0,
  보험가 = 1,
  일반가 = 2,
  자보가 = 3,
  보험가비급여 = 4,
  백대백 = 5,
  보훈본인부담 = 6,
  환자납부액 = 7,
  팔십대백 = 8,
  오십대백 = 9,
  구십대백 = 10,
  삼십대백 = 11,
  공단부담 = 99,
}

export enum SearchPeriod {
  Direct = 0,
  all = 1,
  OneMonth = 2,
  TwoMonths = 3,
  ThreeMonths = 4,
  SixMonths = 5,
  OneYear = 6,
}

export enum 정액정률구분 {
  없음 = 0,
  정액 = 1,
  정액65 = 2,
  정률 = 3,
}

export const 정액정률구분Label: Record<정액정률구분, string> = {
  [정액정률구분.없음]: "없음",
  [정액정률구분.정액]: "정액",
  [정액정률구분.정액65]: "정액 65세이상",
  [정액정률구분.정률]: "정률",
};

/**
 * 정산 카테고리 Enum
 */
export enum SettlementCategory {
  INITIAL = "INITIAL",
  COLLECTION = "COLLECTION",
  REFUND = "REFUND",
  MIXED = "MIXED",
  CANCEL = "CANCEL",
}

/**
 * 영수증 타입 Enum
 */
export enum ReceiptType {
  ORIGINAL = "ORIGINAL",
  ADJUSTMENT = "ADJUSTMENT",
}

/**
 * 조정 타입 Enum
 */
export enum AdjustmentType {
  DISCOUNT = "DISCOUNT",
  GRANT = "GRANT",
  INSURANCE = "INSURANCE",
  CREDIT_ISSUE = "CREDIT_ISSUE",
  CREDIT_USE = "CREDIT_USE",
  RECEIVABLE_ISSUE = "RECEIVABLE_ISSUE",
  RECEIVABLE_COLLECT = "RECEIVABLE_COLLECT",
}

/**
 * 혜택(감액) 타입 - 새 감액 등록 시 type=DISCOUNT일 때 config 필수
 */
export enum BenefitType {
  DISCOUNT = "DISCOUNT",
}

/**
 * 혜택(감액) 적용 대상 - target: 납부총액 | 본인부담금 | 비급여
 */
export enum BenefitTarget {
  /** 납부총액 */
  PAYABLE_AMOUNT = "PAYABLE_AMOUNT",
  /** 본인부담금 */
  COPAY = "COPAY",
  /** 비급여 */
  UNINSURED = "UNINSURED",
}

/**
 * 혜택(감액) 단위 - unit: 원 | %
 */
export enum BenefitUnit {
  /** 원 (value: 0 이상) */
  WON = "WON",
  /** % (value: 0~100) */
  PERCENT = "PERCENT",
}

/**
 * 혜택(감액) 단위 구분 - 정액(WON) / 정률(PERCENT)
 * @deprecated BenefitUnit 사용 권장
 */
export enum BenefitsDiscountUnit {
  /** 정액 (원) */
  WON = "WON",
  /** 정률 (%) */
  PERCENT = "PERCENT",
}

/**
 * 혜택(감액) 적용 대상 - 급여 본인부담금(COPAY) / 비급여 본인부담금(NON_COVERED)
 * @deprecated BenefitTarget 사용 권장 (UNINSURED = 비급여)
 */
export enum BenefitsDiscountTarget {
  /** 급여 본인부담금 (patientCopay) */
  COPAY = "COPAY",
  /** 비급여 본인부담금 (nonCovered) */
  NON_COVERED = "NON_COVERED",
}

/**
 * 현금영수증 타입 Enum
 */
export enum CashReceiptType {
  소비자용 = 1,
  사업자용 = 2,
  자진발급 = 3,
}

/**
 * 현금영수증 타입 Label
 */
export const CashReceiptTypeLabel: Record<CashReceiptType, string> = {
  [CashReceiptType.소비자용]: "개인",
  [CashReceiptType.사업자용]: "법인",
  [CashReceiptType.자진발급]: "자진발급",
};

/**
 * 현금영수증 승인 방법 Enum
 */
export enum CashApprovalMethod {
  휴대폰번호 = "phone",
  사업자등록번호 = "business",
  주민등록번호 = "resident",
  카드번호 = "card",
  자진발급번호 = "self",
  기타 = "other",
}

/**
 * 현금영수증 승인 방법 Label
 */
export const CashApprovalMethodLabel: Record<CashApprovalMethod, string> = {
  [CashApprovalMethod.휴대폰번호]: "휴대폰번호",
  [CashApprovalMethod.카드번호]: "카드번호",
  [CashApprovalMethod.사업자등록번호]: "사업자등록번호",
  [CashApprovalMethod.주민등록번호]: "주민등록번호",
  [CashApprovalMethod.자진발급번호]: "자진발급번호",
  [CashApprovalMethod.기타]: "기타",
};

/**
 * 현금/계좌 구분 Enum
 */
export enum CashType {
  CASH = "CASH",
  ACCOUNT = "ACCOUNT",
}

/**
 * 결제 원천 Enum
 */
export enum PaymentSource {
  CARD = "CARD",
  CASH = "CASH",
}

/**
 * 결제 방법 타입 Enum
 */
export enum PaymentProvider {
  DIRECT = "DIRECT",
  KAKAO = "KAKAO",
  NAVER = "NAVER",
  TOSS = "TOSS",
  PAYCO = "PAYCO",
  SAMSUNG = "SAMSUNG",
}

export enum UsageCategory {
  COMMON = 0,
  INJECTION = 1,
  EXTERNAL = 2,
  INTERNAL = 3,
  ETC = 9,
}

export enum TemplateCodeType {
  전체 = 0,
  증상 = 1,
  임상메모 = 2,
  특정내역 = 3,
  조제시참고사항 = 4,
  지시오더 = 5,
  예약메모 = 6,
  환자메모 = 7,
}

/**
 * 사용자유형 Enum
 */
export enum 사용자유형 {
  의사 = 1,
  간호사 = 2,
  간호조무사 = 3,
  치과의사 = 4,
  한의사 = 5,
  약사 = 6,
  임상병리사 = 7,
  물리치료사 = 8,
  방사선사 = 9,
  의무기록사 = 10,
  행정직 = 11,
  기타직 = 99,
}

/**
 * 사용자유형 Label
 */
export const 사용자유형Label: Record<사용자유형, string> = {
  [사용자유형.의사]: "의사",
  [사용자유형.간호사]: "간호사",
  [사용자유형.간호조무사]: "간호조무사",
  [사용자유형.치과의사]: "치과의사",
  [사용자유형.한의사]: "한의사",
  [사용자유형.약사]: "약사",
  [사용자유형.임상병리사]: "임상병리사",
  [사용자유형.물리치료사]: "물리치료사",
  [사용자유형.방사선사]: "방사선사",
  [사용자유형.의무기록사]: "의무기록사",
  [사용자유형.행정직]: "행정직",
  [사용자유형.기타직]: "기타직",
};

/**
 * 사용자유형 Label 가져오기
 */
export function get사용자유형Label(value: 사용자유형): string {
  return getEnumLabel(사용자유형, 사용자유형Label, value);
}

/**
 * 사용자유형을 Label로 변환
 */
export function 사용자유형ToLabel(value: 사용자유형): string {
  return get사용자유형Label(value);
}

/**
 * PDF Export 모드 Enum
 */
export enum PdfExportMode {
  DOWNLOAD = "download",
  PREVIEW = "preview",
  PRINT = "print",
}

/**
 * PDF Export 모드 Label
 */
export const PdfExportModeLabel: Record<PdfExportMode, string> = {
  [PdfExportMode.DOWNLOAD]: "다운로드",
  [PdfExportMode.PREVIEW]: "미리보기",
  [PdfExportMode.PRINT]: "출력",
};

/**
 * 본인확인여부 Enum
 */
export enum 본인확인여부 {
  미완료 = 0,
  완료 = 1,
  예외 = 2,
}

/**
 * 본인확인여부 Label
 */
export const 본인확인여부Label: Record<본인확인여부, string> = {
  [본인확인여부.미완료]: "본인확인필요",
  [본인확인여부.완료]: "본인확인완료",
  [본인확인여부.예외]: "본인확인예외",
};

export enum CodeType {
  없음 = 0,
  수가 = 1,
  준용수가 = 2,
  보험등재약 = 3,
  원료약조제약 = 4,
  보험등재약의일반명 = 5,
  치료재료 = 8,
}

export const CodeTypeLabel: Record<CodeType, string> = {
  [CodeType.없음]: "없음",
  [CodeType.수가]: "수가",
  [CodeType.준용수가]: "준용수가",
  [CodeType.보험등재약]: "보험등재약",
  [CodeType.원료약조제약]: "원료약 조제(제재)약",
  [CodeType.보험등재약의일반명]: "보험등재약의 일반명",
  [CodeType.치료재료]: "치료재료",
};

/**
 * 영수증 출력 위치(유형) Enum
 */
export enum ReceiptPrintLocation {
  없음 = 0,
  진찰료 = 1,
  입원료_1인실 = 2,
  입원료_2_3인실 = 3,
  입원료_4인실이상 = 4,
  식대 = 5,
  투약조제료_행위료 = 6,
  투약조제료_약품비 = 7,
  주사료_행위료 = 8,
  주사료_약품비 = 9,
  마취료 = 10,
  처치및수술료 = 11,
  검사료 = 12,
  영상진단료 = 13,
  방사선치료료 = 14,
  치료재료대 = 15,
  재활및물리치료료 = 16,
  정신요법료 = 17,
  전혈및혈액성분제제료 = 18,
  CT진단료 = 19,
  MRI진단료 = 20,
  PET진단료 = 21,
  초음파진단료 = 22,
  보철교정료 = 23,
  제증명수수료 = 24,
  선별급여 = 25,
  정액65세이상등 = 26,
  질병군포괄수가 = 27,
  상한액초과금 = 28,
}

/**
 * 영수증 출력 위치(유형) Label
 */
export const ReceiptPrintLocationLabel: Record<ReceiptPrintLocation, string> = {
  [ReceiptPrintLocation.없음]: "없음",
  [ReceiptPrintLocation.진찰료]: "진찰료",
  [ReceiptPrintLocation.입원료_1인실]: "[입원료] 1인실",
  [ReceiptPrintLocation.입원료_2_3인실]: "[입원료] 2·3인실",
  [ReceiptPrintLocation.입원료_4인실이상]: "[입원료] 4인실 이상",
  [ReceiptPrintLocation.식대]: "식대",
  [ReceiptPrintLocation.투약조제료_행위료]: "[투약 및 조제료] 행위료",
  [ReceiptPrintLocation.투약조제료_약품비]: "[투약 및 조제료] 약품비",
  [ReceiptPrintLocation.주사료_행위료]: "[주사료] 행위료",
  [ReceiptPrintLocation.주사료_약품비]: "[주사료] 약품비",
  [ReceiptPrintLocation.마취료]: "마취료",
  [ReceiptPrintLocation.처치및수술료]: "처치 및 수술료",
  [ReceiptPrintLocation.검사료]: "검사료",
  [ReceiptPrintLocation.영상진단료]: "영상진단료",
  [ReceiptPrintLocation.방사선치료료]: "방사선치료료",
  [ReceiptPrintLocation.치료재료대]: "치료재료대",
  [ReceiptPrintLocation.재활및물리치료료]: "재활 및 물리치료료",
  [ReceiptPrintLocation.정신요법료]: "정신요법료",
  [ReceiptPrintLocation.전혈및혈액성분제제료]: "전혈 및 혈액성분제제료",
  [ReceiptPrintLocation.CT진단료]: "CT 진단료",
  [ReceiptPrintLocation.MRI진단료]: "MRI 진단료",
  [ReceiptPrintLocation.PET진단료]: "PET 진단료",
  [ReceiptPrintLocation.초음파진단료]: "초음파 진단료",
  [ReceiptPrintLocation.보철교정료]: "보철·교정료",
  [ReceiptPrintLocation.제증명수수료]: "제증명수수료",
  [ReceiptPrintLocation.선별급여]: "선별급여",
  [ReceiptPrintLocation.정액65세이상등]: "정액 65세 이상 등",
  [ReceiptPrintLocation.질병군포괄수가]: "질병군 포괄수가",
  [ReceiptPrintLocation.상한액초과금]: "상한액 초과금",
};
