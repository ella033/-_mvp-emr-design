import type { VitalSignItemSetting } from "./vital-sign-item-setting-types";

// ================================ 바이탈사인 아이템 기본 ================================
export interface VitalSignItemBase {
  hospitalId: number;
  code: string;
  name: string;
  unit?: string;
  sortNumber: number;
  normalMinValue?: number;
  normalMaxValue?: number;
  maxIntegerDigits?: number;
  maxDecimalDigits?: number;
  minValue?: number;
  maxValue?: number;
  description?: string;
  vitalSignItemSettings: VitalSignItemSetting[];
}

// ================================ 바이탈사인 아이템 정보 ================================
export interface VitalSignItem extends VitalSignItemBase {
  id: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

// ================================ 바이탈사인 아이템 생성 ================================
export interface CreateVitalSignItemRequest extends VitalSignItemBase {}
export interface CreateVitalSignItemResponse {
  id: number;
}

// ================================ 바이탈사인 아이템 수정 ================================
export interface UpdateVitalSignItemRequest
  extends Partial<Omit<VitalSignItemBase, "hospitalId">> {}
export interface UpdateVitalSignItemResponse extends VitalSignItem {}

// ================================ 바이탈사인 아이템 삭제 ================================
export interface DeleteVitalSignItemRequest {}
export interface DeleteVitalSignItemResponse {
  id: number;
}
