import type {
  VitalSignItem,
  VitalSignSubItem,
} from "./vital/vital-sign-items-types";

// ================================ 바이탈사인 측정 기본 ================================
export interface VitalSignMeasurementBase {
  hospitalId: number;
  patientId: number;
  measurementDateTime: string;
  itemId: number;
  subItemId?: number | null;
  value: number;
  memo?: string;
}

// ================================ 바이탈사인 측정 정보 ================================
export interface VitalSignMeasurement extends VitalSignMeasurementBase {
  id: string;
  createdId: number;
  createdDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  vitalSignItem: VitalSignItem;
  vitalSignSubItem?: VitalSignSubItem | null;
}

// ================================ 바이탈사인 측정 생성 ================================
export interface CreateVitalSignMeasurementRequest
  extends VitalSignMeasurementBase {}
export interface CreateVitalSignMeasurementResponse
  extends VitalSignMeasurement {}

// ================================ 바이탈사인 측정 수정 ================================
export interface UpdateVitalSignMeasurementRequest
  extends Partial<VitalSignMeasurementBase> {}
export interface UpdateVitalSignMeasurementResponse
  extends VitalSignMeasurement {}

// ================================ 바이탈사인 측정 여러 개 생성 또는 수정 ================================
export interface DeleteUpsertManyVitalSignMeasurementsRequest {
  items: (Omit<VitalSignMeasurementBase, "hospitalId" | "patientId"> & {
    id?: string;
  })[];
}
export interface DeleteUpsertManyVitalSignMeasurementsResponse {
  items: VitalSignMeasurement[];
}

// ================================ 바이탈사인 측정 삭제 ================================
export interface DeleteVitalSignMeasurementRequest {}
export interface DeleteVitalSignMeasurementResponse {
  id: string;
}
