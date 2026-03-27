import type { DisRegType } from "@/constants/common/common-enum";
import type { components } from "@/generated/api/types";

export type EligibilityCheckResponseDto = components["schemas"]["EligibilityCheckResponseDto"];

/**
 * 선택요양기관 정보
 */
export interface ChoiceHospital {
  id: number;
  code: string;
  name: string;
}

/**
 * 기타 자격 정보
 */
export interface EtcInfo {
  disRegType: DisRegType;
  disRegTypeToString?: string;
  specificCode?: string;
  registeredCode?: string;
  registeredDate?: Date | null;
  registeredDateToString?: string;
  endDate?: Date | null;
  endDateToString?: string;
  corporalCode?: string;
  corporalSerialNumber?: string;
}