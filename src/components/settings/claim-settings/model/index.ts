/** 청구 단위 구분자 */
export type ClaimUnitType = "monthly" | "weekly";

/** 청구 설정 전체 모델 */
export type ClaimSettings = {
  /** 청구 단위: 월단위(monthly) 또는 주단위(weekly) */
  claimUnit: ClaimUnitType;
  /** 주단위 선택 시 구분자 (1~6) */
  weeklyUnitCode?: number;

  /** 청구 담당자 성명 */
  claimManagerName: string;
  /** 청구 담당자 생년월일 (YYYY-MM-DD) */
  claimManagerBirthDate: string;

  /** HIRA 사전점검 사용 여부 */
  useHiraPreCheck: boolean;

  /** 검사승인번호 (읽기 전용) */
  inspectionApprovalNumber: string;

  /** 대행청구 업체명 */
  proxyAgencyName: string;
  /** 대행청구 업체기호 */
  proxyAgencyCode: string;
};

/** 청구 설정 저장 요청 DTO (검사승인번호 제외) */
export type SaveClaimSettingsRequest = Omit<
  ClaimSettings,
  "inspectionApprovalNumber"
>;

/** 청구 설정 기본값 */
export const DEFAULT_CLAIM_SETTINGS: ClaimSettings = {
  claimUnit: "monthly",
  claimManagerName: "",
  claimManagerBirthDate: "",
  useHiraPreCheck: false,
  inspectionApprovalNumber: "",
  proxyAgencyName: "",
  proxyAgencyCode: "",
};
