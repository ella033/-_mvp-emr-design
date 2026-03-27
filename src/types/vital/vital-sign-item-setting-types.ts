// ================================ 바이탈사인아이템설정 기본 ================================
export interface VitalSignItemSettingBase {
  hospitalId: number;
  itemId: number;
  sortNumber: number;
  isActive: boolean;
}

// ================================ 바이탈사인아이템설정 정보 ================================
export interface VitalSignItemSetting extends VitalSignItemSettingBase {
  id: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

// ================================ 바이탈사인아이템설정 생성 ================================
export interface CreateVitalSignItemSettingRequest
  extends VitalSignItemSettingBase {}

export interface CreateVitalSignItemSettingResponse {
  id: number;
}

// ================================ 바이탈사인아이템설정 수정 ================================
export interface UpdateVitalSignItemSettingRequest
  extends Partial<VitalSignItemSettingBase> {}

export interface UpdateVitalSignItemSettingResponse
  extends VitalSignItemSetting {}

// ================================ 바이탈사인아이템설정 삭제 ================================
export interface DeleteVitalSignItemSettingResponse {
  id: number;
}

// ================================ 바이탈사인아이템설정 일괄 저장 ================================
export interface UpsertVitalSignItemSettingsRequest {
  hospitalId: number;
  settings: {
    itemId: number;
    sortNumber: number;
    isActive: boolean;
  }[];
}

export interface UpsertVitalSignItemSettingsResponse {
  success: boolean;
  count: number;
}

// ================================ 바이탈사인아이템설정 일괄 삭제/수정 ================================
export interface UpsertManyVitalSignItemSettingsRequestItem {
  id?: number; // 기존 설정의 id (수정 시 필요, 신규 생성 시 생략)
  itemId: number;
  sortNumber: number;
  isActive: boolean;
}

export interface UpsertManyVitalSignItemSettingsRequest {
  items: UpsertManyVitalSignItemSettingsRequestItem[];
}

export interface UpsertManyVitalSignItemSettingsResponse {
  success: boolean;
  count: number;
}
