import type { CalcResultData } from "./calc-result-data";
import type { Disease } from "./disease-types";
import type { Order } from "./order-types";
import type { SpecificDetail } from "./specific-detail-code-type";
import type { Registration } from "../registration-types";
import type { PciCheckResult } from "../pci/pci-types";
import type { SelfCheckResultData } from "../chart-check/chart-check-types";
import type {
  초재진,
  주간야간휴일구분,
  진료결과,
} from "@/constants/common/common-enum";

// ================================ 진료 기본 ================================
export interface EncounterBase {
  registrationId: string;
  patientId: number;
  encounterDateTime?: string;
  symptom?: string;
  memo?: string;
  doctorId?: number;
  specificDetail?: SpecificDetail[];
  isOrderFixed?: boolean;
  isClaim?: boolean;
  isFavorite?: boolean;
  receptionType?: 초재진;
  timeCategory?: 주간야간휴일구분;
  resultType?: 진료결과;
  pharmacyNotes?: string;
  diseases?: Disease[];
  orders?: Order[];
  registration?: Registration;
  calcResultData?: CalcResultData | null;
  chartCheckResultData?: SelfCheckResultData | null;
  pciCheckResultData?: PciCheckResult[] | null;
  specificSymbolResultData?: unknown | null;
  issuanceNumber?: string;
}

// ================================ 진료 정보 ================================
export interface Encounter extends EncounterBase {
  id: string;
  startDateTime: string | null;
  endDateTime: string | null;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

// ================================ 진료 생성 ================================
export interface CreateEncounterRequest extends EncounterBase {}
export interface CreateEncounterResponse {
  id: string;
}

// ================================ 진료 수정 ================================
export interface UpdateEncounterRequest extends EncounterBase {}
export interface UpdateEncounterResponse extends Encounter {}

// ================================ 진료 삭제 ================================
export interface DeleteEncounterRequest {}
export interface DeleteEncounterResponse {
  id: string;
}

// ================================ 원외처방전 교부번호 ================================
export interface EncounterIssuanceNumberResponse {
  issuanceNumber: string;
  sequenceNumber: number;
}
