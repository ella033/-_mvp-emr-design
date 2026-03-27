import { InOut } from "@/constants/master-data-enum";
import type { SpecificDetail } from "./specific-detail-code-type";
import type { SpecimenDetail } from "./specimen-detail-code-type";
import { PrescriptionType } from "@/constants/master-data-enum";
import { BundlePriceType } from "@/constants/bundle-price-type";
import type { ExternalLabData } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";
import type { CodeType, ReceiptPrintLocation } from "@/constants/common/common-enum";

export enum InputType {
  일반 = 0,
  지시오더 = 1,
  구분선 = 2,
  묶음헤더 = 3,
}

export enum InputSource {
  없음 = 0,
  자동처방 = 1,
  예약처방 = 2,
  구두처방 = 3,
}

// ================================ 처방 기본 ================================
export interface OrderBase {
  encounterId?: string;
  sortNumber?: number | null;
  parentSortNumber?: number | null;
  userCode: string;
  claimCode: string;
  name: string;
  classificationCode: string;
  itemType: string;
  codeType: CodeType;
  inOutType: InOut;
  oneTwoType: number;
  drugAtcCode?: string;
  relativeValueScore?: number;
  insurancePrice: number;
  generalPrice: number;
  actualPrice?: number;
  incentivePrice?: number;
  carInsurancePrice?: number; // 기획되진 않았으나 DB 구조상 넘겨줘야 함.
  bundlePriceType?: BundlePriceType;
  bundlePrice?: number;
  receiptPrintLocation?: ReceiptPrintLocation;
  dose: number;
  days: number;
  times: number;
  isPowder: boolean;
  usage?: string;
  specification?: string;
  unit?: string;
  exceptionCode?: string;
  paymentMethod: number;
  isSelfPayRate30: boolean;
  isSelfPayRate50: boolean;
  isSelfPayRate80: boolean;
  isSelfPayRate90: boolean;
  isSelfPayRate100: boolean;
  isClaim: boolean;
  treatmentDateTime?: string;
  specificDetail?: SpecificDetail[];
  specimenDetail?: SpecimenDetail[];
  externalLabData?: ExternalLabData;
  userCodeId?: number;
  type?: PrescriptionType;
  typePrescriptionLibraryId?: number;
  prescriptionLibraryId?: number;
  inputType?: InputType;
  inputSource?: InputSource;
  bundleItemId?: number;
  parentBundleItemId?: number;
}

// ================================ 처방 정보 ================================
export interface Order extends OrderBase {
  id: string;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

// ================================ 처방 생성 ================================
export interface CreateOrderRequest extends OrderBase {}
export interface CreateOrderResponse extends Order {}

// ================================ 처방 수정 ================================
export interface UpdateOrderRequest extends Partial<OrderBase> {}
export interface UpdateOrderResponse extends Order {}

// ================================ 처방 여러 개 생성 또는 수정 ================================
export interface UpsertManyOrders {
  id?: string;
  // 수정되는 정보
  parentSortNumber: number | null;
  sortNumber: number;
  name?: string; // null/undefined면 프로퍼티 제외
  dose: number;
  days: number;
  times: number;
  isPowder: boolean;
  usage?: string;
  specification?: string;
  unit?: string;
  exceptionCode?: string;
  paymentMethod: number;
  specimenDetail: SpecimenDetail[];
  isClaim: boolean;
  specificDetail: SpecificDetail[];
  // 수정되지 않는 정보
  userCode?: string;
  claimCode?: string;
  classificationCode?: string;
  itemType?: string;
  codeType?: CodeType;
  oneTwoType: number;
  inOutType: InOut;
  drugAtcCode?: string;
  relativeValueScore: number;
  insurancePrice: number;
  generalPrice?: number;
  actualPrice?: number;
  incentivePrice?: number;
  carInsurancePrice?: number; // 기획되진 않았으나 DB 구조상 넘겨줘야 함.
  userCodeId?: number;
  type?: PrescriptionType;
  typePrescriptionLibraryId?: number;
  bundleItemId?: number;
  parentBundleItemId?: number;
  inputType?: InputType;
}

export interface UpsertManyOrdersRequest {
  items: UpsertManyOrders[];
}

// ================================ 처방 삭제 ================================
export interface DeleteOrderRequest {}
export interface DeleteOrderResponse {
  id: string;
}
