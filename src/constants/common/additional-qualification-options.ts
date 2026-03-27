/**
 * 추가자격사항 옵션 목록
 * EligibilityCheckResponseDto의 DiseaseRegistrationPersonBase 필드와 매핑
 */
export interface AdditionalQualificationOption {
  /** EligibilityCheckResponseDto의 키 (한글 필드명) */
  eligibilityKey: string;
  /** 표시용 라벨 */
  label: string;
  /** DisRegManager의 속성 키 (하위 호환성용, 향후 제거 예정) */
  disRegKey?: string;
  /** 모달에 표시 여부 (기본값: true) */
  showInModal?: boolean;
}

/**
 * 추가자격사항 옵션 목록
 * EligibilityCheckResponseDto의 모든 추가자격 관련 필드 포함
 */
export const ADDITIONAL_QUALIFICATION_OPTIONS: AdditionalQualificationOption[] = [
  // DiseaseRegistrationPersonBase 타입 필드들
  {
    eligibilityKey: "산정특례암등록대상자1",
    label: "중증 암",
    disRegKey: "hardSickCancerCur",
  },
  {
    eligibilityKey: "산정특례화상등록대상자",
    label: "중증 화상",
    disRegKey: "hardSickBurnCur",
  },
  {
    eligibilityKey: "산정특례희귀질환등록대상자",
    label: "희귀난치 산정특례",
    disRegKey: "rDisCur",
  },
  {
    eligibilityKey: "산정특례중증난치질환등록대상자",
    label: "중증난치 산정특례",
    disRegKey: "rDisHardCur",
  },
  {
    eligibilityKey: "산정특례결핵등록대상자",
    label: "결핵 산정특례",
    disRegKey: "rDisTuberCur",
  },
  {
    eligibilityKey: "산정특례극희귀등록대상자",
    label: "극희귀 산정특례",
    disRegKey: "rDisExtremeCur",
  },
  {
    eligibilityKey: "산정특례상세불명희귀등록대상자",
    label: "상세불명희귀 산정특례",
    disRegKey: "rDisUnspecifiedCur",
  },
  {
    eligibilityKey: "산정특례기타염색체이상질환등록대상자",
    label: "기타염색체 산정특례",
    disRegKey: "rDisEtcChromosomeCur",
  },
  {
    eligibilityKey: "산정특례잠복결핵등록대상자",
    label: "잠복결핵",
    disRegKey: "latentTuberCur",
  },
  {
    eligibilityKey: "산정특례중증치매등록대상자",
    label: "중증치매 산정특례",
    disRegKey: "dementiaMainCur",
  },
  // 기타 추가자격 필드들
  {
    eligibilityKey: "희귀난치의료비지원대상자",
    label: "희귀난치 본인부담지원 (본인부담0원)",
    disRegKey: "rDisOld",
  },
  {
    eligibilityKey: "당뇨병요양비대상자유형",
    label: "당뇨병 요양비 대상자",
    disRegKey: "diabetesCd",
  },
  {
    eligibilityKey: "급여제한여부",
    label: "급여제한",
    disRegKey: "qualRestrictCd",
  },
  {
    eligibilityKey: "출국자여부",
    label: "출국자",
    disRegKey: "etc",
  },
  {
    eligibilityKey: "조산아및저체중출생아등록대상자",
    label: "조산/저체중아",
    disRegKey: "pretermChildCur",
  },
  {
    eligibilityKey: "요양병원입원여부",
    label: "요양병원 입원 여부",
    disRegKey: "convalescentHosAdmStatusCur",
  },
  {
    eligibilityKey: "비대면진료대상정보",
    label: "비대면진료",
    disRegKey: "nonFaceToFaceCur",
  },
  {
    eligibilityKey: "방문진료대상정보",
    label: "방문진료",
    showInModal: false,
  },
  {
    eligibilityKey: "자립준비청년대상자",
    label: "자립준비청년",
    disRegKey: "readyForSelfRelianceCur",
  },
  {
    eligibilityKey: "본인부담차등여부",
    label: "본인부담 차등대상",
    disRegKey: "chronicIntegrated",
  },
  // 치료재료/행위 감경대상자는 별도 필드가 없을 수 있으므로 확인 필요
  // 방문진료 본인부담 경감도 별도 필드 확인 필요
];

/**
 * EligibilityCheckResponseDto 키로 옵션 찾기
 */
export function getOptionByEligibilityKey(
  eligibilityKey: string
): AdditionalQualificationOption | undefined {
  return ADDITIONAL_QUALIFICATION_OPTIONS.find(
    (opt) => opt.eligibilityKey === eligibilityKey
  );
}

/**
 * DisRegManager 키로 옵션 찾기 (하위 호환성용)
 */
export function getOptionByDisRegKey(
  disRegKey: string
): AdditionalQualificationOption | undefined {
  return ADDITIONAL_QUALIFICATION_OPTIONS.find(
    (opt) => opt.disRegKey === disRegKey
  );
}

/**
 * StringDataField 타입 필드 키 (components.ts 기준: { data: string })
 * 자격조회 응답에서 { data: "값" } 형태를 가지는 필드들
 */
export const STRING_DATA_FIELD_KEYS = new Set([
  "당뇨병요양비대상자유형",
  "급여제한여부",
  "출국자여부",
  "요양병원입원여부",
  "본인부담차등여부",
  "급여제한일자",
]);

/**
 * 별도 고유 타입 필드 키 (StringDataField / DiseaseRegistrationPersonBase가 아닌 타입)
 * - 자립준비청년대상자: SelfPreparationPersonInfo { 특정기호, 지원시작일, 지원종료일 }
 * - 조산아및저체중출생아등록대상자: PreInfantInfo { 등록번호, 시작유효일자, 종료유효일자 }
 * - 비대면진료대상정보: NonFaceToFaceDiagnosisInfo { 원본데이터, 섬벽지거주여부, ... }
 * - 방문진료대상정보: VisitMedicalCareTargetInfo { 원본데이터, 요양비인공호흡기산소치료대상여부, 장기요양대상여부 }
 */
export const SPECIAL_TYPE_FIELD_KEYS = new Set([
  "자립준비청년대상자",
  "조산아및저체중출생아등록대상자",
  "비대면진료대상정보",
  "방문진료대상정보",
]);

/**
 * DiseaseRegistrationPersonBase 타입 필드 키
 * 공통 필드: 등록일, 특정기호, 등록번호 등
 */
export const DISEASE_REGISTRATION_KEYS = new Set([
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
]);

