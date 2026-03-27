// ================================ 바이탈사인 서브아이템 기본 ================================

export interface VitalSignSubItemBase {
  hospitalId: number;
  code: string;
  name: string;
  unit?: string | null;
  sortNumber: number;
  normalMinValue?: number | null;
  normalMaxValue?: number | null;
  maxIntegerDigits?: number | null;
  maxDecimalDigits?: number | null;
  description?: string | null;
}

// ================================ 바이탈사인 서브아이템 정보 ================================
export interface VitalSignSubItem extends VitalSignSubItemBase {
  id: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

export interface VitalSignSubItemGroup {
  itemId: number;
  subItems: VitalSignSubItem[];
}

// ================================ 바이탈사인 서브아이템 생성 ================================
export interface CreateVitalSignSubItemRequest extends VitalSignSubItemBase {}
export interface CreateVitalSignSubItemResponse {
  id: number;
}

// ================================ 바이탈사인 서브아이템 수정 ================================
export interface UpdateVitalSignSubItemRequest
  extends Partial<Omit<VitalSignSubItemBase, "hospitalId">> {}
export interface UpdateVitalSignSubItemResponse extends VitalSignSubItem {}

// ================================ 바이탈사인 서브아이템 삭제 ================================
export interface DeleteVitalSignSubItemRequest {}
export interface DeleteVitalSignSubItemResponse {
  id: number;
}
